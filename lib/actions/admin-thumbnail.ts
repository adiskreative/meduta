"use server";

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const execFileAsync = promisify(execFile);

/**
 * Regenerasi thumbnail statis satu template (public/thumbs/<key>.webp).
 * Dipanggil dari tombol "Perbarui Thumbnail" di Admin → Kelola Template.
 * Pipeline sama dengan scripts/generate-thumbs.mjs (ukur tinggi via
 * ShotReporter → screenshot full-page Chrome headless → potong → WebP).
 */

const CHROME_CANDIDATES = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
];

const THUMB_W = 390;

function findChrome(): string {
  for (const p of CHROME_CANDIDATES) {
    if (fs.existsSync(p)) return p;
  }
  throw new Error(
    "Chrome/Edge tidak ditemukan di server ini. Instal Chrome atau jalankan: npm run thumbs",
  );
}

async function measureHeight(chrome: string, profile: string, url: string): Promise<number> {
  const { stdout } = await execFileAsync(
    chrome,
    [
      "--headless=new",
      "--disable-gpu",
      "--no-first-run",
      "--disable-extensions",
      `--user-data-dir=${profile}`,
      "--window-size=390,900",
      "--virtual-time-budget=12000",
      "--dump-dom",
      url,
    ],
    { timeout: 90_000, maxBuffer: 50 * 1024 * 1024 },
  );
  const m = stdout.match(/<title>SHOT:(\d+)<\/title>/);
  if (!m) throw new Error("Tinggi konten tidak terbaca dari halaman preview.");
  return Number(m[1]);
}

async function takeScreenshot(
  chrome: string,
  profile: string,
  url: string,
  height: number,
  outFile: string,
): Promise<void> {
  await execFileAsync(
    chrome,
    [
      "--headless=new",
      "--disable-gpu",
      "--no-first-run",
      "--disable-extensions",
      "--hide-scrollbars",
      `--user-data-dir=${profile}`,
      `--window-size=390,${height}`,
      `--screenshot=${outFile}`,
      "--timeout=40000",
      url,
    ],
    { timeout: 120_000 },
  );
  if (!fs.existsSync(outFile)) {
    throw new Error("Chrome tidak menulis file screenshot.");
  }
}

export type ThumbState = { ok?: boolean; message?: string };

export async function regenerateThumbnail(templateId: string): Promise<ThumbState> {
  const session = await auth();
  if (!session?.user) return { ok: false, message: "Harus login." };
  if (session.user.role !== "ADMIN") {
    return { ok: false, message: "Hanya admin yang bisa memperbarui thumbnail." };
  }

  const template = await prisma.template.findUnique({
    where: { id: templateId },
    select: { componentKey: true },
  });
  if (!template) return { ok: false, message: "Template tidak ditemukan." };

  const key = template.componentKey;
  const chrome = findChrome();
  const profile = path.resolve(`.tmp-chrome-profile-${Date.now()}`);
  const tmpDir = path.resolve(".tmp-thumbs");
  fs.mkdirSync(tmpDir, { recursive: true });

  // Base URL dari host request admin — bekerja di port/domain mana pun
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const base = `${proto}://${host}`;
  const url = `${base}/preview/${key}?shot=1`;

  try {
    const contentH = await measureHeight(chrome, profile, url);
    const png = path.join(tmpDir, `${key}-full.png`);
    await takeScreenshot(chrome, profile, url, contentH + 40, png);

    const sharp = (await import("sharp")).default;
    const { data, info } = await sharp(png).raw().toBuffer({ resolveWithObject: true });

    // Cari baris konten terakhir — buang area kosong di bawah
    let lastContent = info.height - 1;
    outer: for (let y = info.height - 1; y >= 0; y--) {
      for (let x = 0; x < info.width; x += 4) {
        const i = (y * info.width + x) * info.channels;
        if (!(data[i] > 246 && data[i + 1] > 246 && data[i + 2] > 246)) {
          lastContent = y;
          break outer;
        }
      }
    }
    const cropH = Math.min(info.height, lastContent + 24);
    const outDir = path.resolve("public/thumbs");
    fs.mkdirSync(outDir, { recursive: true });
    const out = path.join(outDir, `${key}.webp`);
    await sharp(png)
      .extract({ left: 0, top: 0, width: info.width, height: cropH })
      .resize({ width: THUMB_W, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(out);

    // Perbarui manifest dimensi (dibaca LiveTemplatePreview untuk pan presisi)
    const metaPath = path.resolve("lib/thumbs-meta.json");
    let meta: Record<string, { w: number; h: number }> = {};
    try {
      meta = JSON.parse(fs.readFileSync(metaPath, "utf8"));
    } catch {
      meta = {};
    }
    meta[key] = { w: Math.min(info.width, THUMB_W), h: Math.round((cropH * THUMB_W) / info.width) };
    fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2));

    revalidatePath("/");
    revalidatePath("/dashboard/pilih-tema");
    revalidatePath("/admin/templates");
    return { ok: true, message: `Thumbnail ${key} diperbarui (${cropH}px).` };
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : "Gagal meregenerasi thumbnail.",
    };
  } finally {
    fs.rmSync(profile, { recursive: true, force: true });
    fs.rmSync(path.join(tmpDir, `${key}-full.png`), { force: true });
  }
}
