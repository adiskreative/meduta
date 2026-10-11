"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { randomUUID } from "crypto";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSupabaseAdmin, SUPABASE_ASSET_BUCKET } from "@/lib/supabase";
import { AssetType } from "@/generated/prisma/client";

const ASSET_TYPES: AssetType[] = [
  "IMAGE",
  "FRAME",
  "DECOR",
  "BACKGROUND",
  "MUSIC",
  "GALLERY",
];

const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_IMAGE = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const ALLOWED_MUSIC = new Set(["audio/mpeg", "audio/mp3", "audio/wav", "audio/ogg"]);

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");
  return session.user.id;
}

function isValidAssetType(value: string): value is AssetType {
  return (ASSET_TYPES as string[]).includes(value);
}

/**
 * Nama aset dibuat otomatis — admin tidak perlu menulis judul.
 * Diambil dari nama file (tanpa ekstensi), tanda hubung/garis bawah
 * jadi spasi, dibatasi 120 karakter. Fallback: "<Tipe> <tanggal>".
 */
function deriveAssetName(raw: string | null | undefined, type: AssetType): string {
  const cleaned = (raw ?? "")
    .replace(/\.[^.]+$/, "") // buang ekstensi
    .replace(/[-_]+/g, " ") // hubung/garis bawah jadi spasi
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
  if (cleaned.length >= 2) return cleaned;
  return `${type.charAt(0)}${type.slice(1).toLowerCase()} ${new Date().toISOString().slice(0, 10)}`;
}

export type AdminAssetState = {
  errors?: {
    name?: string[];
    type?: string[];
    url?: string[];
    thumbnail?: string[];
    file?: string[];
  };
  message?: string;
  success?: boolean;
};

// Buat aset dari URL eksternal (tidak upload file)
export async function createAssetFromUrl(
  _state: AdminAssetState | undefined,
  formData: FormData,
): Promise<AdminAssetState> {
  const adminId = await requireAdmin();

  const schema = z.object({
    type: z.enum(["IMAGE", "FRAME", "DECOR", "BACKGROUND", "MUSIC", "GALLERY"]),
    url: z.string().min(1, "URL wajib diisi").url("URL tidak valid").max(500).trim(),
    thumbnail: z.string().url("Thumbnail harus URL").trim().optional().or(z.literal("")),
  });

  const result = schema.safeParse({
    type: formData.get("type"),
    url: formData.get("url"),
    thumbnail: formData.get("thumbnail") ?? "",
  });

  if (!result.success) {
    return { errors: result.error.flatten().fieldErrors };
  }

  // Nama otomatis dari segmen terakhir URL (tanpa ekstensi)
  let fileName: string | null = null;
  try {
    fileName = new URL(result.data.url).pathname.split("/").filter(Boolean).pop() ?? null;
  } catch {
    fileName = null;
  }

  await prisma.templateAsset.create({
    data: {
      adminId,
      name: deriveAssetName(fileName, result.data.type),
      type: result.data.type,
      url: result.data.url,
      thumbnail: result.data.thumbnail || null,
      meta: {},
    },
  });

  revalidatePath("/admin/assets");
  return { success: true, message: "Aset berhasil ditambahkan." };
}

// Buat aset dengan upload file ke Supabase
export async function createAssetFromUpload(
  _state: AdminAssetState | undefined,
  formData: FormData,
): Promise<AdminAssetState> {
  const adminId = await requireAdmin();

  const type = String(formData.get("type") ?? "");
  if (!isValidAssetType(type)) {
    return { errors: { type: ["Tipe aset tidak valid."] } };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { errors: { file: ["Pilih file terlebih dahulu."] } };
  }

  const isMusic = type === "MUSIC";
  const allowed = isMusic ? ALLOWED_MUSIC : ALLOWED_IMAGE;
  if (!allowed.has(file.type)) {
    return {
      errors: {
        file: [
          isMusic
            ? "Format musik tidak didukung (Gunakan MP3, WAV, atau OGG)."
            : "Format tidak didukung. Gunakan JPG, PNG, WebP, atau GIF.",
        ],
      },
    };
  }
  if (file.size > MAX_SIZE) {
    return { errors: { file: ["Ukuran file maksimal 10MB."] } };
  }

  // Nama otomatis dari nama file yang diunggah
  const name = deriveAssetName(file.name, type as AssetType);

  const ext = file.type.split("/")[1] === "jpeg" ? "jpg" : file.type.split("/")[1];
  const path = `${type.toLowerCase()}/${randomUUID()}.${ext}`;

  const supabase = getSupabaseAdmin();

  const { error: listError } = await supabase.storage.getBucket(SUPABASE_ASSET_BUCKET);
  if (listError) {
    const { error: createError } = await supabase.storage.createBucket(
      SUPABASE_ASSET_BUCKET,
      { public: true },
    );
    if (createError) {
      return {
        errors: {
          file: [
            `Bucket storage belum siap (${createError.message}). Buat bucket "${SUPABASE_ASSET_BUCKET}" secara manual di Supabase.`,
          ],
        },
      };
    }
  }

  const arrayBuffer = await file.arrayBuffer();
  const { error: uploadError } = await supabase.storage
    .from(SUPABASE_ASSET_BUCKET)
    .upload(path, arrayBuffer, { contentType: file.type, upsert: false });

  if (uploadError) {
    return { errors: { file: [`Gagal upload: ${uploadError.message}`] } };
  }

  const { data: urlData } = supabase.storage.from(SUPABASE_ASSET_BUCKET).getPublicUrl(path);

  await prisma.templateAsset.create({
    data: {
      adminId,
      name,
      type: type as AssetType,
      url: urlData.publicUrl,
      thumbnail: urlData.publicUrl,
      meta: {},
    },
  });

  revalidatePath("/admin/assets");
  return { success: true, message: "Aset berhasil diunggah." };
}

export async function deleteAsset(assetId: string) {
  await requireAdmin();

  const asset = await prisma.templateAsset.findUnique({
    where: { id: assetId },
    include: { _count: { select: { decorations: true } } },
  });
  if (!asset) throw new Error("Aset tidak ditemukan.");
  if (asset._count.decorations > 0) {
    throw new Error("Aset masih dipakai dekorasi template. Hapus dekorasinya dulu.");
  }

  await prisma.templateAsset.delete({ where: { id: assetId } });
  revalidatePath("/admin/assets");
  revalidatePath("/admin/templates");
}
