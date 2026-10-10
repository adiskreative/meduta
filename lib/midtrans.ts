import "server-only";

import { createHash } from "crypto";
import midtransClient from "midtrans-client";
import { prisma } from "@/lib/prisma";
import { PREMIUM_PACKAGE, PREMIUM_PRICE } from "@/lib/premium";

/**
 * Integrasi Midtrans Snap untuk pembayaran paket Premium.
 *
 * Environment (lihat .env / .env.example):
 * - MIDTRANS_SERVER_KEY   : server key (produksi/sandbox)
 * - MIDTRANS_CLIENT_KEY   : client key (dipakai di browser Snap)
 * - MIDTRANS_IS_PRODUCTION: false = sandbox (app.sandbox.midtrans.com)
 * - NEXT_PUBLIC_APP_URL   : origin untuk finish/redirect + notifikasi hint
 *
 * CATATAN ENVIRONMENT: akun ber-key "Mid-server-..." (produksi) bisa
 * berstatus review/aktivasi metode pembayaran. Mode tetap mengikuti
 * env, jadi arahkan env ke sandbox bila akun belum diapprove penuh.
 */

export const SNAP_IS_PRODUCTION =
  process.env.MIDTRANS_IS_PRODUCTION === "true" ||
  process.env.MIDTRANS_IS_PRODUCTION === "1";

/** Sepuluh digit merchant identifier dari server key "Mid-server-..." tidak stabil —
 *  lebih aman ambil dari respon API. Order id cukup unik + mencakup prefix app. */
const APP_ORIGIN =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "http://localhost:3000";

/** Instant client per request — aman dipakai server-side. */
export function getMidtransSnapClient() {
  /**
   * midtrans-client versi 1.x membaca env sendiri, tapi lebih aman
   * set explicit setiap request agar tidak ada kebocoran state.
   */
  return new midtransClient.Snap({
    isProduction: SNAP_IS_PRODUCTION,
    serverKey: process.env.MIDTRANS_SERVER_KEY ?? "",
    clientKey: process.env.MIDTRANS_CLIENT_KEY ?? "",
  });
}

/**
 * Order id wajib unik per pemanggilan. Midtrans membatasi karakter.
 * Format: MEDUTA-PREMIUM-<userIdShort>-<ts>-<rand>
 */
export function buildOrderId(userId: string): string {
  const idPart = userId.slice(0, 8).replace(/[^a-zA-Z0-9]/g, "");
  const ts = Date.now();
  const rand = Math.random().toString(36).slice(2, 8);
  return `MEDUTA-PREMIUM-${idPart}-${ts}-${rand}`;
}

export type SnapCheckoutResult =
  | { ok: true; token: string; redirectUrl: string; orderId: string }
  | { ok: false; error: string };

/** Buat transaksi Snap untuk 1 user; simpan sebagai Transaction pending. */
export async function createPremiumSnapCheckout(
  userId: string,
  customerName?: string | null,
  customerEmail?: string | null,
): Promise<SnapCheckoutResult> {
  const orderId = buildOrderId(userId);
  const snap = getMidtransSnapClient();

  const parameter = {
    transaction_details: {
      order_id: orderId,
      gross_amount: PREMIUM_PRICE,
    },
    item_details: [
      {
        id: "premium-1-year",
        name: "Meduta Premium 1 Tahun",
        price: PREMIUM_PRICE,
        quantity: 1,
      },
    ],
    ...(customerName || customerEmail
      ? {
          customer_details: {
            first_name: customerName?.split(" ")[0] || "Pelanggan",
            last_name: customerName?.split(" ").slice(1).join(" ") || "",
            ...(customerEmail ? { email: customerEmail } : {}),
          },
        }
      : {}),
    credit_card: { secure: true },
  };

  try {
    const { token, redirect_url } = await snap.createTransaction(parameter);
    if (!token) {
      return {
        ok: false,
        error: "Midtrans tidak mengembalikan token pembayaran.",
      };
    }

    // Catat transaksi pending agar notifikasi bisa di-link ke user
    await prisma.transaction.create({
      data: {
        userId,
        midtransId: orderId,
        packageName: PREMIUM_PACKAGE,
        amount: PREMIUM_PRICE,
        status: "pending",
      },
    });

    return {
      ok: true,
      token,
      redirectUrl: redirect_url ?? "",
      orderId,
    };
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Gagal membuat pembayaran Midtrans.";
    return { ok: false, error: message };
  }
}

/**
 * Verifikasi signature_key dari HTTP notifikasi Midtrans:
 * sha256(order_id + status_code + gross_amount + server_key).
 * Reduced version dari docs:
 * https://docs.midtrans.com/en/technical-consideration/midtrans-http-notification
 */
export function verifyMidtransSignature(
  orderId: string,
  statusCode: string,
  grossAmount: string,
  signatureKey: string,
): boolean {
  const apiKey = process.env.MIDTRANS_SERVER_KEY ?? "";
  const expected = createHash("sha256")
    .update(`${orderId}${statusCode}${grossAmount}${apiKey}`)
    .digest("hex");
  return expected === signatureKey;
}

/** Transaksi berhasil → aktifkan premium. */
export async function markTransactionSuccessAndGetUserId(
  orderId: string,
  paidAmount?: number,
): Promise<string | null> {
  const txn = await prisma.transaction.findFirst({
    where: { midtransId: orderId },
    include: { user: { select: { id: true } } },
  });
  if (!txn) return null;
  if (txn.status !== "success") {
    await prisma.transaction.update({
      where: { id: txn.id },
      data: {
        status: "success",
        amount:
          typeof paidAmount === "number" && Number.isFinite(paidAmount)
            ? Math.round(paidAmount)
            : txn.amount,
      },
    });
  }
  return txn.userId;
}

/** Status gagal / batal → tandai transaction failed. */
export async function markTransactionFailed(orderId: string): Promise<void> {
  const txn = await prisma.transaction.findFirst({
    where: { midtransId: orderId },
  });
  if (!txn) return;
  if (txn.status !== "success") {
    await prisma.transaction.update({
      where: { id: txn.id },
      data: { status: "failed" },
    });
  }
}

/** Origin app untuk callback finish (unpaid / pending / paid). */
export function getAppOriginUrl(): string {
  return APP_ORIGIN;
}
