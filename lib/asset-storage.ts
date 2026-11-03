/**
 * Helper penyimpanan aset (server-only).
 * Dipakai bersama oleh server action (aset desain) dan route handler
 * unggah musik agar validasi & penamaan aset konsisten.
 */

import { randomUUID } from "crypto";
import { getSupabaseAdmin, SUPABASE_ASSET_BUCKET } from "@/lib/supabase";
import {
  MUSIC_UPLOAD_CHUNK_SIZE,
  validateAssetFile,
} from "@/lib/asset-limits";
import type { AssetType } from "@/generated/prisma/client";

export const ASSET_TYPES: AssetType[] = [
  "IMAGE",
  "FRAME",
  "DECOR",
  "BACKGROUND",
  "MUSIC",
  "GALLERY",
];

// Ekstensi file harus mengikuti MIME aslinya, bukan sekadar segmen setelah "/".
const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "audio/mpeg": "mp3",
  "audio/mp3": "mp3",
  "audio/wav": "wav",
  "audio/x-wav": "wav",
  "audio/ogg": "ogg",
  "audio/mp4": "m4a",
  "audio/x-m4a": "m4a",
  "audio/aac": "aac",
  "audio/webm": "weba",
};

export function isValidAssetType(value: string): value is AssetType {
  return (ASSET_TYPES as string[]).includes(value);
}

/**
 * Nama aset dibuat otomatis — admin tidak perlu menulis judul.
 * Diambil dari nama file (tanpa ekstensi), tanda hubung/garis bawah
 * jadi spasi, dibatasi 120 karakter. Fallback: "<Tipe> <tanggal>".
 */
export function deriveAssetName(
  raw: string | null | undefined,
  type: AssetType,
): string {
  const cleaned = (raw ?? "")
    .replace(/\.[^.]+$/, "") // buang ekstensi
    .replace(/[-_]+/g, " ") // hubung/garis bawah jadi spasi
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
  if (cleaned.length >= 2) return cleaned;
  return `${type.charAt(0)}${type.slice(1).toLowerCase()} ${new Date().toISOString().slice(0, 10)}`;
}

/** Pastikan bucket aset tersedia; kembalikan pesan error bila gagal. */
export async function ensureAssetBucket(): Promise<string | null> {
  const supabase = getSupabaseAdmin();

  const { error } = await supabase.storage.getBucket(SUPABASE_ASSET_BUCKET);
  if (!error) return null;

  const { error: createError } = await supabase.storage.createBucket(
    SUPABASE_ASSET_BUCKET,
    { public: true },
  );
  if (createError) {
    return `Bucket storage belum siap (${createError.message}). Buat bucket "${SUPABASE_ASSET_BUCKET}" secara manual di Supabase.`;
  }
  return null;
}

/** Upload satu file ke bucket aset; kembalikan URL publik atau pesan error. */
export async function uploadAssetFile(
  file: File,
  folder: string,
): Promise<{ url: string } | { error: string }> {
  const ext = EXT_BY_MIME[file.type] ?? "bin";
  const path = `${folder}/${randomUUID()}.${ext}`;
  const supabase = getSupabaseAdmin();

  const arrayBuffer = await file.arrayBuffer();
  const { error: uploadError } = await supabase.storage
    .from(SUPABASE_ASSET_BUCKET)
    .upload(path, arrayBuffer, { contentType: file.type, upsert: false });

  if (uploadError) {
    return { error: `Gagal upload "${file.name}": ${uploadError.message}` };
  }

  const { data } = supabase.storage.from(SUPABASE_ASSET_BUCKET).getPublicUrl(path);
  return { url: data.publicUrl };
}

/** Validasi semua file sebelum diunggah — gagal satu berarti batch dibatalkan. */
export function validateAssetFiles(files: File[], type: AssetType): string[] {
  const errors: string[] = [];

  if (type === "MUSIC" && files.length > MUSIC_UPLOAD_CHUNK_SIZE) {
    errors.push(`Maksimal ${MUSIC_UPLOAD_CHUNK_SIZE} file musik per pengiriman.`);
  }

  for (const file of files) {
    const error = validateAssetFile(file, type);
    if (error) errors.push(error);
  }

  return errors;
}
