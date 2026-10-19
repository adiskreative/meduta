import { describe, expect, it } from "vitest";
import {
  buildVerificationEmailHtml,
  buildInvitationHtml,
  escapeHtml,
  isEmailEnabled,
} from "@/lib/email";

describe("escapeHtml", () => {
  it("meng-escape karakter berbahaya", () => {
    const input = `<script>alert("x")</script> & 'quotes'`;
    const output = escapeHtml(input);
    expect(output).not.toContain("<script>");
    expect(output).toContain("&lt;script&gt;");
    expect(output).toContain("&amp;");
    expect(output).toContain("&quot;");
    expect(output).toContain("&#039;");
  });

  it("mengembalikan string biasa apa adanya", () => {
    expect(escapeHtml("Halo dunia")).toBe("Halo dunia");
  });
});

describe("buildInvitationHtml", () => {
  const base = {
    to: "tamu@example.com",
    guestName: "Budi",
    eventName: "Resepsi Pernikahan",
    coupleNames: "Andi & Sari",
    invitationUrl: "https://meduta.app/u/undangan-1?to=budi",
  };

  it("membuat tautan undangan di dalam HTML", () => {
    const html = buildInvitationHtml(base);
    expect(html).toContain(base.invitationUrl);
    expect(html).toContain("Budi");
    expect(html).toContain("Andi &amp; Sari");
  });

  it("menyertakan detail acara bila disediakan", () => {
    const html = buildInvitationHtml({
      ...base,
      eventDate: "12 Desember 2026",
      eventTime: "08:00 WIB",
      location: "Hotel Grand Ballroom",
    });
    expect(html).toContain("12 Desember 2026");
    expect(html).toContain("08:00 WIB");
    expect(html).toContain("Hotel Grand Ballroom");
  });

  it("tidak menyertakan detail acara bila kosong", () => {
    const html = buildInvitationHtml({ ...base, location: "" });
    expect(html).not.toContain("<strong>Tanggal:</strong>");
  });

  it("meng-escape value tamu agar tidak menjalankan HTML", () => {
    const html = buildInvitationHtml({ ...base, guestName: "<b>Jahat</b>" });
    expect(html).toContain("&lt;b&gt;Jahat&lt;/b&gt;");
    expect(html).not.toContain("<b>Jahat</b>");
  });
});

describe("buildVerificationEmailHtml", () => {
  it("menyertakan tautan konfirmasi dan meng-escape nama", () => {
    const html = buildVerificationEmailHtml({
      to: "user@example.com",
      name: "<script>alert(1)</script>",
      confirmationUrl: "https://meduta.my.id/api/auth/verify?token=abc",
    });

    expect(html).toContain(
      'href="https://meduta.my.id/api/auth/verify?token=abc"',
    );
    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(html).not.toContain("<script>");
  });
});

describe("isEmailEnabled", () => {
  it("mengembalikan boolean", () => {
    expect(typeof isEmailEnabled()).toBe("boolean");
  });
});
