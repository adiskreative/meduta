/**
 * Kompresi gambar di sisi browser sebelum diunggah.
 * Sinkron dengan MAX_SIZE di lib/actions/upload.ts (3MB).
 */
const MAX_UPLOAD_SIZE = 3 * 1024 * 1024; // 3MB

/** Dimensi sisi terpanjang yang dicoba berurutan sampai hasilnya di bawah batas. */
const DIMENSION_STEPS = [1600, 1200, 900, 640];
/** Kualitas JPEG/WebP yang dicoba berurutan untuk tiap dimensi. */
const QUALITY_STEPS = [0.85, 0.7, 0.55];

async function fileToBitmap(file: File): Promise<ImageBitmap | null> {
  try {
    return await createImageBitmap(file);
  } catch {
    // Browser tidak mendukung / file rusak — biarkan server yang memutuskan
    return null;
  }
}

function drawToBlob(
  bitmap: ImageBitmap,
  width: number,
  height: number,
  type: string,
  quality: number,
): Promise<Blob | null> {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return Promise.resolve(null);

  // JPEG tidak mendukung transparansi — isi putih agar tidak jadi hitam
  if (type === "image/jpeg") {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
  }
  ctx.drawImage(bitmap, 0, 0, width, height);

  return new Promise((resolve) =>
    canvas.toBlob((blob) => resolve(blob), type, quality),
  );
}

function renameForType(name: string, type: string): string {
  const ext = type === "image/webp" ? "webp" : type === "image/png" ? "png" : "jpg";
  return `${name.replace(/\.[^.]+$/, "")}.${ext}`;
}

/**
 * Mengembalikan file apa adanya jika sudah di bawah batas; jika lebih besar,
 * di-resize + dikompres bertahap (dimensi lalu kualitas) sampai lolos batas.
 * GIF tidak dikompres agar animasinya tidak rusak.
 */
export async function compressImageForUpload(file: File): Promise<File> {
  if (file.type === "image/gif") return file;
  if (file.size <= MAX_UPLOAD_SIZE) return file;

  const bitmap = await fileToBitmap(file);
  if (!bitmap) return file;

  // PNG/WebP (bisa transparan) diutamakan ke WebP; JPEG tetap JPEG
  const types =
    file.type === "image/png" || file.type === "image/webp"
      ? ["image/webp", "image/jpeg"]
      : ["image/jpeg"];

  for (const maxDim of DIMENSION_STEPS) {
    const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    for (const type of types) {
      for (const quality of QUALITY_STEPS) {
        const blob = await drawToBlob(bitmap, width, height, type, quality);
        // Browser tanpa dukungan WebP diam-diam menghasilkan PNG (besar) —
        // loop lanjut ke tipe/kualitas berikutnya sampai menemukan yang lolos.
        if (blob && blob.size <= MAX_UPLOAD_SIZE) {
          return new File([blob], renameForType(file.name, type), { type });
        }
      }
    }
  }

  // Tidak berhasil dikompres di bawah batas — kirim apa adanya,
  // server akan memberi pesan error yang jelas.
  return file;
}
