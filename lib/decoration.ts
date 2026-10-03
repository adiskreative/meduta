import type { Decoration } from "@/components/templates/types";

/**
 * Ambil URL background kustom dari dekorasi layer "background".
 * Admin menetapkannya lewat Admin Panel → Template → Dekorasi dengan
 * Layer = "Background". Jika ada, template memakainya untuk cover & gerbang
 * (menggantikan foto bawaan). Jika tidak ada, template memakai bawaannya.
 */
export function getBackgroundUrl(decorations?: Decoration[]): string | undefined {
  const bg = decorations?.find((d) => d.layer === "background");
  return bg?.assetUrl;
}

/**
 * Ambil URL foto khusus halaman "Buka Undangan" dari dekorasi layer
 * "gate-photo" (ditetapkan admin lewat fitur Galeri di Dekorasi).
 * Dipakai admin; pilihan user (data.gatePhotoUrl) selalu menang atas ini.
 */
export function getGatePhotoUrl(decorations?: Decoration[]): string | undefined {
  const gate = decorations?.find((d) => d.layer === "gate-photo");
  return gate?.assetUrl;
}

/**
 * Prioritas final foto gerbang: pilihan user > pilihan admin (dekorasi) >
 * foto mempelai > galeri pertama > undefined (template pakai bawaannya).
 */
export function resolveGatePhoto(options: {
  gatePhotoUrl?: string;
  adminGatePhotoUrl?: string;
  groomPhotoUrl?: string;
  bridePhotoUrl?: string;
  firstGalleryUrl?: string;
}): string | undefined {
  return (
    options.gatePhotoUrl ||
    options.adminGatePhotoUrl ||
    options.groomPhotoUrl ||
    options.bridePhotoUrl ||
    options.firstGalleryUrl ||
    undefined
  );
}

export function mapDecorations(
  rows: {
    id: string;
    placement?: string;
    layer?: string;
    position: unknown;
    size: unknown;
    rotated: number | null;
    zIndex: number;
    asset: { url: string; name?: string };
  }[],
): Decoration[] {
  return rows.map((d) => ({
    id: d.id,
    assetUrl: d.asset.url,
    assetName: d.asset.name,
    placement: d.placement ?? "floating",
    layer: d.layer ?? "decor",
    zIndex: d.zIndex,
    position: (d.position as { x?: number; y?: number } | undefined) ?? null,
    size: (d.size as { width?: number; height?: number } | undefined) ?? null,
    rotated: d.rotated,
  }));
}

/**
 * Ambil URL aset judul gerbang (mis. kaligrafi "the Wedding of") —
 * diunggah admin lewat Admin Panel → Dekorasi dengan nama aset "the"
 * (atau layer "gate-title"). Dipakai template Onyx di HALAMAN BUKA
 * UNDANGAN saja, menggantikan judul teks neon.
 * Catatan: DecorationLayer mengeluarkan aset bernama "the"/layer
 * "gate-title" dari overlay melayangnya agar tidak dirender dobel.
 */
export function getGateTitleUrl(decorations?: Decoration[]): string | undefined {
  const title = decorations?.find(
    (d) =>
      d.layer === "gate-title" || d.assetName?.trim().toLowerCase() === "the",
  );
  return title?.assetUrl;
}


