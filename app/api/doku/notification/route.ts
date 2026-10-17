import { NextRequest, NextResponse } from "next/server";
import { createNotification } from "@/lib/notifications";
import {
  verifyDokuNotificationSignature,
  markDokuTransactionSuccess,
  markDokuTransactionFailed,
} from "@/lib/doku";

/**
 * POST /api/doku/notification
 *
 * Endpoint HTTP Notification DOKU. Dikonfigurasi di DOKU Back Office:
 *   Settings → Plug-in / Notification URL → https://<domain>/api/doku/notification
 *
 * Validasi signature (Non-SNAP):
 *   stringToSign = Client-Id\nRequest-Id\nRequest-Timestamp\nRequest-Target\nDigest
 *   HMAC-SHA256 dengan Secret Key; header Signature berisi "HMACSHA256=<base64>".
 *
 * Request-Target harus path notification URL yang persis sama dengan yang
 * terdaftar di Back Office. Kalau path Anda berbeda (mis. ada subpath atau
 * query), sesuaikan DOKU_NOTIFICATION_TARGET_PATH.
 *
 * Pastikan selalu membalas 2xx agar DOKU berhenti mengirim ulang; 500 membuat
 * DOKU retry. FAILED sebaiknya diabaikan sebagai status final (best practice
 * DOKU Checkout — user boleh mencoba metode lain).
 */

function getNotificationTargetPath(): string {
  return process.env.DOKU_NOTIFICATION_TARGET_PATH ?? "/api/doku/notification";
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text().catch(() => "");

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Body harus JSON." }, { status: 400 });
  }

  const clientId = String(request.headers.get("Client-Id") ?? "");
  const requestId = String(request.headers.get("Request-Id") ?? "");
  const timestamp = String(request.headers.get("Request-Timestamp") ?? "");
  const signature = String(request.headers.get("Signature") ?? "");
  const targetPath = getNotificationTargetPath();

  if (!clientId || !requestId || !timestamp || !signature) {
    return NextResponse.json(
      { error: "Header notifikasi tidak lengkap." },
      { status: 400 },
    );
  }

  // Verifikasi signature HMAC (paling penting).
  const valid = verifyDokuNotificationSignature({
    clientId,
    requestId,
    timestamp,
    requestTarget: targetPath,
    rawBody,
    signatureHeader: signature,
  });

  if (!valid) {
    return NextResponse.json({ error: "Signature tidak valid." }, { status: 403 });
  }

  const transactionStatus = String(body["transaction.status"] ?? "");
  const invoiceNumber = String(
    body["order.invoice_number"] ??
      (body.order as Record<string, unknown> | undefined)?.invoice_number ??
      "",
  );
  const amount = Number(body["transaction.amount"] ?? NaN);

  try {
    if (transactionStatus === "SUCCESS") {
      const userId = await markDokuTransactionSuccess(invoiceNumber, amount);
      if (userId) {
        await createNotification({
          userId,
          type: "TRANSACTION",
          title: "Pembayaran DOKU diterima 🎉",
          body: "Paket Premium Anda aktif — semua template & fitur lengkap sudah terbuka. Terima kasih!",
          link: "/dashboard/pilih-tema",
        });
      }
      return NextResponse.json({ ok: true, handled: "success" });
    }

    if (transactionStatus === "EXPIRED" || transactionStatus === "VOIDED") {
      await markDokuTransactionFailed(invoiceNumber);
      return NextResponse.json({ ok: true, handled: "failed" });
    }

    // FAILED — best practice DOKU Checkout: abaikan sebagai final, user
    // boleh mencoba metode pembayaran lain. Bila ingin menandai failed,
    // set DOKU_TREAT_FAILED_AS_FINAL=true.
    if (
      transactionStatus === "FAILED" &&
      process.env.DOKU_TREAT_FAILED_AS_FINAL === "true"
    ) {
      await markDokuTransactionFailed(invoiceNumber);
      return NextResponse.json({ ok: true, handled: "failed" });
    }

    // Status lain (mis. PENDING / partial) diabaikan.
    return NextResponse.json({ ok: true, handled: "ignored" });
  } catch (error) {
    console.error("DOKU notification error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export function GET() {
  return NextResponse.json(
    { error: "Gunakan POST dengan body notifikasi DOKU." },
    { status: 405 },
  );
}
