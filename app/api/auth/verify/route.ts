import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const verificationQuerySchema = z.object({
  email: z.string().email().transform((email) => email.trim()),
  token: z.string().regex(/^[a-f0-9]{64}$/),
});

function loginRedirect(request: NextRequest, status: string) {
  const url = new URL("/login", request.url);
  url.searchParams.set("status", status);
  const response = NextResponse.redirect(url);
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}

export async function GET(request: NextRequest) {
  const parsed = verificationQuerySchema.safeParse({
    email: request.nextUrl.searchParams.get("email"),
    token: request.nextUrl.searchParams.get("token"),
  });

  if (!parsed.success) {
    return loginRedirect(request, "verification-invalid");
  }

  const { email, token } = parsed.data;
  const hashedToken = createHash("sha256").update(token).digest("hex");
  const now = new Date();

  try {
    const verified = await prisma.$transaction(async (transaction) => {
      const consumedToken = await transaction.verificationToken.deleteMany({
        where: {
          identifier: email,
          token: hashedToken,
          expires: { gt: now },
        },
      });
      if (consumedToken.count !== 1) {
        return false;
      }

      const user = await transaction.user.findUnique({
        where: { email },
        select: {
          id: true,
          emailVerified: true,
          emailConfirmationPending: true,
        },
      });
      if (!user) return false;

      if (!user.emailVerified || user.emailConfirmationPending) {
        await transaction.user.update({
          where: { id: user.id },
          data: {
            emailVerified: now,
            emailConfirmationPending: false,
          },
        });
      }
      return true;
    });

    return loginRedirect(
      request,
      verified ? "verified" : "verification-invalid",
    );
  } catch (error) {
    console.error("[auth] Gagal mengonfirmasi email:", error);
    return loginRedirect(request, "verification-error");
  }
}
