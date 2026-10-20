import type { InvitationView } from "@/components/templates/types";

/**
 * Data contoh bawaan untuk preview template & thumbnail live.
 * Admin dapat mengganti sebagian/keseluruhan lewat Admin Panel →
 * Kelola Template → Data Contoh (tersimpan di Template.sampleData).
 * Field yang dikosongkan akan kembali memakai nilai bawaan ini.
 */
export const DEFAULT_SAMPLE_DATA: InvitationView = {
  eventName: "Pernikahan Tika & Andi",
  eventDate: "2026-12-12T14:00:00Z",
  eventTime: "14:00 WITA",
  venueName: "Auditorium Kantor Bupati",
  location: "Jl. Sudirman No. 10, Jakarta",
  locationMap: "https://www.google.com/maps/place/Auditorium+Bupati/@-0.8055733,120.1587894,780m/data=!3m2!1e3!4b1!4m6!3m5!1s0x2d895f89ac402f3f:0x707fe824b0a15cc8!8m2!3d-0.8055733!4d120.1613643!16s%2Fg%2F11c1qn1dt2?entry=ttu&g_ep=EgoyMDI2MTAxNC4wIKXMDSoASAFQAw%3D%3D",
  customMessage:
    "Merupakan suatu kehormatan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu kepada kedua mempelai.",
  groom: {
    name: "Andi Pratama",
    nickname: "Andi",
    parentName: "Bpk. Fulan & Ibu Fulani",
    bio: "Anak kedua dari tiga bersaudara.",
    photoUrl:
      "https://images.unsplash.com/photo-1618835962148-cf177563c6c0?w=600&q=70&auto=format&fit=crop",
  },
  bride: {
    name: "Rahmatika",
    nickname: "Tika",
    parentName: "Bpk. Fulan & Ibu Fulani",
    bio: "Anak pertama dari dua bersaudara.",
    photoUrl:
      "https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?w=600&q=70&auto=format&fit=crop",
  },
  musicUrl: "",
  events: [
    {
      id: "evt1",
      title: "Akad Nikah",
      date: "2026-12-12T08:00:00Z",
      time: "08.00 - 10.00 WITA",
      location: "Ballroom Hotel Grand",
      locationMap: "https://www.google.com/maps/place/Auditorium+Bupati/@-0.8055733,120.1587894,780m/data=!3m2!1e3!4b1!4m6!3m5!1s0x2d895f89ac402f3f:0x707fe824b0a15cc8!8m2!3d-0.8055733!4d120.1613643!16s%2Fg%2F11c1qn1dt2?entry=ttu&g_ep=EgoyMDI2MTAxNC4wIKXMDSoASAFQAw%3D%3D",
    },
    {
      id: "evt2",
      title: "Resepsi",
      date: "2026-12-12T14:00:00Z",
      time: "14.00 - 17.00 WITA",
      location: "Auditorium Kantor Bupati",
      locationMap: "https://www.google.com/maps/place/Auditorium+Bupati/@-0.8055733,120.1587894,780m/data=!3m2!1e3!4b1!4m6!3m5!1s0x2d895f89ac402f3f:0x707fe824b0a15cc8!8m2!3d-0.8055733!4d120.1613643!16s%2Fg%2F11c1qn1dt2?entry=ttu&g_ep=EgoyMDI2MTAxNC4wIKXMDSoASAFQAw%3D%3D",
    },
  ],
  story: [
    {
      id: "st1",
      date: "2019-02-14T00:00:00Z",
      title: "Pertama Bertemu",
      description:
        "Kami bertemu melalui seorang sahabat dan langsung merasa nyambung sejak percakapan pertama.",
    },
    {
      id: "st2",
      date: "2023-08-17T00:00:00Z",
      title: "Lamaran",
      description:
        "Setelah berjalan beberapa tahun, kami melangkah ke jenjang yang lebih serius dengan lamaran yang sakral.",
    },
  ],
  gallery: [
    { id: "g1", url: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=600&q=60", caption: "Pre-wedding di Pantai" },
    { id: "g2", url: "https://images.unsplash.com/photo-1519741497674-611481863552?w=600&q=60", caption: "Hari Akad" },
    { id: "g3", url: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=600&q=60", caption: "Resepsi" },
    { id: "g4", url: "https://images.unsplash.com/photo-1520854221256-17451cc331bf?w=600&q=60", caption: "Bersama Keluarga" },
  ],
  gifts: [
    { id: "kf1", provider: "BRI", name: "Bank Rakyat Indonesia", accountNumber: "1234 5678 9012", holderName: "Andi Pratama" },
    { id: "kf2", provider: "BCA", name: "Bank Central Asia", accountNumber: "9876 5432 1098", holderName: "Rahmatika" },
  ],
};

/** Gabung dalam: nilai override menang jika terisi; array mengganti utuh. */
export function mergeSampleData(
  override: unknown,
  base: InvitationView = DEFAULT_SAMPLE_DATA,
): InvitationView {
  if (!override || typeof override !== "object") return base;
  return deepMerge(base, override as Record<string, unknown>) as InvitationView;
}

function deepMerge(base: unknown, override: unknown): unknown {
  // Array & scalar: override mengganti total (bukan digabung per-index)
  if (Array.isArray(override)) return override;
  if (override === null || override === undefined) return base;
  if (typeof override !== "object" || typeof base !== "object" || base === null) {
    return override;
  }
  const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  for (const [key, value] of Object.entries(override as Record<string, unknown>)) {
    out[key] = key in (base as Record<string, unknown>)
      ? deepMerge((base as Record<string, unknown>)[key], value)
      : value;
  }
  return out;
}
