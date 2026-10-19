import { NextRequest, NextResponse } from "next/server";
import { createNotification } from "@/lib/notifications";
import {
  markTransactionFailed,
  markTransactionSuccessAndGetUserId,
  verifyMidtransSignature,
} from "@/lib/midtrans";

export async function POST(request: NextRequest) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Body harus JSON." }, { status: 400 });
  }

  if (
    typeof payload !== "object" ||
    payload === null ||
    Array.isArray(payload)
  ) {
    return NextResponse.json({ error: "Body harus objek JSON." }, { status: 400 });
  }

  const body = payload as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === "string" ? v : "");

  const orderId = str(body.order_id);
  const statusCode = str(body.status_code);
  const grossAmount = str(body.gross_amount);
  const signatureKey = str(body.signature_key);
  const transactionStatus = str(body.transaction_status);
  const fraudStatus = str(body.fraud_status);

  if (!orderId || !statusCode || !grossAmount || !signatureKey) {
    return NextResponse.json(
      { error: "Field notifikasi tidak lengkap." },
      { status: 400 },
    );
  }

  if (!verifyMidtransSignature(orderId, statusCode, grossAmount, signatureKey)) {
    return NextResponse.json({ error: "Signature tidak valid." }, { status: 403 });
  }

  const paidAmount = Number(grossAmount);

  try {
    const isPaid =
      transactionStatus === "settlement" ||
      (transactionStatus === "capture" &&
        (fraudStatus === "accept" || fraudStatus === ""));

    if (isPaid) {
      const userId = await markTransactionSuccessAndGetUserId(orderId, paidAmount);
      if (userId) {
        await createNotification({
          userId,
          type: "TRANSACTION",
          title: "Pembayaran Telah diterima 🎉",
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
      return NextResponse.json({ ok: true, handled: "pending" });
    }

    return NextResponse.json({ ok: true, handled: "ignored" });
  } catch (error) {
    console.error("Midtrans notification error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export function GET() {
  return NextResponse.json(
    { error: "Gunakan POST dengan body notifikasi Midtrans." },
    { status: 405 },
  );
}