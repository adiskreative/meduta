import type { Decoration } from "@/components/templates/types";

export function mapDecorations(
  rows: {
    id: string;
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
    placement: "floating",
    layer: "decor",
    zIndex: d.zIndex,
    position: (d.position as { x?: number; y?: number } | undefined) ?? null,
    size: (d.size as { width?: number; height?: number } | undefined) ?? null,
    rotated: d.rotated,
  }));
}
