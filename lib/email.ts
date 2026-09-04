import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;
const from =
  process.env.EMAIL_FROM ?? "Meduta <undangan@meduta.com>";

const resend = apiKey ? new Resend(apiKey) : null;

export type InvitationEmailData = {
  to: string;
  guestName: string;
  eventName: string;
  coupleNames: string;
  invitationUrl: string;
  eventDate?: string;
  eventTime?: string;
  location?: string;
};

export function isEmailEnabled(): boolean {
  return Boolean(resend);
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function buildInvitationHtml(data: InvitationEmailData): string {
  const {
    guestName,
    eventName,
    coupleNames,
    invitationUrl,
    eventDate,
    eventTime,
    location,
  } = data;

  const eventDetail = [
    eventDate ? `<p><strong>Tanggal:</strong> ${escapeHtml(eventDate)}</p>` : "",
    eventTime ? `<p><strong>Waktu:</strong> ${escapeHtml(eventTime)}</p>` : "",
    location ? `<p><strong>Lokasi:</strong> ${escapeHtml(location)}</p>` : "",
  ].join("");

  return `
    <div style="font-family: Georgia, serif; max-width: 480px; margin: 0 auto; padding: 24px;">
      <h1 style="text-align: center; color: #9f1239; font-size: 28px; margin-bottom: 4px;">
        Undangan Pernikahan
      </h1>
      <p style="text-align: center; color: #52525b; font-size: 18px; margin: 0 0 24px;">
        ${escapeHtml(coupleNames)}
      </p>
      <p style="color: #3f3f46; font-size: 15px; line-height: 1.6;">
        Assalamu'alaikum ${escapeHtml(guestName)},
      </p>
      <p style="color: #3f3f46; font-size: 15px; line-height: 1.6;">
        Dengan penuh rasa syukur, kami mengundang Anda untuk hadir pada acara pernikahan kami:
      </p>
      <div style="background: #fdf2f8; border: 1px solid #fbcfe8; border-radius: 12px; padding: 16px; margin: 20px 0;">
        <p style="margin: 0 0 8px; font-size: 16px; color: #18181b;"><strong>${escapeHtml(eventName)}</strong></p>
        ${eventDetail}
      </div>
      <p style="color: #3f3f46; font-size: 15px; line-height: 1.6;">
        Mohon buka undangan digital berikut untuk melihat detail lengkap dan konfirmasi kehadiran Anda:
      </p>
      <div style="text-align: center; margin: 24px 0;">
        <a href="${invitationUrl}" style="display: inline-block; background: #be123c; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 9999px; font-size: 15px;">
          Buka Undangan
        </a>
      </div>
      <p style="color: #a1a1aa; font-size: 12px; text-align: center; margin-top: 24px;">
        <a href="${invitationUrl}" style="color: #a1a1aa;">${escapeHtml(invitationUrl)}</a>
      </p>
      <p style="color: #71717a; font-size: 13px; text-align: center; margin-top: 16px;">
        Hormat kami,<br />${escapeHtml(coupleNames)}
      </p>
    </div>
  `;
}

export async function sendInvitationEmail(data: InvitationEmailData): Promise<{
  ok: boolean;
  error?: string;
}> {
  if (!resend) {
    // Dev mode tanpa RESEND_API_KEY: hanya log supaya mudah ditelusuri.
    console.info(
      `[email] RESEND_API_KEY kosong — email undangan tidak dikirim. to=${data.to} url=${data.invitationUrl}`,
    );
    return { ok: true };
  }

  try {
    const { error } = await resend.emails.send({
      from,
      to: data.to,
      subject: `Undangan Pernikahan ${data.coupleNames}`,
      html: buildInvitationHtml(data),
    });

    if (error) {
      console.error("[email] Gagal kirim:", error);
      return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[email] Gagal kirim:", err);
    return { ok: false, error: message };
  }
}
