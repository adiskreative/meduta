"use client";

/**
 * WayangDecor — ornamen SVG inline untuk template "Wayang Adat"
 * (adopsi dari referensi "The Wedding of Raden Bagas & Ayu Laras").
 * - Gunungan (kayon) sebagai motif ornamentik utama.
 * - Wayang laki & perempuan (siluet animasi: goyang, angkat tangan, angguk).
 * - Batik parang: strip bergaris diagonal emas di atas latar sogan gelap.
 * Warna mengikuti referensi: sogan #6b4226, emas #b98f3e / #e2c274,
 * hijau pekat #1f3a2b, krem #f6efdf.
 */

const GOLD = "#e2c274";
const GOLD_D = "#b98f3e";
const DARK = "#14261c";
const SOGAN_D = "#3e2515";

/** Gunungan (kayon) — outline emas + ornamen lingkaran, atau versi isi penuh. */
export function Gunungan({
  className = "",
  stroke = GOLD,
  strokeWidth = 1.5,
  filled = false,
  style,
}: {
  className?: string;
  stroke?: string;
  strokeWidth?: number;
  filled?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      viewBox="0 0 100 130"
      fill={filled ? "currentColor" : "none"}
      stroke={filled ? undefined : stroke}
      strokeWidth={filled ? undefined : strokeWidth}
      className={className}
      style={style}
      aria-hidden
    >
      <path d="M50 4C56 28 76 40 84 68V122H16V68C24 40 44 28 50 4Z" />
      {!filled ? (
        <>
          <path d="M50 34C56 50 68 58 70 76V112H30V76C32 58 44 50 50 34Z" fill="none" />
          <circle cx="50" cy="84" r="9" fill="none" />
          <path d="M50 60V70M40 96H60" fill="none" />
        </>
      ) : null}
    </svg>
  );
}

/** Motif kawung (batik bulatan 4 arah) — SVG data URL untuk background. */
export const KAWUNG_URL =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60'%3E%3Cg fill='none' stroke='%23b98f3e' stroke-opacity='.22' stroke-width='1'%3E%3Cellipse cx='30' cy='15' rx='8' ry='14'/%3E%3Cellipse cx='30' cy='45' rx='8' ry='14'/%3E%3Cellipse cx='15' cy='30' rx='14' ry='8'/%3E%3Cellipse cx='45' cy='30' rx='14' ry='8'/%3E%3C/g%3E%3C/svg%3E\")";

/** Motif parang (batik diagonal bergelombang) — SVG data URL. */
export const PARANG_URL =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48'%3E%3Cg fill='none' stroke='%23e2c274' stroke-width='1.6' stroke-linecap='round'%3E%3Cpath d='M0 48C12 48 14 36 24 36S36 24 48 24'/%3E%3Cpath d='M0 24C12 24 14 12 24 12S36 0 48 0'/%3E%3C/g%3E%3Cg fill='%23e2c274'%3E%3Ccircle cx='24' cy='24' r='2'/%3E%3Ccircle cx='0' cy='36' r='1.6'/%3E%3Ccircle cx='48' cy='12' r='1.6'/%3E%3Ccircle cx='24' cy='48' r='1.6'/%3E%3C/g%3E%3C/svg%3E\")";

/** Strip batik parang: garis diagonal emas bergerak di atas dasar sogan gelap. */
export function ParangStrip({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`wy-parang ${className}`}
      style={{
        backgroundImage: `${PARANG_URL}, linear-gradient(${SOGAN_D}, ${SOGAN_D})`,
      }}
    />
  );
}

/** Siluet wayang (laki = memegang keris; perempuan = varian kuncir). */
export function WayangSilhouette({
  gender = "male",
  className = "",
}: {
  gender?: "male" | "female";
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 104 200"
      fill="currentColor"
      className={`wy-fig ${className}`}
      aria-hidden
    >
      <g className="wy-hd">
        <path d="M38 26L43 8L50 18L57 2L64 18L71 9L74 26Z" />
        <path d="M45 26h26l4 9-5 3 3 5-5 3q-2 9-12 9-11 0-11-14z" />
        <circle cx="62" cy="34" r="1.6" fill={DARK} />
      </g>
      <rect x="54" y="52" width="8" height="10" />
      <path d="M42 62h30l6 6v32H40V68z" />
      <path d="M40 100h40l12 96H28z" />
      <g className="wy-arm">
        <path d="M62 68L94 96l4-4 3 6-6 6L58 78z" />
        <path d="M97 94l4 28" stroke="currentColor" strokeWidth="1.6" fill="none" />
      </g>
      <g fill="none" stroke={DARK} strokeWidth="1.4" opacity=".85">
        <path d="M44 74h26M44 84h26M40 100h40" />
        <path d="M60 110l8 14-8 14-8-14zM60 150l6 10-6 10-6-10z" />
        <circle cx="60" cy="88" r="3" />
      </g>
    </svg>
  );
}

/** Pasangan wayang di sisi kiri-kanan sebuah section gelap. */
export function WayangPair() {
  return (
    <>
      <div aria-hidden className="wy-side wy-side-l">
        <WayangSilhouette gender="male" />
      </div>
      <div aria-hidden className="wy-side wy-side-r">
        <WayangSilhouette gender="female" />
      </div>
    </>
  );
}

/** Ornamen pembatas section: garis emas dengan gunungan kecil di tengah. */
export function Divider() {
  return (
    <div className="wy-divider" aria-hidden>
      <i />
      <Gunungan className="wy-divider-glyph" stroke={GOLD_D} strokeWidth={2} />
      <i />
    </div>
  );
}
