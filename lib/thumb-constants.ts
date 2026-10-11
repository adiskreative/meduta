/**
 * Konstanta thumbnail statis — SATU sumber kebenaran yang dipakai bersama
 * oleh LiveTemplatePreview (client) dan mode ?shot=1 di preview page (server).
 *
 * Aturan presisi: viewport "ponsel tiruan" adalah INNER_H. Di mode shot,
 * section satu-layar (min-h-screen / 100svh) WAJIB dirender setinggi
 * INNER_H — bukan 844/100vh — agar komposisi thumbnail identik piksel
 * dengan tampilan live iframe (kartu tamu tidak terpotong).
 */

/** Lebar desain template (viewport asli screenshot — iPhone 16 Pro Max). */
export const THUMB_PHONE_W = 440;
/** Ketebalan bingkai ponsel pada kartu (border-[10px]). */
export const THUMB_BORDER = 10;
/** Lebar total kartu termasuk bingkai (w-60). */
export const THUMB_CARD_W = 240;
/** Lebar layar yang terlihat (di dalam bingkai). */
export const THUMB_SCREEN_W = THUMB_CARD_W - THUMB_BORDER * 2; // 220
/** Skala render: layar terlihat / lebar desain. */
export const THUMB_SCALE = THUMB_SCREEN_W / THUMB_PHONE_W; // ≈0.5641
/** Tinggi layar terlihat — rasio persis seperti live iframe (440:956). */
export const THUMB_SCREEN_H = Math.round(THUMB_SCREEN_W * (956 / 440)); // 478
/** Tinggi viewport tiruan — INI acuan satu-layar di mode shot (iPhone 16 Pro Max). */
export const THUMB_INNER_H = Math.round(THUMB_SCREEN_H / THUMB_SCALE); // 956

/** Section penuh layar di mode shot (min-h-screen & 100svh/vh). */
export const THUMB_FULL_H = THUMB_INNER_H;
/** Nilai proporsional untuk varian vh lain (92vh, 95vh, dst). */
export function thumbVh(percent: number): number {
  return Math.round((THUMB_FULL_H * percent) / 100);
}
