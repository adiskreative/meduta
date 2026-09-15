/**
 * Regenerasi thumbnail statis semua template (public/thumbs/<key>.webp).
 *
 * Cara pakai:
 *   1. Pastikan dev server berjalan (default http://localhost:3000).
 *   2. node scripts/generate-thumbs.mjs [--base http://localhost:3000] [--keys zen,classic]
 *
 * Pipeline per template:
 *   a. Ukur tinggi konten via ?shot=1 (ShotReporter menulis ke document.title)
 *   b. Screenshot full-page Chrome headless dengan tinggi pas (tanpa potongan)
 *   c. Potong area kosong bawah + resize 480px + WebP q80
 *
 * Thumbnail dipakai LiveTemplatePreview (landing & Pilih Tema) sebagai
 * pengganti iframe live agar halaman daftar template jauh lebih ringan.
 */

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const execFileAsync = promisify(execFile);

const CHROME_CANDIDATES = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
];

const KEYS = [
  "classic",
  "minimal",
  "floral",
  "rustic",
  "berkreative",
  "garden",
  "botanical",
  "zen",
];

function parseArgs() {
  const args = process.argv.slice(2);
  const get = (name, fallback) => {
    const i = args.indexOf(name);
    return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
  };
  return {
    base: get("--base", "http://localhost:3000"),
    keys: get("--keys", null),
    width: Number(get("--width", "390")),
    outDir: get("--out", "public/thumbs"),
  };
}

function findChrome() {
  for (const p of CHROME_CANDIDATES) {
    if (fs.existsSync(p)) return p;
  }
  throw new Error("Chrome/Edge tidak ditemukan. Install Chrome atau set path manual di script.");
}

async function measureHeight(chrome, profile, url) {
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
  if (!m) throw new Error(`Tinggi konten tidak terbaca dari ${url}`);
  return Number(m[1]);
}

async function screenshot(chrome, profile, url, height, outFile) {
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
}

async function main() {
  const { base, keys, width, outDir } = parseArgs();
  const list = keys ? keys.split(",").map((k) => k.trim()) : KEYS;
  const chrome = findChrome();
  // Profil Chrome unik per run + path absolut: menghindari bentrok lock
  // dengan proses headless lain & error "tidak dapat membaca/menulis
  // direktori datanya" bila folder lama terhapus saat proses masih hidup.
  const profile = path.resolve(`.tmp-chrome-profile-${Date.now()}`);
  const tmpDir = path.resolve(".tmp-thumbs");
  const outDirAbs = path.resolve(outDir);
  fs.mkdirSync(tmpDir, { recursive: true });
  fs.mkdirSync(outDirAbs, { recursive: true });

  console.log(`Chrome: ${chrome}`);
  console.log(`Base:   ${base}`);
  console.log(`Keys:   ${list.join(", ")}\n`);

  for (const key of list) {
    try {
      const url = `${base}/preview/${key}?shot=1`;
      process.stdout.write(`[${key}] mengukur tinggi... `);
      const contentH = await measureHeight(chrome, profile, url);
      const shotH = contentH + 40;
      process.stdout.write(`${contentH}px → screenshot... `);

      const png = path.join(tmpDir, `${key}-full.png`);
      await screenshot(chrome, profile, url, shotH, png);
      if (!fs.existsSync(png)) {
        throw new Error("Chrome tidak menulis file screenshot (cek tinggi window/perintah)");
      }

      // Potong area kosong di bawah + resize + WebP
      const { data, info } = await sharp(png).raw().toBuffer({ resolveWithObject: true });
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
      const out = path.join(outDirAbs, `${key}.webp`);
      await sharp(png)
        .extract({ left: 0, top: 0, width: info.width, height: cropH })
        .resize({ width: 480, withoutEnlargement: true })
        .webp({ quality: 80 })
        .toFile(out);

      const kb = Math.round(fs.statSync(out).size / 1024);
      console.log(`OK ${info.width}x${cropH} → ${kb}KB`);
    } catch (err) {
      console.error(`[${key}] GAGAL: ${err.message}`);
    }
  }

  // Bersihkan profil sementara agar tidak menumpuk
  fs.rmSync(profile, { recursive: true, force: true });
}

main();
