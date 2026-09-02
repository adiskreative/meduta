"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const signupSchema = z
  .object({
    name: z.string().min(2, "Nama minimal 2 karakter").trim(),
    email: z.string().email("Email tidak valid").trim(),
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

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return {
      errors: { email: ["Email sudah terdaftar"] },
      fieldValues: { name, email },
    };
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: { name, email, password: hashedPassword },
  });

  redirect("/login");
}