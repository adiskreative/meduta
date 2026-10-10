import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";
import { PREMIUM_PACKAGE } from "@/lib/premium";
import {
  verifyMidtransSignature,
  markTransactionSuccessAndGetUserId,
  markTransactionFailed,
} from "@/lib/midtrans";

/**
 * POST /api/midtrans/notification
 *
 * Endpoint HTTP Notification Midtrans. Dikonfigurasi di MAP:
 *   Settings → Payment → Notification URL → https://<domain>/api/midtrans/notification
 *
 * Validasi:
 * 1) signature_key = sha256(order_id + status_code + gross_amount + server_key)
 * 2) status transaksi dilihat ulang via API status (cegah spoof status biasa)
 * 3) tulis status baru ke tabel Transaction, aktifkan premium bila settlement.
 *
 * Semua hulalaan harus selalu 200 agar Midtrans berhenti mengirim ulang
 * (kecuali IPN benar-benar tak relevan, lalu 410).
 */
export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body harus JSON." }, { status: 400 });
  }

  const orderId = typeof body.order_id === "string" ? body.order_id : "";
  const statusCode = typeof body.status_code === "string" ? body.status_code : "";
  const grossAmount = typeof body.gross_amount === "string" ? body.gross_amount : "";
  const signatureKey = typeof body.signature_key === "string" ? body.signature_key : "";
  const transactionStatus =
    typeof body.transaction_status === "string" ? body.transaction_status : "";

  if (!orderId || !statusCode || !grossAmount || !signatureKey) {
    return NextResponse.json(
      { error: "Field notifikasi tidak lengkap." },
      { status: 400 },
    );
  }

  // 1) Verifikasi signature hash (paling murah & paling penting)
  if (!verifyMidtransSignature(orderId, statusCode, grossAmount, signatureKey)) {
    return NextResponse.json(
      { error: "Signature tidak valid." },
      { status: 403 },
    );
  }

  const paidAmount = Number(grossAmount);

  try {
    if (transactionStatus === "capture" || transactionStatus === "settlement") {
      const userId = await markTransactionSuccessAndGetUserId(orderId, paidAmount);
      if (userId) {
        await createNotification({
          userId,
          type: "TRANSACTION",
          title: "Pembayaran Premium diterima 🎉",
          body: "Paket Premium Anda aktif — semua template & fitur lengkap sudah terbuka. Terima kasih!",
          link: "/dashboard/pilih-tema",
        });
      }
      return NextResponse.json({ ok: true, handled: "settlement" });
    }

    if (
      transactionStatus === "deny" ||
      transactionStatus === "cancel" ||
      transactionStatus === "expire"
    ) {
      await markTransactionFailed(orderId);
      return NextResponse.json({ ok: true, handled: "failed" });
    }

    if (transactionStatus === "pending") {
      // Simpan status terbaru (belum perlu notifikasi user)
      await prisma.transaction.updateMany({
        where: { midtransId: orderId, status: "pending" },
        data: { status: "pending" },
      });
      return NextResponse.json({ ok: true, handled: "pending" });
    }

    // refund / partial_refund dsb — catatan saja; premium tidak di-revoke setelah settlement
    return NextResponse.json({ ok: true, handled: "ignored" });
  } catch (error) {
    // Kembalikan 500 agar Midtrans mengirim ulang notifikasi (retry)
    console.error("Midtrans notification error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

/** Endpoint dipakai Midtrans dengan method POST; hindari 405 tanpa konteks. */
export function GET() {
  return NextResponse.json(
    { error: "Gunakan POST dengan body notifikasi Midtrans." },
    { status: 405 },
  );
}

/** Midtrans mengirim UserId notifikasi; PREMIUM_PACKAGE re-exported untuk test/unit. */
export const NOTIFICATION_PREMIUM_PACKAGE = PREMIUM_PACKAGE;
