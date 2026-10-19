import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  createPremiumSnapCheckout,
  isMidtransConfigured,
} from "@/lib/midtrans";
import { isPremiumUser } from "@/lib/premium";

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

  if (!isMidtransConfigured()) {
    return NextResponse.json(
      { error: "Pembayaran Midtrans belum dikonfigurasi." },
      { status: 503 },
    );
  }

  const prefersRedirect =
    new URL(request.url).searchParams.get("redirect") === "1";
  const result = await createPremiumSnapCheckout(
    session.user.id,
    session.user.name ?? null,
    session.user.email ?? null,
  );

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }

  if (prefersRedirect && result.redirectUrl) {
    return NextResponse.json(
      {
        redirectUrl: result.redirectUrl,
        token: result.token,
        orderId: result.orderId,
      },
      { status: 201 },
    );
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
