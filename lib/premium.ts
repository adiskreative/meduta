// Modul server-only (dipakai dari server components & server actions).
import { prisma } from "@/lib/prisma";

export const PREMIUM_PACKAGE = "Premium";
/** Label transaksi untuk aktivasi premium khusus satu undangan. */
export const PREMIUM_INVITATION_PACKAGE = "Premium Undangan";
export const PREMIUM_PRICE = 50000; // harga promo saat ini
export const PREMIUM_ORIGINAL_PRICE = 150000; // harga normal (ditampilkan coret)

/** Batas foto galeri untuk paket Gratis (sesuai klaim kartu harga). */
export const FREE_GALLERY_LIMIT = 5;

/** Masa aktif undangan paket Gratis, dalam hari (klaim kartu harga). */
export const FREE_ACTIVE_DAYS = 30;

/** Tanggal kadaluarsa untuk undangan baru: gratis = +30 hari, premium = null. */
export function computeExpiresAt(isPremium: boolean): Date | null {
  if (isPremium) return null;
  const d = new Date();
  d.setDate(d.getDate() + FREE_ACTIVE_DAYS);
  return d;
}

/** true bila undangan sudah melewati masa aktifnya. */
export function isExpired(expiresAt: Date | null): boolean {
  if (!expiresAt) return false;
  return expiresAt.getTime() < Date.now();
}

/**
 * Status premium pengguna: memiliki transaksi paket Premium yang berhasil.
 */
export async function isPremiumUser(userId: string): Promise<boolean> {
  const t = await prisma.transaction.findFirst({
    where: {
      userId,
      packageName: PREMIUM_PACKAGE,
      status: "success",
    },
    select: { id: true },
  });
  return t !== null;
}

/**
 * Boleh memakai template premium untuk undangan tertentu:
 * premium level akun (paket lama) ATAU undangan ini sudah diaktivasi sendiri.
 */
export function canUsePremiumTemplate(
  invitation: { isPremium: boolean } | null | undefined,
  userIsPremium: boolean,
): boolean {
  return userIsPremium || Boolean(invitation?.isPremium);
}
