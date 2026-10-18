import "server-only";

import { createHash, createHmac, randomUUID, timingSafeEqual } from "crypto";
import { prisma } from "@/lib/prisma";
import { PREMIUM_PACKAGE, PREMIUM_PRICE } from "@/lib/premium";

/**
 * Integrasi DOKU Checkout API untuk pembayaran paket Premium.
 *
 * Environment (lihat .env.example):
 * - DOKU_CLIENT_ID     : Client-Id dari DOKU Back Office (wajib)
 * - DOKU_SECRET_KEY    : Secret key untuk HMAC signature (wajib, rahasia)
 * - DOKU_IS_PRODUCTION : "true" => api.doku.com, "false"/kosong => api-sandbox.doku.com
 * - NEXT_PUBLIC_APP_URL: origin untuk callback URL (redirect setelah bayar)
 *
 * Referensi:
 * - https://developers.doku.com/accept-payments/doku-checkout/integration-guide/backend-integration
 * - https://developers.doku.com/get-started-with-doku-api/signature-component/non-snap/signature-component-from-request-header
 *
 * Catatan akun: endpoint /checkout/v1/payment tersedia hanya bila merchant
 * telah aktif untuk produk DOKU Checkout. Bila akun hanya di-enable untuk
 * produk Direct API / Payment Page lama, API ini bisa merespons 401/403 —
 * hubungi DOKU untuk aktivasi produk sesuai kebutuhan.
 */

const DOKU_IS_PRODUCTION =
  process.env.DOKU_IS_PRODUCTION === "true" ||
  process.env.DOKU_IS_PRODUCTION === "1";

const DOKU_API_BASE = DOKU_IS_PRODUCTION
  ? "https://api.doku.com"
  : "https://api-sandbox.doku.com";

/** Origin app untuk callback (redirect setelah bayar). */
export function getDokuAppOrigin(): string {
  const origin =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    "http://localhost:3000";
  return origin;
}

/** Bila env wajib terisi => true */
export function isDokuConfigured(): boolean {
  return Boolean(process.env.DOKU_CLIENT_ID && process.env.DOKU_SECRET_KEY);
}

/** Pastikan env wajib terisi, bila tidak terisi kembalikan string error. */
function requireEnv(): string | null {
  if (!isDokuConfigured()) {
    return "Konfigurasi DOKU belum lengkap (DOKU_CLIENT_ID / DOKU_SECRET_KEY).";
  }
  return null;
}

/**
 * Hitung signature DOKU (Non-SNAP / Checkout API):
 * stringToSign = 5 baris (Client-Id, Request-Id, Request-Timestamp,
 * Request-Target, Digest base64-sha256(body)) — dijoin "\n" tanpa newline
 * tambahan di akhir, lalu HMAC-SHA256 base64 dengan Secret Key.
 */
export function computeDokuSignature({
  clientId,
  requestId,
  timestamp,
  requestTarget,
  body,
}: {
  clientId: string;
  requestId: string;
  timestamp: string;
  requestTarget: string;
  body: string;
}): string {
  const digest = createHash("sha256").update(body, "utf8").digest("base64");
  const stringToSign = [
    `Client-Id:${clientId}`,
    `Request-Id:${requestId}`,
    `Request-Timestamp:${timestamp}`,
    `Request-Target:${requestTarget}`,
    `Digest:${digest}`,
  ].join("\n");
  const secret = process.env.DOKU_SECRET_KEY ?? "";
  return `HMACSHA256=${createHmac("sha256", secret)
    .update(stringToSign, "utf8")
    .digest("base64")}`;
}

/**
 * Verifikasi signature header dari HTTP Notification DOKU.
 * stringToSign 5 baris sama dengan saat request — namun Request-Target
 * memakai path DOKU menuju notification URL merchant, request dan Digest
 * memakai raw body persis seperti yang DOKU kirim.
 */
export function verifyDokuNotificationSignature({
  clientId,
  requestId,
  timestamp,
  requestTarget,
  rawBody,
  signatureHeader,
}: {
  clientId: string;
  requestId: string;
  timestamp: string;
  requestTarget: string;
  rawBody: string;
  signatureHeader: string;
}): boolean {
  if (!signatureHeader.startsWith("HMACSHA256=")) return false;
  const received = signatureHeader.slice("HMACSHA256=".length);
  const expected = computeDokuSignature({
    clientId,
    requestId,
    timestamp,
    requestTarget,
    body: rawBody,
  });
  const expectedValue = expected.slice("HMACSHA256=".length);
  const a = Buffer.from(expectedValue, "utf8");
  const b = Buffer.from(received, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Invoice number wajib unik per order. DOKU membatasi karakter & panjang.
 * Format: MEDUTA-PREMIUM-<userIdShort>-<ts>-<rand>
 */
export function buildInvoiceNumber(userId: string): string {
  const idPart = userId.slice(0, 8).replace(/[^a-zA-Z0-9]/g, "");
  const ts = Date.now();
  const rand = Math.random().toString(36).slice(2, 8);
  return `MEDUTA-PREMIUM-${idPart}-${ts}-${rand}`;
}

export type DokuCheckoutResult =
  | { ok: true; paymentUrl: string; tokenPayment?: string; invoiceNumber: string }
  | { ok: false; error: string };

/**
 * Buat checkout DOKU untuk 1 user; simpan Transaction "pending" lalu
 * kembalikan paymentUrl untuk ditampilkan dalam dialog pembayaran.
 */
export async function createPremiumDokuCheckout(
  userId: string,
  customerName?: string | null,
  customerEmail?: string | null,
): Promise<DokuCheckoutResult> {
  const envError = requireEnv();
  if (envError) return { ok: false, error: envError };

  const invoiceNumber = buildInvoiceNumber(userId);
  const origin = getDokuAppOrigin();
  const callbackUrl = `${origin}/dashboard/upgrade?doku=finish&invoice=${invoiceNumber}`;

  const payload = {
    order: {
      amount: PREMIUM_PRICE, // IDR tanpa desimal
      invoice_number: invoiceNumber,
      currency: "IDR",
      callback_url: callbackUrl,
      auto_redirect: true,
    },
    payment: {
      payment_due_date: 60,
      ...(customerName
        ? { name: customerName.split(" ")[0] || "Pelanggan" }
        : {}),
      ...(customerEmail ? { email: customerEmail } : {}),
    },
  };

  const body = JSON.stringify(payload);
  const clientId = process.env.DOKU_CLIENT_ID ?? "";
  const requestId = randomUUID();
  const timestamp = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Client-Id": clientId,
    "Request-Id": requestId,
    "Request-Timestamp": timestamp,
    Signature: computeDokuSignature({
      clientId,
      requestId,
      timestamp,
      requestTarget: "/checkout/v1/payment",
      body,
    }),
  };

  try {
    const res = await fetch(`${DOKU_API_BASE}/checkout/v1/payment`, {
      method: "POST",
      headers,
      body,
    });

    const data = (await res.json().catch(() => ({}))) as {
      response?: {
        payment?: { url?: string; token_payment?: string };
      };
      error?: { message?: string };
      message?: string;
    };

    if (!res.ok || !data.response?.payment?.url) {
      const message =
        data.error?.message ??
        data.message ??
        `DOKU checkout gagal (HTTP ${res.status}).`;
      return { ok: false, error: message };
    }

    await prisma.transaction.create({
      data: {
        userId,
        gatewayReference: invoiceNumber,
        packageName: PREMIUM_PACKAGE,
        amount: PREMIUM_PRICE,
        status: "pending",
      },
    });

    return {
      ok: true,
      paymentUrl: data.response.payment.url,
      tokenPayment: data.response.payment.token_payment,
      invoiceNumber,
    };
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Gagal membuat pembayaran DOKU.";
    return { ok: false, error: message };
  }
}

/**
 * Transaksi DOKU berhasil → tandai success dan kembalikan userId.
 * Idempoten: bila sudah success, cukup kembalikan userId tanpa update.
 */
export async function markDokuTransactionSuccess(
  invoiceNumber: string,
  paidAmount?: number,
): Promise<string | null> {
  const txn = await prisma.transaction.findFirst({
    where: { gatewayReference: invoiceNumber },
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

/** Status gagal / expired → tandai transaction failed. */
export async function markDokuTransactionFailed(
  invoiceNumber: string,
): Promise<void> {
  const txn = await prisma.transaction.findFirst({
    where: { gatewayReference: invoiceNumber },
  });
  if (!txn) return;
  if (txn.status !== "success") {
    await prisma.transaction.update({
      where: { id: txn.id },
      data: { status: "failed" },
    });
  }
}
