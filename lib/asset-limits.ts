/**
 * Batas unggah aset di admin panel.
 * Modul ini murni (tanpa dependensi server) supaya bisa dipakai bersama
 * oleh form (client), server action, dan route handler.
 */

import type { AssetType } from "@/generated/prisma/client";

/** Ukuran maksimal per file aset (gambar maupun musik). */
export const MAX_ASSET_FILE_MB = 10;
export const MAX_ASSET_FILE_BYTES = MAX_ASSET_FILE_MB * 1024 * 1024;

/**
 * Jumlah file musik yang boleh dipilih sekali unggah di form.
 * File dikirim bertahap ke server, jadi batas ini hanya batas pilihan.
 */
export const MAX_MUSIC_FILES_PER_UPLOAD = 30;

/** Jumlah file musik maksimal per satu request unggah. */
export const MUSIC_UPLOAD_CHUNK_SIZE = 5;

/**
 * Total ukuran maksimal per satu request unggah musik.
 * Menjaga request tetap ringan untuk runtime Cloudflare Workers.
 */
export const MUSIC_UPLOAD_CHUNK_MAX_MB = 20;

export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

export const ALLOWED_MUSIC_TYPES = [
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/x-wav",
  "audio/ogg",
  "audio/mp4",
  "audio/x-m4a",
  "audio/aac",
  "audio/webm",
] as const;

const IMAGE_TYPE_SET = new Set<string>(ALLOWED_IMAGE_TYPES);
const MUSIC_TYPE_SET = new Set<string>(ALLOWED_MUSIC_TYPES);

/** Apakah MIME file termasuk yang didukung untuk tipe aset tertentu. */
export function isAllowedAssetMime(mime: string, type: AssetType): boolean {
  return type === "MUSIC" ? MUSIC_TYPE_SET.has(mime) : IMAGE_TYPE_SET.has(mime);
}

/**
 * Validasi dasar satu file (format & ukuran).
 * Mengembalikan pesan error, atau `null` bila file lolos.
 */
export function validateAssetFile(file: File, type: AssetType): string | null {
  const isMusic = type === "MUSIC";

  if (!isAllowedAssetMime(file.type, type)) {
    return isMusic
      ? `"${file.name}": format tidak didukung (gunakan MP3, WAV, OGG, M4A, atau AAC).`
      : `"${file.name}": format tidak didukung (gunakan JPG, PNG, WebP, atau GIF).`;
  }

  if (file.size > MAX_ASSET_FILE_BYTES) {
    return `"${file.name}": ukuran melebihi ${MAX_ASSET_FILE_MB}MB.`;
  }

  return null;
}

/**
 * Bagi file musik menjadi batch kecil berdasarkan jumlah file dan total ukuran,
 * supaya tiap request unggah tetap ringan.
 */
export function chunkMusicFiles(files: File[]): File[][] {
  const maxBytes = MUSIC_UPLOAD_CHUNK_MAX_MB * 1024 * 1024;
  const chunks: File[][] = [];
  let current: File[] = [];
  let currentBytes = 0;

  for (const file of files) {
    const fullByCount = current.length >= MUSIC_UPLOAD_CHUNK_SIZE;
    const fullBySize = current.length > 0 && currentBytes + file.size > maxBytes;

    if (fullByCount || fullBySize) {
      chunks.push(current);
      current = [];
      currentBytes = 0;
    }

    current.push(file);
    currentBytes += file.size;
  }

  if (current.length > 0) chunks.push(current);
  return chunks;
}
