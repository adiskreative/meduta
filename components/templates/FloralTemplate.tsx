import { MapPin, Clock, CalendarDays, Heart, Music } from "lucide-react";
import WishForm from "./WishForm";
import WishList from "./WishList";
import RsvpForm from "./RsvpForm";
import { formatDate, formatTime, type TemplateProps } from "./types";

const ACCENT = "bg-rose-500 hover:bg-rose-600";
const BORDER = "border-rose-200 focus:border-rose-400 focus:ring-rose-100";

export default function FloralTemplate({
  invitationId,
  guestName,
  data,
  isPublished,
  wishes,
}: TemplateProps) {
  if (!isPublished) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#fdf8f4] px-6 text-center">
        <p className="text-lg font-medium text-zinc-800">Undangan belum dipublikasikan</p>
        <p className="text-sm text-zinc-500">
          Pemilik undangan belum mengaktifkan halaman ini. Silakan cek kembali nanti.
        </p>
      </div>
    );
  }

  const groom = data.groom;
  const bride = data.bride;
  const events = data.events ?? [];

  return (
    <div className="flex min-h-screen flex-col items-center bg-[#fdf8f4] text-zinc-900">
      <Cover
        eventName={data.eventName ?? "The Wedding Of"}
        groomNick={groom?.nickname ?? groom?.name}
        brideNick={bride?.nickname ?? bride?.name}
        eventDate={data.eventDate}
        guestName={guestName}
      />

      <div className="w-full max-w-3xl space-y-14 px-6 py-16">

        {groom?.name || bride?.name ? (
          <section className="text-center">
            <Heading eyebrow="Bride & Groom" title="Kedua Mempelai" />
            <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2">
              <Person person={groom} role="Mempelai Pria" />
              <Person person={bride} role="Mempelai Wanita" />
            </div>
            <p className="mx-auto mt-10 max-w-md text-sm italic text-zinc-500">
              “Dan Kami ciptakan kamu berpasang-pasangan.” (QS An-Naba’: 8)
            </p>
          </section>
        ) : null}

        <section className="text-center">
          <Heading eyebrow="The Moment" title="Hari Bahagia" />
          <div className="mx-auto mt-8 grid max-w-xl grid-cols-1 gap-4 sm:grid-cols-3">
            {data.eventDate && (
              <FloralCard icon={CalendarDays} label={formatDate(data.eventDate)} />
            )}
            {data.eventTime && <FloralCard icon={Clock} label={formatTime(data.eventTime)} />}
            {(data.venueName || data.location) && (
              <FloralCard
                icon={MapPin}
                label={[data.venueName, data.location].filter(Boolean).join(", ")}
              />
            )}
          </div>
          {data.locationMap && (
            <a
              href={data.locationMap}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 inline-flex items-center gap-2 rounded-full border border-rose-300 px-6 py-2.5 text-sm font-medium text-rose-500 transition hover:bg-rose-50"
            >
              <MapPin className="h-4 w-4" /> Lihat Lokasi
            </a>
          )}
        </section>

        <section className="text-center">
          <Heading eyebrow="RSVP" title="Konfirmasi Kehadiran" />
          <p className="mx-auto mt-4 max-w-sm text-sm text-zinc-500">
            Mohon konfirmasi kehadiran Anda untuk kelancaran acara kami.
          </p>
          <div className="mx-auto mt-8 max-w-md rounded-3xl border border-rose-100 bg-white p-6 shadow-sm">
            <RsvpForm
              invitationId={invitationId}
              initialName={guestName}
              accentClass={ACCENT}
              borderClass={BORDER}
            />
          </div>
        </section>

        {events.length > 0 ? (
          <section className="text-center">
            <Heading eyebrow="Agenda" title="Rangkaian Acara" />
            <div className="mx-auto mt-8 max-w-xl space-y-4">
              {events.map((e) => (
                <div key={e.id} className="rounded-2xl border border-rose-100 bg-white p-5 text-left shadow-sm">
                  <p className="text-xs uppercase tracking-widest text-rose-400">
                    {formatDate(e.date)}
                  </p>
                  <h3 className="mt-1 font-medium text-zinc-900">{e.title ?? "Acara"}</h3>
                  {e.time && <p className="text-sm text-zinc-500">{formatTime(e.time)}</p>}
                  {e.location && <p className="text-sm text-zinc-500">{e.location}</p>}
                  {e.locationMap && (
                    <a href={e.locationMap} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-sm font-medium text-rose-500 hover:underline">
                      Lokasi
                    </a>
                  )}
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {data.customMessage ? (
          <section className="text-center">
            <Heading eyebrow="Wishes" title="Ucapan &amp; Doa Untuk Kami" />
            <p className="mx-auto mt-6 max-w-md whitespace-pre-line text-zinc-600">
              {data.customMessage}
            </p>
          </section>
        ) : null}

        <section id="ucapan" className="text-center">
          <Heading eyebrow="Wedding Wall" title="Berikan Ucapan" />
          <div className="mx-auto mt-8 max-w-2xl">
            <WishList wishes={wishes ?? []} />
          </div>
          <div className="mx-auto mt-8 max-w-md rounded-3xl border border-rose-100 bg-white p-6 shadow-sm">
            <WishForm invitationId={invitationId} accentClass={ACCENT} borderClass={BORDER} />
          </div>
        </section>
      </div>

      <footer className="w-full px-6 py-12 text-center">
        <p className="font-serif text-2xl text-zinc-800">
          {groom?.name ?? "Pria"} <Heart className="mx-1 inline h-4 w-4 text-rose-400" />{" "}
          {bride?.name ?? "Wanita"}
        </p>
        <p className="mt-2 text-sm text-zinc-400">Terima kasih atas doa &amp; hadirnya</p>
        {data.musicUrl && (
          <a href={data.musicUrl} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex items-center gap-2 text-sm text-rose-500 hover:underline">
            <Music className="h-4 w-4" /> Putar Musik
          </a>
        )}
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
}: {
  eventName: string;
  groomNick?: string;
  brideNick?: string;
  eventDate?: string;
  guestName?: string;
}) {
  return (
    <header
      className="relative flex min-h-[90vh] w-full max-w-3xl flex-col items-center justify-center overflow-hidden bg-center bg-cover px-6 text-center text-white"
      style={{
        backgroundImage:
          "linear-gradient(to bottom, rgba(120,40,60,0.4), rgba(80,20,40,0.6)), url(https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=1200&q=70)",
      }}
    >
      <div className="absolute inset-0 rounded-[50%] border border-white/20" />
      <div className="relative">
        <p className="mb-3 text-sm uppercase tracking-[0.3em] text-rose-100">{eventName}</p>
        <h1 className="font-serif text-4xl leading-tight sm:text-5xl">
          {groomNick ?? "Pria"} <span className="mx-2 inline text-2xl">&amp;</span> {brideNick ?? "Wanita"}
        </h1>
        {eventDate && <p className="mt-5 text-rose-100">{formatDate(eventDate)}</p>}
        {guestName && (
          <p className="mt-8 text-sm text-rose-50">
            Kepada Yth. <span className="font-semibold">{guestName}</span>
          </p>
        )}
      </div>
    </header>
  );
}

function Heading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.3em] text-rose-400">{eyebrow}</p>
      <h2 className="mt-2 font-serif text-3xl text-zinc-900">{title}</h2>
    </div>
  );
}

function FloralCard({
  icon: Icon,
  label,
}: {
  icon: React.ElementType;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-rose-100 bg-white p-5 shadow-sm">
      <Icon className="h-5 w-5 text-rose-400" />
      <span className="text-sm text-zinc-700">{label}</span>
    </div>
  );
}

function Person({
  person,
  role,
}: {
  person?: TemplateProps["data"]["groom"];
  role: string;
}) {
  return (
    <div className="rounded-3xl border border-rose-100 bg-white p-6 shadow-sm">
      {person?.photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={person.photoUrl} alt={person.name ?? role} className="mx-auto mb-4 h-32 w-32 rounded-full object-cover" />
      ) : (
        <div className="mx-auto mb-4 flex h-32 w-32 items-center justify-center rounded-full bg-rose-50 text-rose-300">
          <Heart className="h-10 w-10" />
        </div>
      )}
      <p className="text-xs uppercase tracking-widest text-rose-400">{role}</p>
      <h3 className="mt-1 font-serif text-xl text-zinc-900">{person?.name ?? "-"}</h3>
      {person?.parentName && <p className="mt-1 text-sm text-zinc-500">{person.parentName}</p>}
      {person?.bio && <p className="mt-2 text-sm text-zinc-600">{person.bio}</p>}
    </div>
  );
}
