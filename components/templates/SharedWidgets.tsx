"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarPlus } from "lucide-react";

/**
 * Widget bersama antar-template: countdown save-the-date & tombol
 * "Simpan di Google Calendar" yang dibangun dinamis dari data acara user.
 * (Diekstrak dari BotanicalTemplate agar tidak diduplikasi.)
 */

export function useCountdown(target?: string) {
  const date = useMemo(() => {
    if (!target) return null;
    const d = new Date(target);
    return Number.isNaN(d.getTime()) ? null : d;
  }, [target]);
  const [left, setLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    if (!date) return;
    const calc = () => {
      const diff = date.getTime() - Date.now();
      if (diff <= 0) return;
      setLeft({
        days: Math.floor(diff / 86_400_000),
        hours: Math.floor(diff / 3_600_000) % 24,
        minutes: Math.floor(diff / 60_000) % 60,
        seconds: Math.floor(diff / 1_000) % 60,
      });
    };
    calc();
    const t = setInterval(calc, 1000);
    return () => clearInterval(t);
  }, [date]);

  return left;
}

export function Countdown({
  target,
  valueClass = "text-3xl sm:text-4xl",
  labelClass = "text-[10px] sm:text-xs",
  boxClass = "rounded-2xl border border-[#E2DAD0] bg-white/70",
}: {
  target: string;
  valueClass?: string;
  labelClass?: string;
  boxClass?: string;
}) {
  const t = useCountdown(target);
  const items = [
    { label: "Hari", value: t.days },
    { label: "Jam", value: t.hours },
    { label: "Menit", value: t.minutes },
    { label: "Detik", value: t.seconds },
  ];
  return (
    <div className="grid grid-cols-4 gap-3 sm:gap-4">
      {items.map((item) => (
        <div
          key={item.label}
          className={`flex flex-col items-center px-2 py-4 shadow-sm backdrop-blur-sm ${boxClass}`}
        >
          <span
            className={`font-[family-name:var(--font-serif-elegant)] font-bold tabular-nums ${valueClass}`}
          >
            {String(item.value).padStart(2, "0")}
          </span>
          <span className={`mt-1 font-medium uppercase tracking-widest ${labelClass}`}>
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}

export function googleCalendarUrl(opts: {
  title: string;
  date?: string;
  time?: string;
  location?: string;
  details?: string;
}): string {
  // Tanggal user bisa "2026-12-12T08:00:00Z" atau format lain; fallback: all-day
  let start = "";
  try {
    const d = opts.date ? new Date(opts.date) : null;
    if (d && !Number.isNaN(d.getTime())) {
      const pad = (n: number) => String(n).padStart(2, "0");
      // Format UTC "YYYYMMDDTHHMMSSZ" (Google Calendar menerima UTC)
      start = `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
    }
  } catch {
    start = "";
  }
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: opts.title,
    ...(start ? { dates: `${start}/${start}` } : {}),
    ...(opts.location ? { location: opts.location } : {}),
    ...(opts.details ? { details: opts.details } : {}),
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function SaveToCalendarButton({
  title,
  date,
  time,
  location,
  className,
}: {
  title: string;
  date?: string;
  time?: string;
  location?: string;
  className?: string;
}) {
  const url = googleCalendarUrl({ title, date, time, location });
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={
        className ??
        "inline-flex items-center gap-2 rounded-full border border-[#D0C6B8] bg-[#F4EFEA] px-5 py-2.5 text-xs font-medium text-[#556B2F] transition-colors hover:bg-[#E2DAD0]"
      }
    >
      <CalendarPlus className="h-3.5 w-3.5" />
      Simpan di Google Calendar
    </a>
  );
}
