import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createPremiumSnapCheckout } from "@/lib/midtrans";
import { isPremiumUser } from "@/lib/premium";

/**
 * POST /api/midtrans/checkout
 *
 * membuat Snap token pembayaran paket Premium untuk user yang login,
 * menyimpan Transaction "pending" lalu mengembalikan token + redirect_url.
 * 401 bila belum login, 409 bila sudah premium.
 */
export async function POST(request: NextRequest) {
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

  const prefersRedirect = new URL(request.url).searchParams.get("redirect") === "1";

  const result = await createPremiumSnapCheckout(
    session.user.id,
    session.user.name ?? null,
    session.user.email ?? null,
  );

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }

  // Mode redirect: langsung arahkan ke halaman hosted Snap
  // (berguna bila popup Snap sukses gagal tampil di ponsel tua).
  if (prefersRedirect && result.redirectUrl) {
    return NextResponse.json({ redirectUrl: result.redirectUrl, token: result.token, orderId: result.orderId }, { status: 201 });
  }

  return NextResponse.json(
    {
      token: result.token,
      redirectUrl: result.redirectUrl,
      orderId: result.orderId,
    },
    { status: 201 },
  );
}
