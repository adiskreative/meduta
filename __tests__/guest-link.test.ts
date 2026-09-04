import { describe, expect, it } from "vitest";
import { buildUniqueLink, slugifyName } from "@/lib/guest-link";

describe("slugifyName", () => {
  it("mengubah spasi menjadi strip dan huruf kecil", () => {
    expect(slugifyName("Rizky Pratama")).toBe("rizky-pratama");
    expect(slugifyName("Andi & Sari")).toBe("andi-&-sari");
  });

  it("merapikan spasi berlebih", () => {
    expect(slugifyName("  Budi   Santoso ")).toBe("budi-santoso");
  });

  it("menangani kapitalisasi", () => {
    expect(slugifyName("SARI DEWI")).toBe("sari-dewi");
  });
});

describe("buildUniqueLink", () => {
  it("membuat link unik dari slug undangan dan nama", () => {
    const link = buildUniqueLink("undangan-123", "Budi Santoso");
    expect(link).toBe("undangan-123?to=budi-santoso");
  });

  it("meng-encode nama dengan karakter khusus", () => {
    const link = buildUniqueLink("undangan-alpha", "Bapak H. Ahmad");
    expect(link).toContain("undangan-alpha?to=");
    expect(decodeURIComponent(link)).toBe(
      "undangan-alpha?to=bapak-h.-ahmad",
    );
  });
});
