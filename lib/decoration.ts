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

export function mapDecorations(
  rows: {
    id: string;
    placement?: string;
    layer?: string;
    position: unknown;
    size: unknown;
    rotated: number | null;
    zIndex: number;
    asset: { url: string };
  }[],
): Decoration[] {
  return rows.map((d) => ({
    id: d.id,
    assetUrl: d.asset.url,
    placement: d.placement ?? "floating",
    layer: d.layer ?? "decor",
    zIndex: d.zIndex,
    position: (d.position as { x?: number; y?: number } | undefined) ?? null,
    size: (d.size as { width?: number; height?: number } | undefined) ?? null,
    rotated: d.rotated,
  }));
}
