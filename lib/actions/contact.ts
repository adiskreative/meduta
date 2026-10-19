"use server";

import { z } from "zod";
import { isEmailEnabled, escapeHtml } from "@/lib/email";

/** Email penerima pesan kontak (bisa dioverride via env). */
const KONTAK_PENERIMA =
  process.env.CONTACT_EMAIL ?? "admin@meduta.my.id";

const contactSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter").max(100).trim(),
  email: z.string().email("Email tidak valid").max(200).trim(),
  message: z
    .string()
    .min(10, "Pesan minimal 10 karakter")
    .max(2000, "Pesan maksimal 2000 karakter")
    .trim(),
  // Honeypot: harus tetap kosong (hanya bot yang mengisinya)
  company: z.string().max(0).optional(),
});

export type ContactState = {
  ok?: boolean;
  message?: string;
  errors?: {
    name?: string[];
    email?: string[];
    message?: string[];
  };
};

/** Rate limit sederhana in-memory: maks 3 pesan per 10 menit per pengirim. */
const attempts = new Map<string, number[]>();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 3;

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const list = (attempts.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  if (list.length >= MAX_PER_WINDOW) return true;
  list.push(now);
  attempts.set(key, list);
  return false;
}

function buildContactHtml(name: string, email: string, message: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #db2777; margin-bottom: 16px;">Pesan Baru dari Landing Page Meduta</h2>
      <table style="border-collapse: collapse; width: 100%;">
        <tr>
          <td style="padding: 8px 12px; background: #fdf2f8; font-weight: bold; color: #9f1239; border-radius: 8px 0 0 8px;">Nama</td>
          <td style="padding: 8px 12px; border-radius: 0 8px 8px 0;">${escapeHtml(name)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 12px; background: #fdf2f8; font-weight: bold; color: #9f1239; border-radius: 8px 0 0 8px;">Email</td>
          <td style="padding: 8px 12px; border-radius: 0 8px 8px 0;">${escapeHtml(email)}</td>
        </tr>
      </table>
      <div style="margin-top: 16px; padding: 16px; background: #fafafa; border: 1px solid #e4e4e7; border-radius: 12px;">
        <p style="margin: 0; white-space: pre-wrap; color: #27272a; line-height: 1.6;">${escapeHtml(message)}</p>
      </div>
      <p style="color: #a1a1aa; font-size: 12px; margin-top: 16px;">
        Balas langsung ke email pengirim untuk menjawab pesan ini.
      </p>
    </div>
  `;
}

export async function sendContactMessage(
  _state: ContactState | undefined,
  formData: FormData,
): Promise<ContactState> {
  const parsed = contactSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    message: formData.get("message"),
    company: formData.get("company") ?? "",
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  // Bot terdeteksi via honeypot — balas sukses palsu agar tidak mencoba lagi
  if (parsed.data.company) return { ok: true, message: "Pesan terkirim." };

  if (!isEmailEnabled()) {
    return {
      ok: false,
      message:
        "Layanan email belum aktif. Silakan hubungi kami langsung di admin@meduta.my.id.",
    };
  }

  if (isRateLimited(parsed.data.email.toLowerCase())) {
    return {
      ok: false,
      message:
        "Anda sudah mengirim beberapa pesan. Coba lagi dalam 10 menit atau hubungi kami via WhatsApp.",
    };
  }

  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);
  const from = process.env.EMAIL_FROM ?? "Meduta <admin@meduta.my.id>";

  try {
    const { error } = await resend.emails.send({
      from,
      to: KONTAK_PENERIMA,
      replyTo: parsed.data.email,
      subject: `Pesan baru dari ${parsed.data.name} — Meduta`,
      html: buildContactHtml(parsed.data.name, parsed.data.email, parsed.data.message),
    });

    if (error) {
      console.error("[kontak] Gagal kirim:", error);
      return {
        ok: false,
        message:
          "Pesan gagal terkirim. Coba lagi atau hubungi kami via WhatsApp: 0823 9988 9992.",
      };
    }

    return {
      ok: true,
      message: "Pesan terkirim! Kami akan membalas ke email Anda secepatnya.",
    };
  } catch (err) {
    console.error("[kontak] Error:", err);
    return {
      ok: false,
      message:
        "Terjadi kesalahan. Silakan hubungi kami via WhatsApp: 0823 9988 9992.",
    };
  }
}
