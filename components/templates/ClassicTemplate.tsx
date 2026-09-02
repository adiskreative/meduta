import { Mail, MapPin, Clock, Heart, Music } from "lucide-react";
import WishForm from "./WishForm";
import WishList from "./WishList";
import RsvpForm from "./RsvpForm";
import {
  formatDate,
  formatTime,
  type TemplateProps,
} from "./types";

const ACCENT = "bg-rose-600 hover:bg-rose-700";
const BORDER = "border-zinc-300 focus:border-rose-400 focus:ring-rose-100";

export default function ClassicTemplate({
  invitationId,
  guestName,
  data,
  isPublished,
  wishes,
}: TemplateProps) {
  if (!isPublished) {
    return <DraftNotice />;
  }

  const groom = data.groom;
  const bride = data.bride;
  const events = data.events ?? [];

  return (
    <div className="flex min-h-screen flex-col items-center bg-[#faf7f2] text-zinc-900">
      <Cover
        eventName={data.eventName ?? "Undangan Pernikahan"}
        groomNick={groom?.nickname ?? groom?.name}
        brideNick={bride?.nickname ?? bride?.name}
        eventDate={data.eventDate}
        guestName={guestName}
      />

      <MainEvent
        eventDate={data.eventDate}
        eventTime={data.eventTime}
        venueName={data.venueName}
        location={data.location}
        locationMap={data.locationMap}
      />

      <RsvpSection
        invitationId={invitationId}
        guestName={guestName}
        accentClass={ACCENT}
        borderClass={BORDER}
      />

      {groom?.name || bride?.name ? (
        <Couple
          groom={groom}
          bride={bride}
          eventName={data.eventName ?? "Pernikahan"}
        />
      ) : null}

      {events.length > 0 ? <AdditionalEvents events={events} /> : null}

      {data.customMessage ? (
        <MessageSection text={data.customMessage} />
      ) : null}

      {data.musicUrl ? (
        <MusicSection url={data.musicUrl} />
      ) : null}

      <Wishes
        invitationId={invitationId}
        accentClass={ACCENT}
        borderClass={BORDER}
        wishes={wishes}
      />

      <Footer
        groomName={groom?.name}
        brideName={bride?.name}
      />
    </div>
  );
}

function DraftNotice() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-zinc-50 px-6 text-center">
      <p className="text-lg font-medium text-zinc-800">Undangan belum dipublikasikan</p>
      <p className="text-sm text-zinc-500">
        Pemilik undangan belum mengaktifkan halaman ini. Silakan cek kembali nanti.
      </p>
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
      className="relative flex min-h-[92vh] w-full max-w-3xl flex-col items-center justify-center bg-cover bg-center px-6 text-center text-white"
      style={{
        backgroundImage:
          "linear-gradient(to bottom, rgba(0,0,0,0.35), rgba(0,0,0,0.55)), url(https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&q=70)",
      }}
    >
      <p className="mb-3 text-sm uppercase tracking-[0.3em] text-rose-100">The Wedding Of</p>
      <h1 className="font-serif text-4xl font-semibold leading-tight sm:text-5xl">
        {groomNick ?? "Pria"} <span className="mx-2 inline-block text-2xl align-middle">&amp;</span>{" "}
        {brideNick ?? "Wanita"}
      </h1>
      {eventDate && (
        <p className="mt-5 text-rose-100">{formatDate(eventDate)}</p>
      )}
      {guestName && (
        <p className="mt-8 text-sm text-zinc-100">
          Kepada Yth. <span className="font-semibold text-white">{guestName}</span>
        </p>
      )}
      <p className="mt-1 text-sm text-zinc-300">{eventName}</p>
      <div className="mt-8 flex h-10 w-10 items-center justify-center rounded-full border border-white/40 animate-bounce">
        <Heart className="h-4 w-4" />
      </div>
    </header>
  );
}

function MainEvent({
  eventDate,
  eventTime,
  venueName,
  location,
  locationMap,
}: {
  eventDate?: string;
  eventTime?: string;
  venueName?: string;
  location?: string;
  locationMap?: string;
}) {
  return (
    <section className="w-full max-w-3xl px-6 py-16 text-center">
      <p className="mb-2 text-xs uppercase tracking-[0.25em] text-rose-500">Akad &amp; Resepsi</p>
      <h2 className="font-serif text-3xl text-zinc-900">Merupakan Suatu Kehormatan</h2>
      <p className="mx-auto mt-3 max-w-md text-sm text-zinc-500">
        Bagi kami, kehadiran dan doa restu Anda adalah kebahagiaan yang tak ternilai.
      </p>

      <div className="mx-auto mt-10 grid max-w-xl grid-cols-1 gap-6 sm:grid-cols-3">
        {eventDate && (
          <InfoCard
            icon={<Mail className="h-5 w-5" />}
            label={formatDate(eventDate)}
          />
        )}
        {eventTime && (
          <InfoCard
            icon={<Clock className="h-5 w-5" />}
            label={formatTime(eventTime)}
          />
        )}
        {(venueName || location) && (
          <InfoCard
            icon={<MapPin className="h-5 w-5" />}
            label={[venueName, location].filter(Boolean).join(", ")}
          />
        )}
      </div>

      {locationMap && (
        <a
          href={locationMap}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-8 inline-flex items-center gap-2 rounded-full border border-rose-300 px-6 py-2.5 text-sm font-medium text-rose-600 transition hover:bg-rose-50"
        >
          Lihat Lokasi di Peta
        </a>
      )}
    </section>
  );
}

function InfoCard({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-zinc-200 bg-white p-5">
      <span className="text-rose-500">{icon}</span>
      <span className="text-sm text-zinc-700">{label}</span>
    </div>
  );
}

function Couple({
  groom,
  bride,
  eventName,
}: {
  groom?: TemplateProps["data"]["groom"];
  bride?: TemplateProps["data"]["bride"];
  eventName: string;
}) {
  return (
    <section className="w-full max-w-3xl px-6 py-16 text-center">
      <p className="text-xs uppercase tracking-[0.25em] text-rose-500">
        {eventName}
      </p>
      <h2 className="mt-2 font-serif text-3xl text-zinc-900">Mempelai</h2>

      <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2">
        <PersonCard person={groom} role="Pria" />
        <PersonCard person={bride} role="Wanita" />
      </div>

      <p className="mt-10 text-sm italic text-zinc-500">
        “Dan di antara tanda-tanda kekuasaan-Nya ialah Dia menciptakan untukmu
        pasangan hidup dari jenismu sendiri...” (QS Ar-Rum: 21)
      </p>
    </section>
  );
}

function PersonCard({
  person,
  role,
}: {
  person?: TemplateProps["data"]["groom"];
  role: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6">
      {person?.photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={person.photoUrl}
          alt={person.name ?? role}
          className="mx-auto mb-4 h-36 w-36 rounded-full object-cover"
        />
      ) : (
        <div className="mx-auto mb-4 flex h-36 w-36 items-center justify-center rounded-full bg-rose-50 text-rose-300">
          <Heart className="h-12 w-12" />
        </div>
      )}
      <p className="text-xs uppercase tracking-widest text-rose-400">{role}</p>
      <h3 className="mt-1 font-serif text-2xl text-zinc-900">
        {person?.name ?? "-"}
      </h3>
      {person?.parentName && (
        <p className="mt-1 text-sm text-zinc-500">
          Putra/Bintari dari {person.parentName}
        </p>
      )}
      {person?.bio && (
        <p className="mt-3 text-sm text-zinc-600">{person.bio}</p>
      )}
    </div>
  );
}

function AdditionalEvents({
  events,
}: {
  events: NonNullable<TemplateProps["data"]["events"]>;
}) {
  return (
    <section className="w-full max-w-3xl px-6 py-16 text-center">
      <h2 className="font-serif text-3xl text-zinc-900">Agenda Acara</h2>
      <div className="mx-auto mt-8 max-w-xl space-y-4">
        {events.map((e) => (
          <div
            key={e.id}
            className="rounded-2xl border border-zinc-200 bg-white p-5 text-left"
          >
            <p className="text-xs uppercase tracking-widest text-rose-500">
              {formatDate(e.date)}
            </p>
            <h3 className="mt-1 font-semibold text-zinc-900">{e.title ?? "Acara"}</h3>
            {e.time && (
              <p className="mt-1 flex items-center gap-1.5 text-sm text-zinc-600">
                <Clock className="h-4 w-4" /> {formatTime(e.time)}
              </p>
            )}
            {e.location && (
              <p className="mt-1 flex items-center gap-1.5 text-sm text-zinc-600">
                <MapPin className="h-4 w-4" /> {e.location}
              </p>
            )}
            {e.locationMap && (
              <a
                href={e.locationMap}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-block text-sm font-medium text-rose-600 hover:underline"
              >
                Lihat Lokasi
              </a>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function MessageSection({ text }: { text: string }) {
  return (
    <section className="w-full max-w-3xl px-6 py-16 text-center">
      <div className="mx-auto max-w-lg rounded-3xl border border-zinc-200 bg-white p-8">
        <Music className="mx-auto mb-4 h-6 w-6 text-rose-500" />
        <p className="whitespace-pre-line font-serif text-lg leading-relaxed text-zinc-700">
          {text}
        </p>
      </div>
    </section>
  );
}

function MusicSection({ url }: { url: string }) {
  return (
    <section className="w-full max-w-3xl px-6 py-8 text-center">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-full border border-zinc-300 px-6 py-2.5 text-sm text-zinc-700 transition hover:bg-zinc-100"
      >
        <Music className="h-4 w-4" /> Putar Musik
      </a>
    </section>
  );
}

function RsvpSection({
  invitationId,
  guestName,
  accentClass,
  borderClass,
}: {
  invitationId: string;
  guestName?: string;
  accentClass: string;
  borderClass: string;
}) {
  return (
    <section id="rsvp" className="w-full max-w-3xl bg-[#f4ede6] px-6 py-16 text-center">
      <p className="text-xs uppercase tracking-[0.25em] text-rose-500">Kehadiran</p>
      <h2 className="mt-2 font-serif text-3xl text-zinc-900">Konfirmasi Kehadiran</h2>
      <p className="mx-auto mt-3 max-w-sm text-sm text-zinc-500">
        Mohon konfirmasi kehadiran Anda agar kami dapat menyiapkan segala sesuatunya.
      </p>
      <div className="mx-auto mt-8 max-w-md rounded-2xl border border-zinc-200 bg-white p-6 text-left">
        <RsvpForm
          invitationId={invitationId}
          initialName={guestName}
          accentClass={accentClass}
          borderClass={borderClass}
        />
      </div>
    </section>
  );
}

function Wishes({
  invitationId,
  accentClass,
  borderClass,
  wishes,
}: {
  invitationId: string;
  accentClass: string;
  borderClass: string;
  wishes?: TemplateProps["wishes"];
}) {
  return (
    <section id="ucapan" className="w-full max-w-3xl bg-white px-6 py-16 text-center">
      <h2 className="font-serif text-3xl text-zinc-900">Kirim Ucapan &amp; Doa</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm text-zinc-500">
        Sampaikan doa dan ucapan terbaik untuk kedua mempelai.
      </p>

      <div className="mx-auto mt-8 max-w-2xl">
        <WishList wishes={wishes ?? []} />
      </div>

      <div className="mx-auto mt-8 max-w-md rounded-2xl border border-zinc-200 p-6 text-left">
        <WishForm invitationId={invitationId} accentClass={accentClass} borderClass={borderClass} />
      </div>
    </section>
  );
}

function Footer({
  groomName,
  brideName,
}: {
  groomName?: string;
  brideName?: string;
}) {
  return (
    <footer className="w-full max-w-3xl px-6 py-12 text-center">
      <p className="font-serif text-2xl text-zinc-800">
        {groomName ?? "Pria"} <span className="text-rose-500">&amp;</span> {brideName ?? "Wanita"}
      </p>
      <p className="mt-2 text-sm text-zinc-400">Terima kasih atas doa &amp; kehadiran Anda</p>
      <p className="mt-6 text-xs text-zinc-400">© {new Date().getFullYear()} Meduta</p>
    </footer>
  );
}
