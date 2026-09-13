import type { Decoration } from "./types";

export default function DecorationLayer({
  decorations,
}: {
  decorations?: Decoration[];
}) {
  // Layer "background" tidak dirender di sini — dikonsumsi langsung oleh
  // tiap template (cover + gerbang) via getBackgroundUrl() agar foto latar
  // template benar-benar terganti, bukan sekadar ditumpuk di atasnya.
  const bgDecorations = decorations?.filter((d) => d.layer === "background");
  if (!decorations || decorations.length === 0) return null;
  if (decorations.length === bgDecorations?.length) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[60] overflow-hidden"
      aria-hidden="true"
    >
      {decorations.filter((d) => d.layer !== "background").map((d) => {
        const size = d.size ?? {};
        const pos = d.position ?? {};

        // Layer bingkai (frame): stretch otomatis mengikuti area penempatan
        // agar membungkus layout, bukan tampil sebagai gambar mengambang.
        if (d.layer === "frame") {
          if (d.placement === "cover") {
            return (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={d.id}
                src={d.assetUrl}
                alt=""
                style={{
                  position: "absolute",
                  top: 0,
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: "min(100vw, 48rem)",
                  height: "92vh",
                  zIndex: d.zIndex,
                  objectFit: "fill",
                  pointerEvents: "none",
                }}
              />
            );
          }
          if (d.placement === "section") {
            return (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={d.id}
                src={d.assetUrl}
                alt=""
                style={{
                  position: "absolute",
                  top: 0,
                  height: "100%",
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: "min(100vw, 48rem)",
                  zIndex: d.zIndex,
                  objectFit: "fill",
                  pointerEvents: "none",
                }}
              />
            );
          }
        }

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
