import { describe, expect, it } from "vitest";
import { getEventName } from "@/lib/invitation-data";

describe("getEventName", () => {
  it("mengembalikan nama acara jika tersedia", () => {
    const result = getEventName({ eventName: "Resepsi Pernikahan" });
    expect(result).toBe("Resepsi Pernikahan");
  });

  it("mengembalikan undefined jika eventName bukan string", () => {
    expect(getEventName({ eventName: 123 })).toBeUndefined();
  });

  it("mengembalikan undefined untuk data kosong / null", () => {
    expect(getEventName(null)).toBeUndefined();
    expect(getEventName(undefined)).toBeUndefined();
    expect(getEventName("string")).toBeUndefined();
  });

  it("mengembalikan undefined jika eventName tidak ada", () => {
    expect(getEventName({ groom: { name: "A" } })).toBeUndefined();
  });
});
