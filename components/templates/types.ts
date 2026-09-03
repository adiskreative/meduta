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
  wishes?: WishItem[];
  decorations?: Decoration[];
};

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
