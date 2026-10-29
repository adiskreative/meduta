import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  createPremiumSnapCheckout,
  isMidtransConfigured,
} from "@/lib/midtrans";
import { isPremiumUser } from "@/lib/premium";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Silakan login dulu." }, { status: 401 });
  }

  const userId = session.user.id;

  // invitationId (opsional) = aktivasi premium khusus satu undangan
  let invitationId: string | null = null;
  try {
    const body = (await request.json()) as { invitationId?: unknown };
    if (typeof body?.invitationId === "string" && body.invitationId) {
      invitationId = body.invitationId;
    }
  } catch {
    // body kosong = pembayaran premium level akun
  }

  if (invitationId) {
    const invitation = await prisma.invitation.findFirst({
      where: { id: invitationId, userId },
      select: { id: true, isPremium: true, template: { select: { isPremium: true } } },
    });
    if (!invitation) {
      return NextResponse.json(
        { error: "Undangan tidak ditemukan." },
        { status: 404 },
      );
    }
    if (!invitation.template.isPremium) {
      return NextResponse.json(
        { error: "Template undangan ini bukan premium." },
        { status: 400 },
      );
    }
    if (invitation.isPremium || (await isPremiumUser(userId))) {
      return NextResponse.json(
        { error: "Undangan ini sudah premium." },
        { status: 409 },
      );
    }
  } else if (await isPremiumUser(userId)) {
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
    userId,
    session.user.name ?? null,
    session.user.email ?? null,
    invitationId,
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
