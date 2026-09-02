import { MapPin, Clock, CalendarDays } from "lucide-react";
import WishForm from "./WishForm";
import WishList from "./WishList";
import RsvpForm from "./RsvpForm";
import { formatDate, formatTime, type TemplateProps } from "./types";

const ACCENT = "bg-zinc-900 hover:bg-zinc-800";
const BORDER = "border-zinc-300 focus:border-zinc-900 focus:ring-zinc-100";

export default function MinimalTemplate({
  invitationId,
  guestName,
  data,
  isPublished,
  wishes,
}: TemplateProps) {
  if (!isPublished) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-zinc-50 px-6 text-center">
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
    <div className="flex min-h-screen flex-col items-center bg-zinc-50 text-zinc-900">
      <Cover
        eventName={data.eventName ?? "The Wedding"}
        groomName={groom?.name}
        brideName={bride?.name}
        eventDate={data.eventDate}
        guestName={guestName}
      />

      <div className="w-full max-w-3xl space-y-8 px-6 py-16">
        {groom?.name || bride?.name ? (
          <Section title={`${groom?.name ?? "-"} & ${bride?.name ?? "-"}`}>
            <div className="grid grid-cols-2 gap-4">
              <Photo person={groom?.photoUrl} name={groom?.name} />
              <Photo person={bride?.photoUrl} name={bride?.name} />
            </div>
          </Section>
        ) : null}

        <Section title="Tanggal &amp; Lokasi">
          <div className="space-y-3 border-t border-zinc-200 pt-4">
            {data.eventDate && (
              <Row icon={CalendarDays} text={formatDate(data.eventDate)} />
            )}
            {data.eventTime && <Row icon={Clock} text={formatTime(data.eventTime)} />}
            {data.venueName && <Row icon={MapPin} text={data.venueName} />}
            {data.location && <Row icon={MapPin} text={data.location} />}
          </div>
          {data.locationMap && (
            <a
              href={data.locationMap}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-zinc-900 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800"
            >
              <MapPin className="h-4 w-4" /> Buka Peta
            </a>
          )}
        </Section>

        <Section title="Konfirmasi Kehadiran">
          <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-5">
            <RsvpForm
              invitationId={invitationId}
              initialName={guestName}
              accentClass={ACCENT}
              borderClass={BORDER}
            />
          </div>
        </Section>

        {events.length > 0 ? (
          <Section title="Agenda">
            <div className="space-y-3 border-t border-zinc-200 pt-4">
              {events.map((e) => (
                <div key={e.id} className="rounded-xl border border-zinc-200 bg-white p-4">
                  <p className="text-xs uppercase tracking-widest text-zinc-400">
                    {formatDate(e.date)}
                  </p>
                  <h3 className="mt-1 font-semibold">{e.title ?? "Acara"}</h3>
                  {e.time && <p className="text-sm text-zinc-500">{formatTime(e.time)}</p>}
                  {e.location && <p className="text-sm text-zinc-500">{e.location}</p>}
                  {e.locationMap && (
                    <a href={e.locationMap} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-sm font-medium text-zinc-900 underline">
                      Lokasi
                    </a>
                  )}
                </div>
              ))}
            </div>
          </Section>
        ) : null}

        {data.customMessage ? (
          <Section title={data.eventName ?? "Pesan"}>
            <p className="whitespace-pre-line border-t border-zinc-200 pt-4 text-zinc-600">
              {data.customMessage}
            </p>
          </Section>
        ) : null}

        <Section id="ucapan" title="Ucapan &amp; Doa">
          <div className="mt-4 space-y-6">
            <WishList wishes={wishes ?? []} />
            <div className="rounded-2xl border border-zinc-200 bg-white p-6">
              <WishForm invitationId={invitationId} accentClass={ACCENT} borderClass={BORDER} />
            </div>
          </div>
        </Section>
      </div>

      <footer className="w-full border-t border-zinc-200 px-6 py-10 text-center text-sm text-zinc-400">
        © {new Date().getFullYear()} Meduta
      </footer>
    </div>
  );
}

function Cover({
  eventName,
  groomName,
  brideName,
  eventDate,
  guestName,
}: {
  eventName: string;
  groomName?: string;
  brideName?: string;
  eventDate?: string;
  guestName?: string;
}) {
  return (
    <header className="relative flex min-h-[88vh] w-full max-w-3xl flex-col items-center justify-end bg-zinc-900 pb-16 text-center text-white">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="https://images.unsplash.com/photo-1520854221256-17451cc331bf?w=1200&q=70"
        alt=""
        className="absolute inset-0 h-full w-full object-cover opacity-30"
      />
      <div className="relative px-6">
        <p className="mb-4 text-xs uppercase tracking-[0.3em] text-zinc-300">Save The Date</p>
        <h1 className="text-4xl font-light tracking-tight sm:text-5xl">
          {groomName} <span className="text-zinc-400">&</span> {brideName}
        </h1>
        {eventDate && <p className="mt-4 text-zinc-300">{formatDate(eventDate)}</p>}
        <p className="mt-8 text-sm text-zinc-400">{eventName}</p>
        {guestName && (
          <p className="mt-2 text-sm text-zinc-200">
            Untuk <span className="font-medium">{guestName}</span>
          </p>
        )}
      </div>
    </header>
  );
}

function Photo({ person, name }: { person?: string; name?: string }) {
  return person ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={person} alt={name ?? ""} className="aspect-[4/5] w-full rounded-xl object-cover" />
  ) : (
    <div className="flex aspect-[4/5] items-center justify-center rounded-xl bg-zinc-200 text-sm text-zinc-400">
      {name ?? "-"}
    </div>
  );
}

function Section({
  title,
  children,
  id,
}: {
  title: string;
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <section id={id} className="rounded-2xl border border-zinc-200 bg-white p-6">
      <h2 className="text-xl font-light tracking-tight">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Row({
  icon: Icon,
  text,
}: {
  icon: React.ElementType;
  text: string;
}) {
  return (
    <p className="flex items-center gap-2 text-zinc-700">
      <Icon className="h-4 w-4 text-zinc-400" /> {text}
    </p>
  );
}
