export type InvitationData = {
  eventName?: string;
  eventDate?: string;
  eventTime?: string;
  location?: string;
  locationMap?: string;
  customMessage?: string;
  groom?: {
    name?: string;
    nickname?: string;
    childOf?: string;
    parentName?: string;
    photoUrl?: string;
  };
  bride?: {
    name?: string;
    nickname?: string;
    childOf?: string;
    parentName?: string;
    photoUrl?: string;
  };
  story?: Array<{
    id: string;
    date?: string;
    title?: string;
    description?: string;
  }>;
  events?: Array<{
    id: string;
    title?: string;
    date?: string;
    time?: string;
    location?: string;
    locationMap?: string;
  }>;
  gallery?: Array<{ id: string; url: string; caption?: string }>;
  videos?: Array<{ id: string; url: string; title?: string }>;
  slides?: Array<{ id: string; url: string }>;
  musicUrl?: string;
  /** Background kustom pilihan user — meng-override background template. */
  backgroundUrl?: string;
  gifts?: Array<{
    id: string;
    provider: string;
    name: string;
    accountNumber: string;
    holderName: string;
  }>;
};

export function getEventName(data: unknown): string | undefined {
  if (
    data &&
    typeof data === "object" &&
    "eventName" in data &&
    typeof (data as Record<string, unknown>).eventName === "string"
  ) {
    return (data as Record<string, unknown>).eventName as string;
  }
  return undefined;
}