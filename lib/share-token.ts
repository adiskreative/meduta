import { randomBytes } from "crypto";

/**
 * Token rahasia untuk halaman /share/[token] — panel "Sebarkan Undangan"
 * yang bisa dipakai tanpa login. Bertindak sebagai "kunci" panel, jadi
 * harus acak & cukup panjang agar tidak bisa ditebak.
 */
export function generateShareToken(): string {
  return randomBytes(12).toString("base64url");
}
