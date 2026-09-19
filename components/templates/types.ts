export type CouplePerson = {
  name?: string;
  nickname?: string;
  childOf?: string;
  parentName?: string;
  bio?: string;
  instagram?: string;
  photoUrl?: string;
};

export type EventItem = {
  id: string;
  title?: string;
  date?: string;
  time?: string;
  location?: string;
  locationMap?: string;
};

export type StoryItem = {
  id: string;
  date?: string;
  title?: string;
  description?: string;
};

export type GalleryItem = { id: string; url: string; caption?: string };
export type VideoItem = { id: string; url: string; title?: string };
export type SlideItem = { id: string; url: string };
export type GiftItem = {
  id: string;
  provider: string;
  name: string;
  accountNumber: string;
  holderName: string;
};

export type InvitationView = {
  eventName?: string;
  eventDate?: string;
  eventTime?: string;
  venueName?: string;
  location?: string;
  locationMap?: string;
  customMessage?: string;
  musicUrl?: string;
  /** Background kustom pilihan user — meng-override background template. */
  backgroundUrl?: string;
  /** Foto khusus halaman "Buka Undangan" — pilihan user/admin, meng-override
   *  prioritas bawaan (mempelai → galeri[0]). */
  gatePhotoUrl?: string;
  groom?: CouplePerson;
  bride?: CouplePerson;
  story?: StoryItem[];
  events?: EventItem[];
  gallery?: GalleryItem[];
  videos?: VideoItem[];
  slides?: SlideItem[];
  gifts?: GiftItem[];
};

export type WishItem = {
  id: string;
  guestName: string;
  message: string;
  createdAt: string;
};

export type Decoration = {
  id: string;
  assetUrl: string;
  placement: string; // floating | cover | section
  layer: string; // decor | frame
  zIndex: number;
  position: { x?: number; y?: number } | null;
  size: { width?: number; height?: number } | null;
  rotated: number | null;
};

export type TemplateProps = {
  invitationId: string;
  slug: string;
  guestName?: string;
  data: InvitationView;
  isPublished: boolean;
  /** Mode embed (thumbnail live iframe): gerbang terbuka & musik mati. */
  embedded?: boolean;
  wishes?: WishItem[];
  decorations?: Decoration[];
};

/* ------------------------------------------------------------------ */
/* Agenda: gabung Acara Utama + Rangkaian Acara tanpa duplikasi        */
/* ------------------------------------------------------------------ */

export type MainEventFields = {
  date?: string;
  time?: string;
  venue?: string;
  mapUrl?: string;
};

/**
 * Mencegah acara akad tampil dobel: list events (Rangkaian Acara) kerap
 * memuat entri berjudul "Akad ..." padahal info akad sudah dirender dari
 * Acara Utama (eventDate/eventTime/venueName). Aturan:
 * - Entri events pertama yang berjudul diawali "Akad" digabung ke main,
 *   lalu dikeluarkan dari daftar tambahan; sisanya tetap dirender.
 * - Mode default (section generik "Hari Bahagia"): field Acara Utama yang
 *   sudah terisi TETAP dipakai (isian admin menang), yang kosong diisi dari
 *   entri akad agar tidak ada info hilang.
 * - Mode `akadWins` (kartu berjudul "Akad Nikah", mis. zen/vogue/celestial):
 *   detail dari entri akad yang menang karena kartu itu memang acara akad.
 */
export function splitAgenda(
  events: EventItem[] | undefined,
  main: MainEventFields,
  opts?: { akadWins?: boolean },
): { main: MainEventFields; additional: EventItem[] } {
  const list = events ?? [];
  const idx = list.findIndex((e) => /^akad/i.test((e.title ?? "").trim()));
  if (idx === -1) return { main, additional: list };
  const akad = list[idx];
  const pick = opts?.akadWins
    ? (akadVal: string | undefined, mainVal: string | undefined) => akadVal || mainVal
    : (akadVal: string | undefined, mainVal: string | undefined) => mainVal || akadVal;
  return {
    main: {
      date: pick(akad.date, main.date),
      time: pick(akad.time, main.time),
      venue: pick(akad.location, main.venue),
      mapUrl: pick(akad.locationMap, main.mapUrl),
    },
    additional: list.filter((_, i) => i !== idx),
  };
}

export function formatDate(date?: string): string {
  if (!date) return "";
  const value = new Date(date);
  if (Number.isNaN(value.getTime())) return date;
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(value);
}

export function formatTime(time?: string): string {
  if (!time) return "";
  return time;
}
