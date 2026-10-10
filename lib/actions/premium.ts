"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";
import {
  PREMIUM_PACKAGE,
  PREMIUM_PRICE,
  isPremiumUser,
} from "@/lib/premium";

export type PremiumState = { success?: boolean; message?: string };

/**
 * Aktivasi paket Premium.
 * Pembayaran diproses di luar aplikasi saat ini (transfer/konfirmasi admin),
 * sehingga aktivasi di sini mencatat transaksi sukses dan membuka fitur premium.
 */
export async function activatePremium(
  _prev: PremiumState | undefined,
  _formData: FormData,
): Promise<PremiumState> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  if (await isPremiumUser(userId)) {
    return { success: true, message: "Akun Anda sudah Premium." };
  }

  await prisma.transaction.create({
    data: {
      userId,
      packageName: PREMIUM_PACKAGE,
      amount: PREMIUM_PRICE,
      status: "success",
    },
  });

  await createNotification({
    userId,
    type: "SYSTEM",
    title: "Paket Premium aktif 🎉",
    body: "Selamat! Semua template premium dan fitur lengkap kini terbuka untuk akun Anda.",
    link: "/dashboard/pilih-tema",
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/pilih-tema");
  revalidatePath("/dashboard/transaksi");
  redirect("/dashboard/transaksi");
}

/**
 * Server action kecil untuk memeriksa status premium (mis. dari client komponen).
 */
export async function checkPremium(): Promise<boolean> {
  const session = await auth();
  if (!session?.user?.id) return false;
  return isPremiumUser(session.user.id);
}
