"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type AccountState = {
  errors?: {
    name?: string[];
    email?: string[];
    currentPassword?: string[];
    newPassword?: string[];
  };
  message?: string;
  success?: boolean;
};

export async function updateProfile(
  _state: AccountState | undefined,
  formData: FormData,
): Promise<AccountState> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const profileSchema = z.object({
    name: z.string().min(2, "Nama minimal 2 karakter").max(120).trim(),
    email: z.string().email("Email tidak valid").trim(),
  });
  const result = profileSchema.safeParse({
    name: formData.get("name") ?? "",
    email: formData.get("email") ?? "",
  });
  if (!result.success) {
    return { errors: result.error.flatten().fieldErrors };
  }

  const { name, email } = result.data;

  if (email.toLowerCase() !== session.user.email?.toLowerCase()) {
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      return {
        message: "Email sudah digunakan akun lain.",
        success: false,
        errors: { email: ["Email ini sudah terdaftar."] },
      };
    }
  }

  const current = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!current) return { message: "Akun tidak ditemukan.", success: false };

  if (!current.password) {
    return {
      message: "Akun ini memakai login Google, tidak bisa ubah profil di sini.",
      success: false,
    };
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { name, email },
  });

  revalidatePath("/dashboard/akun");
  return { success: true, message: "Profil diperbarui." };
}

export async function changePassword(
  _state: AccountState | undefined,
  formData: FormData,
): Promise<AccountState> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const schema = z.object({
    currentPassword: z.string().min(1, "Password lama wajib diisi"),
    newPassword: z
      .string()
      .min(8, "Password baru minimal 8 karakter")
      .regex(/[a-zA-Z]/, "Harus mengandung huruf")
      .regex(/[0-9]/, "Harus mengandung angka"),
  });

  const result = schema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
  });
  if (!result.success) {
    return { errors: result.error.flatten().fieldErrors };
  }

  const current = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!current) return { message: "Akun tidak ditemukan.", success: false };
  if (!current.password) {
    return {
      message: "Akun ini memakai login Google, password tidak ada.",
      success: false,
    };
  }

  const valid = await bcrypt.compare(result.data.currentPassword, current.password);
  if (!valid) {
    return {
      message: "Password lama salah.",
      success: false,
      errors: { currentPassword: ["Password lama salah."] },
    };
  }

  const hashed = await bcrypt.hash(result.data.newPassword, 10);
  await prisma.user.update({
    where: { id: session.user.id },
    data: { password: hashed },
  });

  revalidatePath("/dashboard/akun");
  return { success: true, message: "Password berhasil diubah." };
}
