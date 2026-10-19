"use server";

import bcrypt from "bcryptjs";
import { createHash, randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { z } from "zod";
import { isEmailEnabled, sendVerificationEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";

const VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

const signupSchema = z
  .object({
    name: z.string().min(2, "Nama minimal 2 karakter").trim(),
    email: z.string().email("Email tidak valid").trim().toLowerCase(),
    password: z
      .string()
      .min(8, "Password minimal 8 karakter")
      .regex(/[a-zA-Z]/, "Harus mengandung huruf")
      .regex(/[0-9]/, "Harus mengandung angka"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Konfirmasi password tidak cocok",
    path: ["confirmPassword"],
  });

export type SignupState = {
  errors?: {
    name?: string[];
    email?: string[];
    password?: string[];
    confirmPassword?: string[];
  };
  message?: string;
  fieldValues?: {
    name?: string;
    email?: string;
  };
};

export async function signup(
  _prevState: SignupState | undefined,
  formData: FormData,
): Promise<SignupState> {
  const result = signupSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!result.success) {
    return {
      errors: result.error.flatten().fieldErrors,
      fieldValues: {
        name: formData.get("name")?.toString(),
        email: formData.get("email")?.toString(),
      },
    };
  }

  const { name, email, password } = result.data;

  if (!isEmailEnabled()) {
    return {
      message: "Layanan email belum aktif. Silakan coba lagi nanti.",
      fieldValues: { name, email },
    };
  }

  const appUrl = z
    .string()
    .url()
    .refine((value) => ["http:", "https:"].includes(new URL(value).protocol))
    .safeParse(process.env.NEXT_PUBLIC_APP_URL);

  if (!appUrl.success) {
    console.error("[auth] NEXT_PUBLIC_APP_URL belum valid untuk konfirmasi email.");
    return {
      message: "Pendaftaran belum dapat diproses. Silakan coba lagi nanti.",
      fieldValues: { name, email },
    };
  }

  const existing = await prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
  });
  if (existing && !existing.emailConfirmationPending) {
    return {
      errors: { email: ["Email sudah terdaftar"] },
      fieldValues: { name, email },
    };
  }

  if (
    existing &&
    (!existing.password || !(await bcrypt.compare(password, existing.password)))
  ) {
    return {
      errors: { email: ["Email sudah terdaftar"] },
      fieldValues: { name, email },
    };
  }

  if (!existing) {
    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        emailConfirmationPending: true,
      },
    });
  }

  const verificationEmail = existing?.email ?? email;
  const token = randomBytes(32).toString("hex");
  const hashedToken = createHash("sha256").update(token).digest("hex");
  const expires = new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS);

  await prisma.$transaction(async (transaction) => {
    await transaction.verificationToken.deleteMany({
      where: { identifier: verificationEmail },
    });
    await transaction.verificationToken.create({
      data: { identifier: verificationEmail, token: hashedToken, expires },
    });
  });

  const confirmationUrl = new URL("/api/auth/verify", appUrl.data);
  confirmationUrl.searchParams.set("email", verificationEmail);
  confirmationUrl.searchParams.set("token", token);
  const emailResult = await sendVerificationEmail({
    to: verificationEmail,
    name: existing?.name ?? name,
    confirmationUrl: confirmationUrl.toString(),
  });

  if (!emailResult.ok) {
    await prisma.verificationToken.deleteMany({
      where: { identifier: verificationEmail, token: hashedToken },
    });
    return {
      message:
        "Email konfirmasi gagal dikirim. Silakan daftar kembali untuk mengirim ulang tautan.",
      fieldValues: { name, email },
    };
  }

  redirect("/login?status=registered");
}