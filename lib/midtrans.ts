import "server-only";

import { createHash, timingSafeEqual } from "crypto";
import midtransClient from "midtrans-client";
import { prisma } from "@/lib/prisma";
import { PREMIUM_PACKAGE, PREMIUM_PRICE } from "@/lib/premium";

export const SNAP_IS_PRODUCTION =
  process.env.MIDTRANS_IS_PRODUCTION === "true" ||
  process.env.MIDTRANS_IS_PRODUCTION === "1";

const APP_ORIGIN =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "https://meduta.my.id";

export function isMidtransConfigured(): boolean {
  return Boolean(
    process.env.MIDTRANS_SERVER_KEY?.trim() &&
      process.env.MIDTRANS_CLIENT_KEY?.trim(),
  );
}

export function getMidtransSnapClient() {
  return new midtransClient.Snap({
    isProduction: SNAP_IS_PRODUCTION,
    serverKey: process.env.MIDTRANS_SERVER_KEY?.trim() ?? "",
    clientKey: process.env.MIDTRANS_CLIENT_KEY?.trim() ?? "",
  });
}

export function buildOrderId(userId: string): string {
  const idPart = userId.slice(0, 8).replace(/[^a-zA-Z0-9]/g, "");
  const timestamp = Date.now();
  const randomPart = Math.random().toString(36).slice(2, 8);
  return `MEDUTA-PREMIUM-${idPart}-${timestamp}-${randomPart}`;
}

export type SnapCheckoutResult =
  | { ok: true; token: string; redirectUrl: string; orderId: string }
  | { ok: false; error: string };

export async function createPremiumSnapCheckout(
  userId: string,
  customerName?: string | null,
  customerEmail?: string | null,
): Promise<SnapCheckoutResult> {
  const orderId = buildOrderId(userId);
  const snap = getMidtransSnapClient();
  const nameParts = customerName?.trim().split(/\s+/) ?? [];

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
            first_name: nameParts[0] || "Pelanggan",
            last_name: nameParts.slice(1).join(" "),
            ...(customerEmail ? { email: customerEmail } : {}),
          },
        }
      : {}),
    credit_card: { secure: true },
  };

  try {
    const { token, redirect_url: redirectUrl } =
      await snap.createTransaction(parameter);
    if (!token) {
      return {
        ok: false,
        error: "Midtrans tidak mengembalikan token pembayaran.",
      };
    }

    await prisma.transaction.create({
      data: {
        userId,
        gatewayReference: orderId,
        packageName: PREMIUM_PACKAGE,
        amount: PREMIUM_PRICE,
        status: "pending",
      },
    });

    return { ok: true, token, redirectUrl: redirectUrl ?? "", orderId };
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Gagal membuat pembayaran Midtrans.";
    return { ok: false, error: message };
  }
}

export function verifyMidtransSignature(
  orderId: string,
  statusCode: string,
  grossAmount: string,
  signatureKey: string,
): boolean {
  const serverKey = (process.env.MIDTRANS_SERVER_KEY ?? "").trim();
  if (!serverKey) return false;

  const expected = createHash("sha512")
    .update(`${orderId}${statusCode}${grossAmount}${serverKey}`)
    .digest("hex");

  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(signatureKey);
  return (
    expectedBuffer.length === receivedBuffer.length &&
    timingSafeEqual(expectedBuffer, receivedBuffer)
  );
}

/**
 * Mengembalikan userId HANYA jika transaksi baru saja berubah menjadi success.
 * Notifikasi duplikat / sudah success / nominal tidak cocok → null.
 */
export async function markTransactionSuccessAndGetUserId(
  orderId: string,
  paidAmount?: number,
): Promise<string | null> {
  const transaction = await prisma.transaction.findFirst({
    where: { gatewayReference: orderId },
    select: { id: true, userId: true, amount: true, status: true },
  });
  if (!transaction || transaction.status === "success") return null;

  if (
    typeof paidAmount === "number" &&
    Number.isFinite(paidAmount) &&
    Math.round(paidAmount) !== Number(transaction.amount)
  ) {
    console.error(
      `Midtrans amount mismatch for ${orderId}: expected ${transaction.amount}, got ${paidAmount}`,
    );
    return null;
  }

  // Atomic: hanya satu request yang berhasil mengubah status
  const { count } = await prisma.transaction.updateMany({
    where: { id: transaction.id, status: { not: "success" } },
    data: { status: "success" },
  });

  return count > 0 ? transaction.userId : null;
}

export async function markTransactionFailed(orderId: string): Promise<void> {
  await prisma.transaction.updateMany({
    where: { gatewayReference: orderId, status: "pending" },
    data: { status: "failed" },
  });
}

export function getAppOriginUrl(): string {
  return APP_ORIGIN;
}