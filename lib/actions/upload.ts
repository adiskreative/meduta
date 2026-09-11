"use server";

import { redirect } from "next/navigation";
import { randomUUID } from "crypto";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSupabaseAdmin, SUPABASE_BUCKET } from "@/lib/supabase";

const MAX_SIZE = 3 * 1024 * 1024; // 3MB
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

const MAX_MUSIC_SIZE = 10 * 1024 * 1024; // 10MB
const AUDIO_ALLOWED = new Set([
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/x-wav",
  "audio/ogg",
  "audio/mp4",
  "audio/x-m4a",
  "audio/aac",
  "audio/webm",
]);
const AUDIO_EXT: Record<string, string> = {
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

export type UploadState = {
  error?: string;
  url?: string;
};

export async function uploadAvatar(formData: FormData): Promise<UploadState> {
  return uploadImage(formData, "");
}

async function uploadImage(
  formData: FormData,
  folder: string,
): Promise<UploadState> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Pilih file gambar terlebih dahulu." };
  }

  if (!ALLOWED.has(file.type)) {
    return { error: "Format tidak didukung. Gunakan JPG, PNG, WebP, atau GIF." };
  }

  if (file.size > MAX_SIZE) {
    return { error: "Ukuran file maksimal 3MB." };
  }

  const ext = file.type.split("/")[1] === "jpeg" ? "jpg" : file.type.split("/")[1];
  const path = folder
    ? `${folder}/${session.user.id}/${randomUUID()}.${ext}`
    : `${session.user.id}/${randomUUID()}.${ext}`;

  const supabase = getSupabaseAdmin();

  const bucketError = await ensureBucket(supabase);
  if (bucketError) return { error: bucketError };

  const arrayBuffer = await file.arrayBuffer();
  const { error: uploadError } = await supabase.storage
    .from(SUPABASE_BUCKET)
    .upload(path, arrayBuffer, { contentType: file.type, upsert: false });

  if (uploadError) {
    return { error: `Gagal upload: ${uploadError.message}` };
  }

  const { data: urlData } = supabase.storage.from(SUPABASE_BUCKET).getPublicUrl(path);

  return { url: urlData.publicUrl };
}

export async function uploadGalleryImage(formData: FormData): Promise<UploadState> {
  return uploadImage(formData, "gallery");
}

/** Pastikan bucket storage tersedia; kembalikan pesan error bila gagal. */
async function ensureBucket(
  supabase: ReturnType<typeof getSupabaseAdmin>,
): Promise<string | null> {
  const { error } = await supabase.storage.getBucket(SUPABASE_BUCKET);
  if (error) {
    const { error: createError } = await supabase.storage.createBucket(SUPABASE_BUCKET, {
      public: true,
    });
    if (createError) {
      return `Bucket storage belum siap (${createError.message}). Buat bucket "${SUPABASE_BUCKET}" secara manual di Supabase.`;
    }
  }
  return null;
}

/** Upload file musik pilihan user ke storage; kembalikan URL publiknya. */
export async function uploadMusic(formData: FormData): Promise<UploadState> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Pilih file musik terlebih dahulu." };
  }

  if (!AUDIO_ALLOWED.has(file.type)) {
    return { error: "Format tidak didukung. Gunakan MP3, WAV, OGG, M4A, atau AAC." };
  }

  if (file.size > MAX_MUSIC_SIZE) {
    return { error: "Ukuran file musik maksimal 10MB." };
  }

  const supabase = getSupabaseAdmin();

  const bucketError = await ensureBucket(supabase);
  if (bucketError) return { error: bucketError };

  const ext = AUDIO_EXT[file.type] ?? "mp3";
  const path = `music/${session.user.id}/${randomUUID()}.${ext}`;

  const arrayBuffer = await file.arrayBuffer();
  const { error: uploadError } = await supabase.storage
    .from(SUPABASE_BUCKET)
    .upload(path, arrayBuffer, { contentType: file.type, upsert: false });

  if (uploadError) {
    return { error: `Gagal upload: ${uploadError.message}` };
  }

  const { data: urlData } = supabase.storage.from(SUPABASE_BUCKET).getPublicUrl(path);
  return { url: urlData.publicUrl };
}

/**
 * Upload musik default untuk template (khusus admin).
 * Langsung menyimpan URL ke kolom defaultMusicUrl pada template.
 */
export async function uploadTemplateMusic(
  templateId: string,
  formData: FormData,
): Promise<UploadState> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  const template = await prisma.template.findUnique({
    where: { id: templateId },
    select: { id: true },
  });
  if (!template) return { error: "Template tidak ditemukan." };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Pilih file musik terlebih dahulu." };
  }

  if (!AUDIO_ALLOWED.has(file.type)) {
    return { error: "Format tidak didukung. Gunakan MP3, WAV, OGG, M4A, atau AAC." };
  }

  if (file.size > MAX_MUSIC_SIZE) {
    return { error: "Ukuran file musik maksimal 10MB." };
  }

  const supabase = getSupabaseAdmin();

  const bucketError = await ensureBucket(supabase);
  if (bucketError) return { error: bucketError };

  const ext = AUDIO_EXT[file.type] ?? "mp3";
  const path = `template-music/${randomUUID()}.${ext}`;

  const arrayBuffer = await file.arrayBuffer();
  const { error: uploadError } = await supabase.storage
    .from(SUPABASE_BUCKET)
    .upload(path, arrayBuffer, { contentType: file.type, upsert: false });

  if (uploadError) {
    return { error: `Gagal upload: ${uploadError.message}` };
  }

  const { data: urlData } = supabase.storage.from(SUPABASE_BUCKET).getPublicUrl(path);
  const url = urlData.publicUrl;

  await prisma.template.update({
    where: { id: templateId },
    data: { defaultMusicUrl: url },
  });

  return { url };
}

/** Hapus musik default template (khusus admin). */
export async function removeTemplateMusic(templateId: string): Promise<UploadState> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  await prisma.template.update({
    where: { id: templateId },
    data: { defaultMusicUrl: null },
  });

  return {};
}
