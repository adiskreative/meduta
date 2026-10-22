"use server";

import bcrypt from "bcryptjs";
import { createHash, randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  isEmailEnabled,
  sendPasswordResetEmail,
} from "@/lib/email";
import { prisma } from "@/lib/prisma";

const PASSWORD_RESET_IDENTIFIER_PREFIX = "password-reset:";
const PASSWORD_RESET_TOKEN_TTL_MS = 60 * 60 * 1000;
const GENERIC_RESET_MESSAGE =
  "Jika email terdaftar, tautan untuk mengatur ulang password akan segera dikirim. Periksa kotak masuk dan folder spam.";

const emailSchema = z.string().email("Email tidak valid").trim().toLowerCase();
const passwordSchema = z
  .string()
  .min(8, "Password minimal 8 karakter")
  .regex(/[a-zA-Z]/, "Harus mengandung huruf")
  .regex(/[0-9]/, "Harus mengandung angka");

export type PasswordResetRequestState = {
  errors?: { email?: string[] };
  fieldValues?: { email?: string };
  message?: string;
  success?: boolean;
};

export type PasswordResetState = {
  errors?: {
    password?: string[];
    confirmPassword?: string[];
  };
  message?: string;
};

function getAppUrl() {
  return z
    .string()
    .url()
    .refine((value) => ["http:", "https:"].includes(new URL(value).protocol))
    .safeParse(process.env.NEXT_PUBLIC_APP_URL);
}

export async function requestPasswordReset(
  _previousState: PasswordResetRequestState | undefined,
  formData: FormData,
): Promise<PasswordResetRequestState> {
  const parsedEmail = emailSchema.safeParse(formData.get("email"));
  if (!parsedEmail.success) {
    return {
      errors: { email: parsedEmail.error.issues.map((issue) => issue.message) },
      fieldValues: { email: formData.get("email")?.toString() },
    };
  }

  if (!isEmailEnabled()) {
    console.error("[auth] Reset password tidak dapat dikirim: email belum aktif.");
    return {
      message: "Layanan email belum aktif. Silakan coba lagi nanti.",
      fieldValues: { email: parsedEmail.data },
    };
  }

  const appUrl = getAppUrl();
  if (!appUrl.success) {
    console.error("[auth] NEXT_PUBLIC_APP_URL belum valid untuk reset password.");
    return {
      message: "Permintaan belum dapat diproses. Silakan coba lagi nanti.",
      fieldValues: { email: parsedEmail.data },
    };
  }

  const email = parsedEmail.data;
  const user = await prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
    select: { email: true, name: true, password: true },
  });

  if (user?.password) {
    const identifier = `${PASSWORD_RESET_IDENTIFIER_PREFIX}${email}`;
    const token = randomBytes(32).toString("hex");
    const hashedToken = createHash("sha256").update(token).digest("hex");
    const expires = new Date(Date.now() + PASSWORD_RESET_TOKEN_TTL_MS);

    await prisma.$transaction(async (transaction) => {
      await transaction.verificationToken.deleteMany({
        where: { identifier },
      });
      await transaction.verificationToken.create({
        data: { identifier, token: hashedToken, expires },
      });
    });

    const resetUrl = new URL("/reset-password", appUrl.data);
    resetUrl.searchParams.set("email", email);
    resetUrl.searchParams.set("token", token);
    const emailResult = await sendPasswordResetEmail({
      to: user.email,
      name: user.name?.trim() || "Sahabat Meduta",
      resetUrl: resetUrl.toString(),
    });

    if (!emailResult.ok) {
      await prisma.verificationToken.deleteMany({
        where: { identifier, token: hashedToken },
      });
      return { success: true, message: GENERIC_RESET_MESSAGE };
    }
  }

  return {
    success: true,
    message: GENERIC_RESET_MESSAGE,
    fieldValues: { email },
  };
}

export async function resetPassword(
  _previousState: PasswordResetState | undefined,
  formData: FormData,
): Promise<PasswordResetState> {
  const emailResult = emailSchema.safeParse(formData.get("email"));
  const tokenResult = z.string().regex(/^[a-f0-9]{64}$/).safeParse(
    formData.get("token"),
  );
  const parsedPassword = passwordSchema.safeParse(formData.get("password"));
  const confirmPassword = z.string().safeParse(
    formData.get("confirmPassword"),
  );

  if (!parsedPassword.success) {
    return {
      errors: {
        password: parsedPassword.error.issues.map((issue) => issue.message),
      },
    };
  }
  if (!confirmPassword.success || confirmPassword.data !== formData.get("password")) {
    return {
      errors: { confirmPassword: ["Konfirmasi password tidak cocok."] },
    };
  }

  if (!emailResult.success || !tokenResult.success) {
    return {
      message: "Tautan reset tidak valid atau sudah kedaluwarsa. Minta tautan baru.",
    };
  }

  const email = emailResult.data;
  const identifier = `${PASSWORD_RESET_IDENTIFIER_PREFIX}${email}`;
  const hashedToken = createHash("sha256").update(tokenResult.data).digest("hex");
  const now = new Date();
  const hashedPassword = await bcrypt.hash(parsedPassword.data, 10);

  const passwordUpdated = await prisma.$transaction(async (transaction) => {
    const consumedToken = await transaction.verificationToken.deleteMany({
      where: {
        identifier,
        token: hashedToken,
        expires: { gt: now },
      },
    });
    if (consumedToken.count !== 1) return false;

    const user = await transaction.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
      select: { id: true },
    });
    if (!user) return false;

    await transaction.verificationToken.deleteMany({
      where: { identifier },
    });
    await transaction.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        failedLoginAttempts: 0,
        loginLockedUntil: null,
      },
    });
    return true;
  });

  if (!passwordUpdated) {
    return {
      message: "Tautan reset tidak valid atau sudah kedaluwarsa. Minta tautan baru.",
    };
  }

  redirect("/login?status=password-reset");
}
