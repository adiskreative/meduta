import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  deriveAssetName,
  ensureAssetBucket,
  uploadAssetFile,
  validateAssetFiles,
} from "@/lib/asset-storage";

type MusicUploadResponse = {
  success: boolean;
  message?: string;
  uploadedNames?: string[];
  errors?: string[];
};

const json = (body: MusicUploadResponse, status = 200) =>
  NextResponse.json(body, { status });

/**
 * Unggah batch musik.
 *
 * Sengaja memakai route handler (bukan server action) karena server action
 * untuk halaman /admin dikirim ke URL halaman dan melewati `proxy.ts`.
 * Next.js membuffer body request yang melewati proxy dengan batas
 * `experimental.proxyClientMaxBodySize` (default 10MB); body yang lebih besar
 * dipotong dan memicu "Unexpected end of form". Route di bawah /api tidak
 * tercakup matcher proxy sehingga body dibaca utuh.
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return json({ success: false, errors: ["Sesi berakhir. Silakan login ulang."] }, 401);
  }
  if (session.user.role !== "ADMIN") {
    return json({ success: false, errors: ["Akses ditolak."] }, 403);
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return json(
      {
        success: false,
        errors: ["Berkas gagal dibaca. Coba unggah lebih sedikit file sekaligus."],
      },
      400,
    );
  }

  const files = formData
    .getAll("file")
    .filter((value): value is File => value instanceof File && value.size > 0);

  if (files.length === 0) {
    return json({ success: false, errors: ["Tidak ada file musik yang dikirim."] }, 400);
  }

  const validationErrors = validateAssetFiles(files, "MUSIC");
  if (validationErrors.length > 0) {
    return json({ success: false, errors: validationErrors }, 400);
  }

  const bucketError = await ensureAssetBucket();
  if (bucketError) {
    return json({ success: false, errors: [bucketError] }, 500);
  }

  const uploadedNames: string[] = [];
  const failures: string[] = [];

  for (const file of files) {
    const result = await uploadAssetFile(file, "music");
    if ("error" in result) {
      failures.push(result.error);
      continue;
    }

    await prisma.templateAsset.create({
      data: {
        adminId: session.user.id,
        name: deriveAssetName(file.name, "MUSIC"),
        type: "MUSIC",
        url: result.url,
        // Musik tidak butuh thumbnail — halaman /admin/music memakai audio player.
        thumbnail: null,
        meta: {},
      },
    });
    uploadedNames.push(file.name);
  }

  if (uploadedNames.length > 0) {
    revalidatePath("/admin/assets");
    revalidatePath("/admin/music");
    revalidatePath("/dashboard/background-music");
  }

  return json(
    {
      success: uploadedNames.length > 0,
      message:
        uploadedNames.length > 0
          ? `${uploadedNames.length} musik berhasil diunggah.`
          : undefined,
      uploadedNames,
      errors: failures,
    },
    uploadedNames.length > 0 ? 200 : 500,
  );
}
