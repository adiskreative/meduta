"use client";

import React, { useState } from "react";
import {
  MapPin,
  Clock,
  CalendarDays,
  Heart,
  Music,
  Sprout,
  Gift,
  Copy,
  Check,
  ExternalLink,
  ChevronDown,
  Send,
  MessageSquare,
  UserCheck,
  User,
  Users
} from "lucide-react";
import RingIcon from "@/components/icons/RingIcon";
import { splitAgenda, type TemplateProps, type WishItem } from "./types";
import { getBackgroundUrl, getGatePhotoUrl, resolveGatePhoto } from "@/lib/decoration";
import InvitationGate from "./InvitationGate";
import { useBackgroundMusic, MusicFab, type MusicController } from "./BackgroundMusic";

export interface PersonData {
  name?: string;
  nickname?: string;
  parentName?: string;
  photoUrl?: string;
  bio?: string;
}

export interface EventItem {
  id: string;
  title?: string;
  date?: string;
  time?: string;
  location?: string;
  locationMap?: string;
}

export interface GiftItem {
  id: string;
  provider: string;
  name: string;
  accountNumber: string;
  holderName: string;
}

export interface InvitationData {
  eventName?: string;
  eventDate?: string;
  eventTime?: string;
  venueName?: string;
  location?: string;
  locationMap?: string;
  musicUrl?: string;
  customMessage?: string;
  groom?: PersonData;
  bride?: PersonData;
  events?: EventItem[];
  gifts?: GiftItem[];
}

export function formatDate(dateString?: string): string {
  if (!dateString) return "-";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return new Intl.DateTimeFormat("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
  } catch {
    return dateString;
  }
}

export function formatTime(timeString?: string): string {
  if (!timeString) return "-";
  if (timeString.includes("WIB") || timeString.includes("WITA") || timeString.includes("WIT")) {
    return timeString;
  }
  return `${timeString} WIB`;
}

const ACCENT =
  "bg-emerald-800 hover:bg-emerald-900 text-amber-50 shadow-lg shadow-emerald-900/20 transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50";
const BORDER =
  "border-stone-200 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/15 rounded-xl transition-all outline-none";

function LeafDivider() {
  return (
    <div className="flex items-center justify-center gap-3 my-3 text-emerald-800/40">
      <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-emerald-800/30" />
      <Sprout className="h-4 w-4 animate-pulse text-emerald-700/70" />
      <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-emerald-800/30" />
    </div>
  );
}

function FloralCornerDecoration() {
  return (
    <div className="pointer-events-none absolute -top-6 -right-6 h-28 w-28 opacity-10 text-emerald-950">
      <svg viewBox="0 0 100 100" fill="currentColor">
        <path d="M50 0 C60 30 70 40 100 50 C70 60 60 70 50 100 C40 70 30 60 0 50 C30 40 40 30 50 0 Z" />
      </svg>
    </div>
  );
}

function RsvpForm({
  initialName = "",
  accentClass = ACCENT,
  borderClass = BORDER,
}: {
  invitationId?: string;
  initialName?: string;
  accentClass?: string;
  borderClass?: string;
}) {
  const [name, setName] = useState(initialName);
  const [attendance, setAttendance] = useState<"HADIR" | "TIDAK_HADIR" | "RAGU">("HADIR");
  const [guestCount, setGuestCount] = useState("1");
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="text-center py-6 space-y-3 bg-emerald-50/80 rounded-2xl p-6 border border-emerald-200">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-700 text-amber-50 shadow-md">
          <UserCheck className="h-6 w-6" />
        </div>
        <h4 className="font-[family-name:var(--font-display)] text-xl font-medium text-emerald-950">Konfirmasi Terkirim!</h4>
        <p className="text-xs text-stone-600 leading-relaxed max-w-xs mx-auto">
          Terima kasih <span className="font-semibold text-emerald-900">{name}</span>. Konfirmasi kehadiran Anda telah tersimpan dengan status{" "}
          <span className="font-bold uppercase tracking-wider text-emerald-800">
            {attendance === "HADIR" ? "Hadir" : attendance === "TIDAK_HADIR" ? "Tidak Hadir" : "Masih Ragu"}
          </span>.
        </p>
        <button
          onClick={() => setSubmitted(false)}
          className="mt-2 text-xs font-semibold text-emerald-800 underline hover:text-emerald-950"
        >
          Ubah Konfirmasi
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-left">
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">
          Nama Lengkap
        </label>
        <div className="relative">
          <User className="absolute left-3.5 top-3 h-4 w-4 text-stone-400" />
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Masukkan nama Anda"
            className={`w-full pl-10 pr-4 py-2.5 text-sm bg-stone-50/50 text-stone-800 ${borderClass}`}
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">
          Konfirmasi Kehadiran
        </label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: "HADIR", label: "Hadir" },
            { id: "TIDAK_HADIR", label: "Absen" },
            { id: "RAGU", label: "Ragu" },
          ].map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setAttendance(option.id as "HADIR" | "TIDAK_HADIR" | "RAGU")}
              className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                attendance === option.id
                  ? "bg-emerald-800 text-white border-emerald-800 shadow-sm"
                  : "bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {attendance === "HADIR" && (
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">
            Jumlah Tamu
          </label>
          <div className="relative">
            <Users className="absolute left-3.5 top-3 h-4 w-4 text-stone-400" />
            <select
              value={guestCount}
              onChange={(e) => setGuestCount(e.target.value)}
              className={`w-full pl-10 pr-4 py-2.5 text-sm bg-stone-50/50 text-stone-800 ${borderClass}`}
            >
              <option value="1">1 Orang</option>
              <option value="2">2 Orang</option>
              <option value="3">3 Orang</option>
              <option value="4">4 Orang</option>
            </select>
          </div>
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">
          Catatan / Ucapan Singkat
        </label>
        <textarea
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Tulis pesan atau catatan untuk pengantin..."
          className={`w-full p-3 text-sm bg-stone-50/50 text-stone-800 ${borderClass}`}
        />
      </div>

      <button
        type="submit"
        className={`w-full py-3 px-6 rounded-xl font-medium text-sm flex items-center justify-center gap-2 ${accentClass}`}
      >
        <Send className="h-4 w-4" /> Kirim Konfirmasi
      </button>
    </form>
  );
}

function WishForm({
  accentClass = ACCENT,
  borderClass = BORDER,
  onAddWish,
}: {
  invitationId?: string;
  accentClass?: string;
  borderClass?: string;
  onAddWish?: (wish: WishItem) => void;
}) {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !message.trim()) return;
    setIsSending(true);

    setTimeout(() => {
      const newWish: WishItem = {
        id: Date.now().toString(),
        guestName: name,
        message,
        createdAt: new Date().toISOString(),
      };
      if (onAddWish) onAddWish(newWish);
      setName("");
      setMessage("");
      setIsSending(false);
    }, 400);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-left">
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">
          Nama Pengirim
        </label>
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nama Anda / Kerabat"
          className={`w-full px-4 py-2.5 text-sm bg-stone-50/50 text-stone-800 ${borderClass}`}
        />
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">
          Ucapan & Doa Restu
        </label>
        <textarea
          required
          rows={3}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Tuliskan doa serta hapan baik untuk kedua mempelai..."
          className={`w-full p-3 text-sm bg-stone-50/50 text-stone-800 ${borderClass}`}
        />
      </div>

      <button
        type="submit"
        disabled={isSending}
        className={`w-full py-3 px-6 rounded-xl font-medium text-sm flex items-center justify-center gap-2 ${accentClass}`}
      >
        <MessageSquare className="h-4 w-4" />
        {isSending ? "Mengirim..." : "Kirim Ucapan"}
      </button>
    </form>
  );
}

function WishList({ wishes }: { wishes: WishItem[] }) {
  if (wishes.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-stone-300 p-8 text-center text-stone-400">
        <MessageSquare className="mx-auto mb-2 h-8 w-8 text-stone-300" />
        <p className="text-sm">Belum ada ucapan. Jadilah yang pertama memberikan doa!</p>
      </div>
    );
  }

  return (
    <div className="max-h-[380px] overflow-y-auto space-y-3.5 pr-1.5 custom-scrollbar text-left">
      {wishes.map((w) => (
        <div
          key={w.id}
          className="rounded-2xl border border-stone-200/80 bg-white/80 p-4 shadow-sm backdrop-blur-sm transition-all hover:border-emerald-200 hover:shadow"
        >
          <div className="flex items-center justify-between border-b border-stone-100 pb-2">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs">
                {w.guestName.charAt(0).toUpperCase()}
              </div>
              <span className="font-semibold text-xs text-stone-800">{w.guestName}</span>
            </div>
            <span className="text-[10px] text-stone-400 font-mono">
              {formatDate(w.createdAt)}
            </span>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-stone-600 whitespace-pre-line">{w.message}</p>
        </div>
      ))}
    </div>
  );
}

export default function RusticTemplate(props: TemplateProps) {
  // Mode embed (thumbnail live iframe): gerbang terbuka, musik dimatikan
  const isEmbed = !!props.embedded;
  const [gateOpen, setGateOpen] = useState(isEmbed);
  const music = useBackgroundMusic(isEmbed ? undefined : props.data.musicUrl);
  return (
    <RusticShell
      {...props}
      data={isEmbed ? { ...props.data, musicUrl: undefined } : props.data}
      gateOpen={gateOpen}
      onGateOpen={() => {
        setGateOpen(true);
        music.play();
      }}
      music={music}
    />
  );
}

function RusticShell({
  invitationId = "inv-123",
  guestName = "Bapak / Ibu / Saudara",
  data = defaultInvitationData,
  isPublished = true,
  wishes: initialWishes,
  decorations,
  gateOpen = true,
  onGateOpen,
  music,
}: TemplateProps & { gateOpen?: boolean; onGateOpen?: () => void; music?: MusicController }) {
  // Prioritas background: pilihan user > admin (template) > bawaan template
  const bgUrl = data?.backgroundUrl || getBackgroundUrl(decorations);
  // Prioritas foto gerbang: user > admin (dekorasi) > mempelai > galeri[0]
  const gatePhoto = resolveGatePhoto({
    gatePhotoUrl: data?.gatePhotoUrl,
    adminGatePhotoUrl: getGatePhotoUrl(decorations),
    groomPhotoUrl: data?.groom?.photoUrl,
    bridePhotoUrl: data?.bride?.photoUrl,
    firstGalleryUrl: data?.gallery?.[0]?.url,
  });
  const [wishesList, setWishesList] = useState<WishItem[]>(
    initialWishes && initialWishes.length > 0 ? initialWishes : defaultWishes
  );

  const groom = data?.groom ?? defaultInvitationData.groom;
  const bride = data?.bride ?? defaultInvitationData.bride;
  // Info akad sudah tampil di section "Hari Bahagia" — entri "Akad" pada
  // Rangkaian Acara disembunyikan agar tidak dobel (lihat splitAgenda).
  const events = splitAgenda(data?.events ?? defaultInvitationData.events ?? [], {}).additional;
  const gifts = data?.gifts ?? defaultInvitationData.gifts ?? [];

  const handleAddWish = (newWish: WishItem) => {
    setWishesList((prev) => [newWish, ...prev]);
  };

  if (!isPublished) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#f8f5f0] px-6 text-center">
        <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100/80 text-emerald-800 shadow-inner">
          <Sprout className="h-10 w-10" />
        </div>
        <p className="font-serif text-2xl font-medium tracking-tight text-stone-800">
          Undangan Belum Dipublikasikan
        </p>
        <p className="max-w-md text-sm text-stone-500 leading-relaxed">
          Pemilik undangan belum mengaktifkan halaman ini. Silakan cek kembali beberapa saat lagi.
        </p>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center bg-[#faf7f2] font-sans text-stone-800 antialiased selection:bg-emerald-800 selection:text-emerald-50">
      {/* Background Subtle Organic Texture */}
      <div className="pointer-events-none fixed inset-0 opacity-[0.03] bg-[radial-gradient(#2d5a43_1px,transparent_1px)] [background-size:16px_16px]" />

      {/* Floating Music Button Toggle */}
      {data?.musicUrl && music && (
        <MusicFab
          isPlaying={music.isPlaying}
          onToggle={music.toggle}
          buttonClassName="bg-emerald-900 text-amber-200 border border-amber-300/40"
          playingIconClassName="h-5 w-5 animate-pulse text-amber-300"
          pausedIconClassName="h-5 w-5 opacity-70"
        />
      )}

      {/* Cover Header Hero Section */}
      <Cover
        eventName={data?.eventName ?? "The Wedding Of"}
        groomNick={groom?.nickname ?? groom?.name}
        brideNick={bride?.nickname ?? bride?.name}
        eventDate={data?.eventDate}
        guestName={guestName}
        locked={!gateOpen}
        onOpen={onGateOpen}
        bgUrl={bgUrl}
        gatePhoto={gatePhoto}
      />

      {/* Main Invitation Container */}
      <div className="relative z-10 w-full max-w-2xl space-y-20 px-4 py-20 sm:px-6">

        {/* BRIDE & GROOM SECTION */}
        {groom?.name || bride?.name ? (
          <section className="relative text-center">
            <Heading eyebrow="Bride & Groom" title="Kedua Mempelai" />
            <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2">
              <Person person={groom} role="Mempelai Pria" />
              <Person person={bride} role="Mempelai Wanita" />
            </div>

            {/* Kutipan — bisa diganti user/admin sesuai kepercayaan,
                atau disembunyikan sepenuhnya. Prioritas: user → admin → bawaan. */}
            {!data?.quoteHidden && (
            <div className="relative mx-auto mt-12 max-w-xl rounded-2xl border border-amber-200/70 bg-white/80 p-6 shadow-sm backdrop-blur-sm transition-all hover:shadow-md">
              {data?.quoteTitle?.trim() ? (
                <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-emerald-800/90">
                  {data.quoteTitle}
                </p>
              ) : null}
              <p className="font-serif text-base italic leading-relaxed text-stone-700">
                &ldquo;{
                  data?.quoteText?.trim() ||
                  "Dan di antara tanda-tanda kekuasaan-Nya ialah Dia menciptakan untukmu pasangan hidup dari jenismu sendiri, supaya kamu merasa tenteram kepadanya, dan dijadikan-Nya di antaramu rasa kasih dan sayang."
                }&rdquo;
              </p>
              <span className="mt-3 block text-xs font-semibold uppercase tracking-widest text-emerald-800/90">
                {data?.quoteSource?.trim() || "(QS. Ar-Rum: 21)"}
              </span>
            </div>
            )}
          </section>
        ) : null}

        {/* DATE & VENUE HIGHLIGHT */}
        <section className="relative text-center">
          <Heading eyebrow="The Moment" title="Hari Bahagia" />
          <div className="mx-auto mt-10 grid max-w-xl grid-cols-1 gap-5 sm:grid-cols-3">
            {data?.eventDate && (
              <RusticCard icon={CalendarDays} label={formatDate(data.eventDate)} title="Tanggal" />
            )}
            {data?.eventTime && (
              <RusticCard icon={Clock} label={formatTime(data.eventTime)} title="Waktu" />
            )}
            {(data?.venueName || data?.location) && (
              <RusticCard
                icon={MapPin}
                label={[data.venueName, data.location].filter(Boolean).join(", ")}
                title="Lokasi"
              />
            )}
          </div>

          {data?.locationMap && (
            <div className="mt-8">
              <a
                href={data.locationMap}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 rounded-full border border-emerald-700/30 bg-emerald-800/5 px-7 py-3 text-sm font-semibold text-emerald-800 shadow-sm transition-all duration-300 hover:bg-emerald-800 hover:text-white hover:shadow-md hover:scale-[1.02] active:scale-[0.98]"
              >
                <MapPin className="h-4 w-4" />
                <span>Buka Google Maps</span>
                <ExternalLink className="h-3.5 w-3.5 opacity-70" />
              </a>
            </div>
          )}
        </section>

        {/* RSVP FORM SECTION */}
        <section className="relative text-center">
          <Heading eyebrow="RSVP" title="Konfirmasi Kehadiran" />
          <p className="mx-auto mt-3 max-w-sm text-sm text-stone-500 leading-relaxed">
            Kehadiran Anda adalah kehormatan dan kebahagiaan terbesar bagi kami. Mohon isi konfirmasi di bawah ini.
          </p>
          <div className="relative mx-auto mt-8 max-w-lg overflow-hidden rounded-3xl border border-stone-200/80 bg-white/90 p-7 shadow-xl shadow-stone-200/50 backdrop-blur-md">
            <RsvpForm
              invitationId={invitationId}
              initialName={guestName}
              accentClass={ACCENT}
              borderClass={BORDER}
            />
          </div>
        </section>

        {/* AGENDA EVENTS LIST */}
        {events.length > 0 ? (
          <section className="relative text-center">
            <Heading eyebrow="Agenda" title="Rangkaian Acara" />
            <div className="mx-auto mt-10 max-w-xl space-y-5">
              {events.map((e) => (
                <div
                  key={e.id}
                  className="group relative overflow-hidden rounded-2xl border border-stone-200/80 bg-white p-6 text-left shadow-sm transition-all duration-300 hover:border-emerald-300 hover:shadow-md"
                >
                  <div className="absolute top-0 right-0 h-16 w-16 -translate-y-6 translate-x-6 rounded-full bg-emerald-50 transition-transform group-hover:scale-150" />
                  <div className="relative z-10">
                    <span className="inline-block rounded-full bg-emerald-100/70 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                      {formatDate(e.date)}
                    </span>
                    <h3 className="mt-3 font-[family-name:var(--font-display)] text-2xl font-medium text-stone-900">{e.title ?? "Acara"}</h3>

                    <div className="mt-3 space-y-1.5 text-sm text-stone-600">
                      {e.time && (
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-emerald-700" />
                          <span>{formatTime(e.time)}</span>
                        </div>
                      )}
                      {e.location && (
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 shrink-0 text-emerald-700 mt-0.5" />
                          <span>{e.location}</span>
                        </div>
                      )}
                    </div>

                    {e.locationMap && (
                      <a
                        href={e.locationMap}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-700 hover:text-emerald-900 hover:underline"
                      >
                        Petunjuk Lokasi <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {/* CUSTOM MESSAGE / SPECIAL WISHES */}
        {data?.customMessage ? (
          <section className="relative text-center">
            <Heading eyebrow="Wishes" title="Pesan Spesial" />
            <div className="relative mx-auto mt-8 max-w-lg rounded-2xl border border-amber-200/60 bg-amber-50/40 p-8 shadow-sm">
              <RingIcon className="mx-auto mb-3 h-6 w-6 text-amber-600/70" />
              <p className="whitespace-pre-line font-serif text-base leading-relaxed text-stone-700">
                {data.customMessage}
              </p>
            </div>
          </section>
        ) : null}

        {/* WEDDING GIFTS / ANGPAU DIGITAL */}
        {gifts.length > 0 ? (
          <section id="kado" className="relative text-center">
            <Heading eyebrow="Wedding Gift" title="Kado &amp; Angpau Digital" />
            <p className="mx-auto mt-3 max-w-md text-sm text-stone-500 leading-relaxed">
              Doa dan restu Anda adalah hadiah terindah bagi kami. Namun jika Anda ingin memberi tanda kasih, dapat melalui rekening berikut:
            </p>
            <div className="mx-auto mt-8 grid max-w-xl grid-cols-1 gap-5 sm:grid-cols-2">
              {gifts.map((g) => (
                <GiftCard key={g.id} gift={g} />
              ))}
            </div>
          </section>
        ) : null}

        {/* WEDDING WALL & WISH FORM */}
        <section id="ucapan" className="relative text-center">
          <Heading eyebrow="Wedding Wall" title="Berikan Ucapan &amp; Doa" />
          <div className="mx-auto mt-8 max-w-2xl">
            <WishList wishes={wishesList} />
          </div>
          <div className="mx-auto mt-8 max-w-lg overflow-hidden rounded-3xl border border-stone-200/80 bg-white/90 p-7 shadow-xl shadow-stone-200/50 backdrop-blur-md">
            <WishForm invitationId={invitationId} accentClass={ACCENT} borderClass={BORDER} onAddWish={handleAddWish} />
          </div>
        </section>
      </div>

      {/* FOOTER */}
      <footer className="relative w-full overflow-hidden bg-stone-900 py-16 text-center text-stone-200">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:20px_20px]" />
        <div className="relative z-10 mx-auto max-w-md px-6">
          <Sprout className="mx-auto mb-4 h-6 w-6 text-amber-300/80" />
          <p className="font-[family-name:var(--font-display)] text-3xl font-light tracking-wide text-amber-100">
            {groom?.nickname ?? groom?.name ?? "Pria"}{" "}
            <Heart className="mx-2 inline h-5 w-5 fill-emerald-500 text-emerald-500 animate-pulse" />{" "}
            {bride?.nickname ?? bride?.name ?? "Wanita"}
          </p>
          <p className="mt-3 text-xs tracking-widest uppercase text-stone-400">
            Terima Kasih Atas Doa &amp; Kehadiran Anda
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 border-t border-stone-800 pt-8 text-sm">
            {data?.musicUrl && (
              <a
                href={data.musicUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-stone-700 bg-stone-800/80 px-4 py-2 text-xs font-medium text-amber-200 transition hover:border-amber-300 hover:bg-stone-800"
              >
                <Music className="h-3.5 w-3.5 text-amber-300" /> Putar Musik
              </a>
            )}
            {gifts.length > 0 && (
              <a
                href="#kado"
                className="inline-flex items-center gap-2 rounded-full border border-stone-700 bg-stone-800/80 px-4 py-2 text-xs font-medium text-stone-300 transition hover:border-stone-500 hover:text-white"
              >
                <Gift className="h-3.5 w-3.5 text-emerald-400" /> Kado &amp; Amplop
              </a>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}

function Cover({
  eventName,
  groomNick,
  brideNick,
  eventDate,
  guestName,
  locked = false,
  onOpen,
  bgUrl,
  gatePhoto,
}: {
  eventName: string;
  gatePhoto?: string;
  groomNick?: string;
  brideNick?: string;
  eventDate?: string;
  guestName?: string;
  locked?: boolean;
  onOpen?: () => void;
  bgUrl?: string;
}) {
  const cover = (
    <header
      className="relative mx-auto flex min-h-[95vh] w-full max-w-2xl flex-col items-center justify-between overflow-hidden bg-stone-900 px-6 py-12 text-center text-white shadow-2xl"
      style={{
        backgroundImage: `linear-gradient(to bottom, rgba(15, 23, 18, 0.5), rgba(10, 15, 12, 0.8)), url(${bgUrl || "https://images.unsplash.com/photo-1492724441997-5dc865305da7?w=1200&q=80"})`,
        backgroundPosition: "center",
        backgroundSize: "cover",
      }}
    >
      <div className="pt-6">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white/10 backdrop-blur-md border border-white/20">
          <Sprout className="h-6 w-6 text-amber-200" />
        </div>
        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.35em] text-amber-100/90">
          {eventName}
        </p>
      </div>

      <div className="my-auto py-8">
        <h1 className="font-[family-name:var(--font-display)] text-5xl leading-tight sm:text-6xl tracking-wide text-stone-100 drop-shadow-md">
          <span className="block">{groomNick ?? "Pria"}</span>
          <span className="my-2 block font-[family-name:var(--font-script)] text-4xl font-light italic text-amber-200">&amp;</span>
          <span className="block">{brideNick ?? "Wanita"}</span>
        </h1>

        {eventDate && (
          <div className="mt-6 inline-block rounded-full border border-amber-200/30 bg-black/20 px-6 py-2 backdrop-blur-md">
            <p className="text-sm tracking-widest text-amber-100 font-light">
              {formatDate(eventDate)}
            </p>
          </div>
        )}
      </div>

      <div className="w-full">
        {guestName && (
          <div className="mx-auto max-w-sm rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-md shadow-lg">
            <p className="text-xs uppercase tracking-widest text-amber-100/80">Kepada Yth.</p>
            <p className="mt-1 font-serif text-lg font-medium text-white">{guestName}</p>
          </div>
        )}
        <ChevronDown className="mx-auto mt-6 h-5 w-5 animate-bounce text-amber-100/60" />
      </div>
    </header>
  );

  // Saat gerbang tertutup: konten dikunci + overlay "Buka Undangan" fullscreen
  if (locked) {
    return (
      <InvitationGate
        theme="rustic"
        eventName={eventName}
        groomNick={groomNick}
        brideNick={brideNick}
        eventDate={eventDate}
        guestName={guestName}
        onOpen={onOpen}
        backgroundUrl={bgUrl}
        photoUrl={gatePhoto}
      />
    );
  }

  return cover;
}

function Heading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="relative inline-block">
      <p className="text-xs font-bold uppercase tracking-[0.35em] text-emerald-800/90">{eyebrow}</p>
      <h2 className="mt-1.5 font-[family-name:var(--font-display)] text-3xl font-normal text-stone-900 sm:text-4xl">{title}</h2>
      <LeafDivider />
    </div>
  );
}

function RusticCard({
  icon: Icon,
  label,
  title,
}: {
  icon: React.ElementType;
  label: string;
  title?: string;
}) {
  return (
    <div className="group flex flex-col items-center justify-center rounded-2xl border border-stone-200/80 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-300 hover:shadow-md">
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800 transition-colors group-hover:bg-emerald-800 group-hover:text-amber-50">
        <Icon className="h-5 w-5" />
      </div>
      {title && <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-0.5">{title}</span>}
      <span className="text-center font-medium text-sm text-stone-800 leading-snug">{label}</span>
    </div>
  );
}

function Person({
  person,
  role,
}: {
  person?: PersonData;
  role: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-3xl border border-stone-200/80 bg-white p-7 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-300 hover:shadow-md">
      <FloralCornerDecoration />

      {person?.photoUrl ? (
        <div className="relative mx-auto mb-5 h-36 w-36 overflow-hidden rounded-full ring-4 ring-emerald-800/10 transition-transform duration-300 group-hover:scale-105">
          <img
            src={person.photoUrl}
            alt={person.name ?? role}
            className="h-full w-full object-cover"
          />
        </div>
      ) : (
        <div className="mx-auto mb-5 flex h-36 w-36 items-center justify-center rounded-full bg-emerald-50 text-emerald-800 ring-4 ring-emerald-800/10">
          <Heart className="h-12 w-12 text-emerald-700/60" />
        </div>
      )}

      <span className="inline-block rounded-full bg-emerald-100/60 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-emerald-800">
        {role}
      </span>

      <h3 className="mt-3 font-[family-name:var(--font-display)] text-2xl font-medium text-stone-900">
        {person?.name ?? "-"}
      </h3>

      {person?.parentName && (
        <p className="mt-2 text-xs text-stone-500 leading-relaxed">
          Putra/Putri dari <br />
          <span className="font-medium text-stone-700">{person.parentName}</span>
        </p>
      )}

      {person?.bio && (
        <p className="mt-3 text-xs italic text-stone-600 border-t border-stone-100 pt-3">
          &ldquo;{person.bio}&rdquo;
        </p>
      )}
    </div>
  );
}

function GiftCard({ gift }: { gift: GiftItem }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(gift.accountNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-stone-200/80 bg-white p-6 text-left shadow-sm transition-all hover:border-emerald-300 hover:shadow-md">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-widest text-emerald-800">
          {gift.provider}
        </p>
        <span className="text-[10px] bg-stone-100 text-stone-500 px-2 py-0.5 rounded font-mono">
          {gift.name ?? "Bank / e-Wallet"}
        </span>
      </div>

      <p className="mt-3 font-mono text-lg font-bold tracking-wider text-stone-900">
        {gift.accountNumber}
      </p>

      <p className="text-xs text-stone-500">
        a.n. <span className="font-semibold text-stone-700">{gift.holderName}</span>
      </p>

      <button
        onClick={handleCopy}
        type="button"
        className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl border border-stone-200 bg-stone-50 py-2 text-xs font-semibold text-stone-700 transition-all hover:bg-emerald-800 hover:text-white hover:border-emerald-800 active:scale-[0.98]"
      >
        {copied ? (
          <>
            <Check className="h-3.5 w-3.5 text-emerald-400" /> Tersalin!
          </>
        ) : (
          <>
            <Copy className="h-3.5 w-3.5" /> Salin Nomor Rekening
          </>
        )}
      </button>
    </div>
  );
}

const defaultInvitationData: InvitationData = {
  eventName: "The Wedding Of",
  eventDate: "2026-10-24",
  eventTime: "09:00",
  venueName: "Plataran Hutan Kota",
  location: "Jakarta Pusat",
  locationMap: "https://maps.google.com",
  musicUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
  customMessage: "Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir untuk memberikan doa restu kepada kedua mempelai.",
  groom: {
    name: "Raden Arya Permana, S.T.",
    nickname: "Arya",
    parentName: "Bpk. Bambang Permana & Ibu Sri Rahayu",
    photoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
    bio: "Pencinta kopi dan penjelajah alam.",
  },
  bride: {
    name: "Anindya Putri Lestari, S.Ked.",
    nickname: "Anin",
    parentName: "Bpk. Hendra Lestari & Ibu Dewi Kartika",
    photoUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80",
    bio: "Penyayang bunga dan penikmat senja.",
  },
  events: [
    {
      id: "ev-1",
      title: "Akad Nikah",
      date: "2026-10-24",
      time: "08:00 - 10:00",
      location: "Grand Ballroom Plataran, Jakarta",
      locationMap: "https://maps.google.com",
    },
    {
      id: "ev-2",
      title: "Resepsi Pernikahan",
      date: "2026-10-24",
      time: "11:00 - 14:00",
      location: "Glass House Garden Plataran, Jakarta",
      locationMap: "https://maps.google.com",
    },
  ],
  gifts: [
    {
      id: "gift-1",
      provider: "BCA",
      name: "Bank BCA",
      accountNumber: "8830192834",
      holderName: "Raden Arya Permana",
    },
    {
      id: "gift-2",
      provider: "Mandiri",
      name: "Bank Mandiri",
      accountNumber: "1370019283741",
      holderName: "Anindya Putri Lestari",
    },
  ],
};

const defaultWishes: WishItem[] = [
  {
    id: "w-1",
    guestName: "Budi & Keluarga",
    message: "Selamat untuk Arya dan Anin! Semoga menjadi keluarga yang sakinah, mawaddah, warahmah.",
    createdAt: "2026-09-01T10:00:00Z",
  },
  {
    id: "w-2",
    guestName: "Siti Rahmawati",
    message: "Selamat menempuh hidup baru ya Anin & Arya! Bahagia selalu sampai kakek nenek.",
    createdAt: "2026-09-02T14:30:00Z",
  },
];