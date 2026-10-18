import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createPremiumDokuCheckout, isDokuConfigured } from "@/lib/doku";
import { isPremiumUser } from "@/lib/premium";

/**
 * POST /api/doku/checkout
 *
 * Membuat checkout DOKU untuk paket Premium user yang login,
 * menyimpan Transaction "pending" lalu mengembalikan paymentUrl
 * untuk ditampilkan dalam dialog pembayaran.
 * 401 bila belum login, 409 bila sudah premium, 503 bila env DOKU belum diisi.
 */
export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Silakan login dulu." }, { status: 401 });
  }

  if (await isPremiumUser(session.user.id)) {
    return NextResponse.json(
      { error: "Akun Anda sudah Premium." },
      { status: 409 },
    );
  }

  if (!isDokuConfigured()) {
    return NextResponse.json(
      { error: "Pembayaran DOKU belum dikonfigurasi." },
      { status: 503 },
    );
  }

  const result = await createPremiumDokuCheckout(
    session.user.id,
    session.user.name ?? null,
    session.user.email ?? null,
  );

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }

  return NextResponse.json(
    {
      paymentUrl: result.paymentUrl,
      invoiceNumber: result.invoiceNumber,
    },
    { status: 201 },
  );
}
