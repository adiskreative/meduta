// lib/date.ts
export type TzKey = "WIB" | "WITA" | "WIT";

const TZ: Record<TzKey, string> = {
  WIB: "Asia/Jakarta",
  WITA: "Asia/Makassar",
  WIT: "Asia/Jayapura",
};

export function formatDateTime(value: Date | string, tz: TzKey = "WITA") {
  const text = new Date(value).toLocaleString("id-ID", {
    timeZone: TZ[tz],
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return `${text} ${tz}`;
}