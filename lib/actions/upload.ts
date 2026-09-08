"use server";

import { redirect } from "next/navigation";
import { randomUUID } from "crypto";
import { auth } from "@/lib/auth";
import { getSupabaseAdmin, SUPABASE_BUCKET } from "@/lib/supabase";

const MAX_SIZE = 3 * 1024 * 1024; // 3MB
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

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

  const { error: listError } = await supabase.storage.getBucket(SUPABASE_BUCKET);
  if (listError) {
    const { error: createError } = await supabase.storage.createBucket(SUPABASE_BUCKET, {
      public: true,
    });
    if (createError) {
      return {
        error: `Bucket storage belum siap (${createError.message}). Buat bucket "${SUPABASE_BUCKET}" secara manual di Supabase.`,
      };
    }
  }

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
