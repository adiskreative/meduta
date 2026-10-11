export function slugifyName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-");
}

export function buildUniqueLink(invitationSlug: string, name: string): string {
  return `${invitationSlug}?to=${encodeURIComponent(slugifyName(name))}`;
}
