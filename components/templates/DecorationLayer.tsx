import type { Decoration } from "./types";

export default function DecorationLayer({
  decorations,
}: {
  decorations?: Decoration[];
}) {
  if (!decorations || decorations.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[60] overflow-hidden"
      aria-hidden="true"
    >
      {decorations.map((d) => {
        const size = d.size ?? {};
        const pos = d.position ?? {};
        return (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={d.id}
            src={d.assetUrl}
            alt=""
            style={{
              position: "absolute",
              left: pos.x ?? 0,
              top: pos.y ?? 0,
              width: size.width,
              height: size.height,
              zIndex: d.zIndex,
              transform: d.rotated ? `rotate(${d.rotated}deg)` : undefined,
              objectFit: "contain",
              pointerEvents: "none",
            }}
          />
        );
      })}
    </div>
  );
}
