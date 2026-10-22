"use client";

import { useEffect, useRef, useState } from "react";
import {
  CalendarDays,
  Clock,
  MapPin,
  Heart,
  ExternalLink,
  AtSign,
  Gift,
  ChevronDown,
  ArrowUp,
  PartyPopper,
  BookOpen,
  X,
} from "lucide-react";
import WayangGate from "./WayangGate";
import {
  Gunungan,
  ParangStrip,
  WayangPair,
  Divider,
  KAWUNG_URL,
  PARANG_URL,
} from "./WayangDecor";
import { useBackgroundMusic, MusicFab, type MusicController } from "./BackgroundMusic";
import WishForm from "./WishForm";
import WishList from "./WishList";
import RsvpForm from "./RsvpForm";
import CopyButton from "./CopyButton";
import { useCountdown, googleCalendarUrl } from "./SharedWidgets";
import { formatDate, formatTime, splitAgenda, type TemplateProps } from "./types";
import { getBackgroundUrl, resolveGatePhoto } from "@/lib/decoration";

/**
 * Wayang Adat — adopsi dari referensi HTML "The Wedding of Raden Bagas &
 * Ayu Laras" (undangan adat Jawa bergaya wayang & batik), data-driven
 * mengikuti arsitektur Meduta:
 * - Semua konten dari TemplateProps (mempelai, acara, cerita, galeri, kado)
 * - Musik latar user (BackgroundMusic), RSVP & ucapan tersimpan DB
 * - Background berlapis: pilihan user > admin (template) > bawaan wayang
 * Khas template: krem sogan + emas, batik parang & kawung, gunungan,
 * wayang animasi, kutipan Ar-Rum 21, dress code adat, gelap hijau di cover
 * / acara / penutup, tombol WhatsApp ke pasangan.
 * Animasi CSS murni (fade-in, reveal-on-scroll, wayang sway).
 */

const GOLD = "#b98f3e";
const GOLD_L = "#e2c274";
const GREEN = "#1f3a2b";
const GREEN_D = "#14261c";
const CREAM = "#f6efdf";
const IVORY = "#fbf7ec";
const SOGAN = "#6b4226";
const SOGAN_D = "#3e2515";

/* ------------------------------------------------------------------ */
/* CSS khusus template (prefix wy- = wayang/gunung)                    */
/* ------------------------------------------------------------------ */
const WY_STYLES = `
  .wy-section {
    position: relative; padding: 76px 20px; text-align: center;
    background: ${KAWUNG_URL}, ${CREAM};
    color: ${SOGAN_D};
  }
  .wy-section.alt { background: ${KAWUNG_URL}, ${IVORY}; }
  .wy-section.dark { color: ${CREAM}; background: ${KAWUNG_URL}, ${GREEN}; }
  .wy-wrap { max-width: 860px; margin: auto; position: relative; z-index: 1; }
  .wy-h2 {
    font-family: var(--font-serif-elegant), Georgia, serif;
    font-weight: 600; letter-spacing: .06em;
    font-size: clamp(30px, 7vw, 44px); line-height: 1.15;
    color: ${SOGAN};
  }
  .wy-section.dark .wy-h2 { color: ${GOLD_L}; }
  .wy-script {
    font-family: var(--font-script), cursive;
    font-size: clamp(32px, 8vw, 48px); line-height: 1.2; color: ${GOLD};
  }
  .wy-lead { max-width: 560px; margin: 14px auto 0; font-weight: 300; line-height: 1.7; }
  .wy-divider i { flex: 1; height: 1px; background: linear-gradient(90deg, transparent, ${GOLD}, transparent); }
  .wy-divider { display: flex; align-items: center; justify-content: center; gap: 12px; margin: 20px auto 30px; max-width: 320px; }

  .wy-frame {
    border: 1px solid ${GOLD}; padding: 10px; position: relative;
    background: ${IVORY};
    box-shadow: 0 0 0 5px ${IVORY}, 0 0 0 6px ${GOLD};
  }
  .wy-frame::before, .wy-frame::after {
    content: ""; position: absolute; width: 26px; height: 26px;
    border: 2px solid ${GOLD};
  }
  .wy-frame::before { top: -7px; left: -7px; border-right: 0; border-bottom: 0; }
  .wy-frame::after { bottom: -7px; right: -7px; border-left: 0; border-top: 0; }

  @keyframes wyFadeIn {
    from { opacity: 0; transform: translateY(26px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .wy-reveal {
    opacity: 0;
    transform: translateY(26px);
    transition: opacity 1s ease, transform 1s ease;
  }
  .wy-reveal.wy-in { opacity: 1; transform: translate(0,0); }
  @keyframes wyFloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-9px); } }
  .float-slow { animation: wyFloat 9s ease-in-out infinite; }

  /* Wayang pair (section gelap) */
  .wy-side {
    position: absolute; bottom: 0; z-index: 0; pointer-events: none;
    width: clamp(78px, 20vw, 170px); color: ${GOLD_L}; opacity: .42;
    filter: drop-shadow(0 0 10px rgba(226,194,116,.5));
  }
  .wy-side-l { left: 1%; }
  .wy-side-r { right: 1%; }
  .wy-flip .wy-fig { transform: scaleX(-1); }
  .wy-side .wy-fig, .wy-side svg { display: block; width: 100%; height: auto; }

  /* Countdown: kartu hijau pekat di section gelap */
  .wy-cd { display: flex; justify-content: center; gap: 12px; margin: 26px 0; flex-wrap: wrap; }
  .wy-cd > div { min-width: 76px; padding: 14px 6px; border: 1px solid ${GOLD}; background: rgba(255,255,255,.05); }
  .wy-cd b { display: block; font-family: var(--font-serif-elegant), Georgia, serif; font-weight: 600; font-size: 34px; line-height: 1; color: ${GOLD_L}; font-variant-numeric: tabular-nums; }
  .wy-cd small { font-size: 13px; letter-spacing: .08em; }

  /* Card acara: frame krem di atas section gelap */
  .wy-cards { display: grid; gap: 34px; margin: 8px auto 0; }
  @media (min-width: 720px) { .wy-cards { grid-template-columns: 1fr 1fr; } }
  .wy-card { padding: 34px 22px; color: ${SOGAN_D}; text-align: center; }
  .wy-card h3 { font-family: var(--font-serif-elegant), Georgia, serif; font-weight: 600; font-size: 30px; letter-spacing: .1em; color: ${SOGAN}; }
  .wy-card .big { font-family: var(--font-serif-elegant), Georgia, serif; font-weight: 600; font-size: 22px; margin: 10px 0 4px; }
  .wy-card p { font-size: 16px; line-height: 1.6; }

  /* Mempelai */
  .wy-pair { display: grid; gap: 50px; margin-top: 8px; }
  @media (min-width: 720px) { .wy-pair { grid-template-columns: 1fr 1fr; } }
  .wy-ph { aspect-ratio: 3/4; max-width: 260px; margin: 0 auto 24px; overflow: hidden; display: grid; place-items: center; font-style: italic; color: ${IVORY}; background: linear-gradient(160deg, #d8c39a, #a98653); font-family: var(--font-serif-elegant), Georgia, serif; }
  .wy-ph img { width: 100%; height: 100%; object-fit: cover; }
  .wy-pn { font-family: var(--font-serif-elegant), Georgia, serif; font-weight: 600; font-size: 29px; line-height: 1.2; color: ${SOGAN}; }
  .wy-pn small { display: block; font-family: var(--font-sans-jost), system-ui, sans-serif; font-weight: 300; font-size: 15px; margin-top: 8px; color: ${SOGAN_D}; line-height: 1.6; }

  /* Story / timeline */
  .wy-tl { position: relative; max-width: 620px; margin: 20px auto 0; text-align: left; }
  .wy-tl::before { content: ""; position: absolute; left: 19px; top: 0; bottom: 0; width: 1px; background: ${GOLD}; opacity: .5; }
  .wy-st { position: relative; padding: 0 0 34px 62px; }
  .wy-st-ico { position: absolute; left: 4px; top: 0; width: 30px; height: 38px; fill: ${IVORY}; stroke: ${GOLD}; stroke-width: 2; }
  .wy-st h3 { font-family: var(--font-serif-elegant), Georgia, serif; font-weight: 600; font-size: 24px; color: ${SOGAN}; }
  .wy-st > span { color: ${GOLD}; font-weight: 500; font-size: 15px; letter-spacing: .1em; }
  .wy-st p { margin-top: 4px; line-height: 1.7; }

  /* Galeri */
  .wy-gal { columns: 2 150px; column-gap: 12px; margin-top: 20px; }
  .wy-gal > button { display: block; width: 100%; margin: 0 0 12px; border: 1px solid ${GOLD}; padding: 5px; background: ${IVORY}; overflow: hidden; break-inside: avoid; transition: transform .3s ease; }
  .wy-gal > button:hover { transform: scale(1.02); }
  .wy-gal img { width: 100%; display: block; transition: transform .8s; }
  .wy-gal > button:hover img { transform: scale(1.06); }

  /* Gift */
  .wy-pay { display: grid; gap: 22px; max-width: 560px; margin: 24px auto 0; }
  .wy-pay .wy-card { padding: 26px 20px; color: ${SOGAN_D}; }
  .wy-pay .n { font-family: var(--font-serif-elegant), Georgia, serif; font-weight: 600; font-size: 26px; letter-spacing: .08em; margin: 6px 0; }

  /* Tombol */
  .wy-btn {
    display: inline-block; padding: 12px 26px; min-height: 44px;
    border: 1px solid ${GOLD}; border-radius: 2px;
    background: linear-gradient(135deg, ${GOLD_L}, ${GOLD});
    color: ${GREEN_D}; font-size: 13px; font-weight: 500;
    letter-spacing: .16em; text-transform: uppercase; text-decoration: none;
    cursor: pointer; transition: transform .4s, box-shadow .4s;
    font-family: system-ui, sans-serif;
  }
  .wy-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 22px rgba(185,143,62,.4); }
  .wy-btn.o { background: transparent; color: ${SOGAN}; border-color: ${SOGAN}; }
  .wy-section.dark .wy-btn.o { color: ${GOLD_L}; border-color: ${GOLD}; }
  @keyframes wyScrollHint { 0%, 100% { transform: translateY(0); opacity: 1; } 50% { transform: translateY(8px); opacity: .55; } }
  .wy-scroll-hint { animation: wyScrollHint 1.8s ease-in-out infinite; }

  /* Form styling sesuai referensi */
  .wy-form { max-width: 480px; margin: 20px auto 0; text-align: left; display: grid; gap: 14px; }
  .wy-form label { font-size: 14px; letter-spacing: .06em; color: ${SOGAN_D}; }
  .wy-form input, .wy-form textarea {
    width: 100%; padding: 12px 14px; font-size: 16px;
    background: ${IVORY}; color: ${SOGAN_D};
    border: 1px solid ${GOLD}; border-radius: 2px;
    font-family: system-ui, sans-serif; outline: none;
  }
  .wy-form input:focus, .wy-form textarea:focus { box-shadow: 0 0 0 2px rgba(226,194,116,.4); }

  /* Quotes */
  .wy-quote {
    font-family: var(--font-serif-elegant), Georgia, serif;
    font-style: italic; font-weight: 500;
    font-size: clamp(19px, 4.6vw, 23px); line-height: 1.7; margin: 14px 0;
  }

  /* Lightbox */
  @keyframes wyZin { from { opacity: 0; transform: scale(.9); } }
  .wy-lb-content { animation: wyZin .5s ease; }

  /* Out animation (gerbang) */
  @keyframes wyOut {
    to { opacity: 0; transform: translateY(-100%) scale(1.03); }
  }
  .wy-out { animation: wyOut 1s cubic-bezier(.7,0,.2,1) forwards; pointer-events: none; }

  @media (prefers-reduced-motion: reduce) {
    .float-slow, .wy-fig, .wy-arm, .wy-hd, .wy-lamp, .wy-parang, .wy-scroll-hint { animation: none !important; }
    .wy-reveal { opacity: 1; transform: none; }
  }
`;
/* Batik parang strip bergersak di atas dasar sogan gelap */
const PARANG_STYLE = `
  .wy-parang {
    height: 46px;
    background-size: 48px 48px, auto;
    border-block: 2px solid ${GOLD};
    animation: wyDrift 60s linear infinite;
    opacity: 1;
  }
  @keyframes wyDrift { to { background-position: 96px 96px; } }
`;

/* ------------------------------------------------------------------ */
/* Reveal-on-scroll (tanpa framer-motion, sesuai tema lain)            */
/* ------------------------------------------------------------------ */
function useReveal() {
  // Tanpa guard ran: React StrictMode double-invoke effect — guard membuat
  // observer efek pertama terputus dan yang kedua tidak dipasang (konten
  // reveal opacity 0 selamanya). Sinkron dengan pola OnyxTemplate.
  useEffect(() => {
    const list = Array.from(document.querySelectorAll(".wy-reveal"));
    const pending = new Set(list);
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          // Reveal juga semua elemen sebelum target (urutan dokumen): jika
          // scroll melompat (mis. klik menu anchor), elemen yang terlewati
          // tetap tampil — tidak nyangkut opacity 0 selamanya.
          const upto = list.indexOf(e.target);
          for (let i = 0; i <= upto; i++) {
            const el = list[i];
            if (pending.has(el)) {
              pending.delete(el);
              el.classList.add("wy-in");
              io.unobserve(el);
            }
          }
        }
      },
      { threshold: 0.12 },
    );
    list.forEach((el) => io.observe(el));
    return () => io.disconnect();
  });
}

type GateProps = { gateOpen?: boolean; onGateOpen?: () => void };

export default function WayangTemplate(props: TemplateProps) {
  // Mode embed (thumbnail live iframe): gerbang terbuka, musik dimatikan
  const isEmbed = !!props.embedded;
  const [gateOpen, setGateOpen] = useState(isEmbed);
  const music = useBackgroundMusic(isEmbed ? undefined : props.data.musicUrl);
  return (
    <WayangShell
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

function WayangShell({
  invitationId,
  guestName,
  data,
  isPublished,
  wishes,
  decorations,
  gateOpen = true,
  onGateOpen,
  music,
}: TemplateProps & GateProps & { music?: MusicController }) {
  useReveal();

  if (!isPublished) {
    return <DraftNotice />;
  }

  const groom = data.groom;
  const bride = data.bride;

  // Acara: entri "Akad" pada Rangkaian Acara digabung ke Acara Utama agar
  // tidak tampil dobel (lihat splitAgenda).
  const agenda = splitAgenda(data.events, {
    date: data.eventDate,
    time: data.eventTime,
    venue: [data.venueName, data.location].filter(Boolean).join(", "),
    mapUrl: data.locationMap,
  });
  const events = agenda.additional;
  const story = data.story ?? [];
  const gallery = data.gallery ?? [];
  const gifts = data.gifts ?? [];

  // Prioritas background: pilihan user > admin (template) > bawaan wayang
  const bgUrl = data.backgroundUrl || getBackgroundUrl(decorations);
  const gatePhoto = resolveGatePhoto({
    gatePhotoUrl: data?.gatePhotoUrl,
    groomPhotoUrl: data?.groom?.photoUrl,
    bridePhotoUrl: data?.bride?.photoUrl,
    firstGalleryUrl: data?.gallery?.[0]?.url,
  });

  return (
    <div className="relative min-h-screen overflow-x-hidden" style={{ background: CREAM }}>
      <style>{WY_STYLES}</style>
      <style>{PARANG_STYLE}</style>

      {/* Background kustom user/admin sebagai lapisan penuh + pengapit gelap */}
      {bgUrl ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={bgUrl}
            alt=""
            className="pointer-events-none fixed inset-0 z-0 h-full w-full object-cover"
          />
          <div
            className="pointer-events-none fixed inset-0 z-0"
            style={{ background: "rgba(38, 22, 10, 0.72)" }}
          />
        </>
      ) : null}

      <Gate
        groomNick={groom?.nickname ?? groom?.name}
        brideNick={bride?.nickname ?? bride?.name}
        guestName={guestName}
        eventDate={data.eventDate}
        eventName={data.eventName ?? "The Wedding Of"}
        photoUrl={gatePhoto}
        locked={!gateOpen}
        onOpen={onGateOpen}
      />

      {/* 1. Hero — hijau pekat + wayang + gunungan melayang */}
      <section
        id="home"
        className="wy-section dark relative flex min-h-[88svh] items-center justify-center overflow-hidden"
        style={{ background: `radial-gradient(ellipse at 50% 20%, rgba(226,194,116,.25), transparent 60%), ${KAWUNG_URL}, ${GREEN_D}` }}
      >
        <WayangPair />
        <div className="wy-wrap relative z-10">
          <div className="wy-reveal flex justify-center">
            <Gunungan className="float-slow" stroke={GOLD_L} strokeWidth={1.5} style={{ height: 70, width: "auto" }} />
          </div>
          <p className="wy-script mt-3" style={{ fontSize: "clamp(26px, 6vw, 34px)" }}>
            {data.customMessage || "Om Swastiastu · Assalamu'alaikum"}
          </p>
          <div className="wy-names-hero flex flex-col items-center justify-center py-4">
            <span
              className="text-[clamp(44px,12vw,86px)] font-semibold leading-[1.05] text-[#f6efdf]"
              style={{ fontFamily: "var(--font-serif-elegant), Georgia, serif" }}
            >
              {groom?.nickname ?? groom?.name ?? "Pria"}
            </span>
            <em
              className="my-1 text-[.5em] leading-none text-[#e2c274]"
              style={{ fontFamily: "var(--font-script), cursive" }}
            >
              &amp;
            </em>
            <span
              className="text-[clamp(44px,12vw,86px)] font-semibold leading-[1.05] text-[#f6efdf]"
              style={{ fontFamily: "var(--font-serif-elegant), Georgia, serif" }}
            >
              {bride?.nickname ?? bride?.name ?? "Wanita"}
            </span>
          </div>
          <Divider />
          <p className="wy-lead tracking-[0.14em]" style={{ color: GOLD_L }}>
            {formatDate(data.eventDate) || "Tanggal acara"}
          </p>
        </div>
      </section>
      <ParangStrip />

      {/* 2. Kutipan Ar-Rum 21 ala referensi (frame emas) */}
      <QuoteSection customMessage={data.customMessage} />

      {/* 3. Mempelai */}
      {(groom?.name || bride?.name) && (
        <section id="mempelai" className="wy-section">
          <div className="wy-wrap">
            <h2 className="wy-h2 wy-reveal">The Bride &amp; Groom</h2>
            <Divider />
            <div className="wy-pair wy-reveal">
              <PersonCard person={groom} role="Mempelai Pria" placeholderIdx={0} />
              <PersonCard person={bride} role="Mempelai Wanita" placeholderIdx={1} />
            </div>
          </div>
        </section>
      )}

      {/* 4. Our Story / timeline */}
      {story.length > 0 ? <StorySection story={story} /> : null}

      <ParangStrip />

      {/* 5. Acara (dark) + countdown */}
      <section id="acara" className="wy-section dark relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[.09]"
          style={{ backgroundImage: PARANG_URL, backgroundSize: "48px" }}
        />
        <div className="wy-wrap relative z-10">
          <h2 className="wy-h2 wy-reveal">Detail Acara</h2>
          <Divider />
          <div className="wy-cards wy-reveal">
            <EventCard
              title="Akad Nikah"
              date={agenda.main.date}
              time={agenda.main.time}
              venue={agenda.main.venue}
              mapUrl={agenda.main.mapUrl}
            />
            {events.length > 0 && /^resepsi/i.test(events[0].title ?? "") ? (
              <EventCard
                title={events[0].title ?? "Resepsi"}
                date={events[0].date}
                time={events[0].time}
                venue={events[0].location}
                mapUrl={events[0].locationMap}
              />
            ) : null}
          </div>

          {/* Acara tambahan (setelah Akad & Resepsi) */}
          {events.length > (events.length > 0 && /^resepsi/i.test(events[0].title ?? "") ? 1 : 0) ? (
            <div className="mx-auto mt-8 max-w-2xl space-y-5">
              {events
                .slice(events.length > 0 && /^resepsi/i.test(events[0].title ?? "") ? 1 : 0)
                .map((e) => (
                  <div
                    key={e.id}
                    className="wy-frame wy-reveal"
                    style={{ background: "rgba(251,247,236,.96)", color: SOGAN_D }}
                  >
                    <div className="py-4">
                      <p className="inline-block px-3 py-1 text-xs font-bold" style={{ background: "rgba(185,143,62,.16)", color: SOGAN }}>
                        {formatDate(e.date)}
                      </p>
                      <h3 className="mt-2 text-xl font-semibold" style={{ fontFamily: "var(--font-serif-elegant), Georgia, serif" }}>
                        {e.title ?? "Acara"}
                      </h3>
                      {e.time ? (
                        <p className="mt-2 flex items-center justify-center gap-1.5 text-sm">
                          <Clock className="h-4 w-4" style={{ color: GOLD }} /> {formatTime(e.time)}
                        </p>
                      ) : null}
                      {e.location ? (
                        <p className="mt-1 flex items-center justify-center gap-1.5 text-sm">
                          <MapPin className="h-4 w-4" style={{ color: GOLD }} /> {e.location}
                        </p>
                      ) : null}
                      {e.locationMap ? (
                        <a
                          href={e.locationMap}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-3 inline-flex items-center gap-1 text-sm font-semibold underline hover:opacity-80"
                          style={{ color: GOLD }}
                        >
                          Lihat Lokasi <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : null}
                    </div>
                  </div>
                ))}
            </div>
          ) : null}

          {/* Hitung mundur ala referensi */}
          <CountdownBlock eventDate={agenda.main.date} eventName={data.eventName} />
        </div>
      </section>

      {/* 6. Lokasi */}
      <section id="lokasi" className="wy-section alt">
        <div className="wy-wrap wy-reveal">
          <h2 className="wy-h2">Location</h2>
          <Divider />
          <iframe
            title={`Peta lokasi ${data.eventName ?? "acara"}`}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="w-full border"
            style={{ height: 340, borderColor: GOLD, filter: "sepia(.25)" }}
            src={mapEmbedSrc(agenda.main.venue || data.location)}
          />
          <a
            className="wy-btn mt-2 inline-block"
            target="_blank"
            rel="noopener noreferrer"
            href={mapLinkSrc(agenda.main.venue || data.location)}
          >
            Buka Google Maps
          </a>
        </div>
      </section>

      {/* 7. Dress Code (adat Jawa) */}
      <section className="wy-section">
        <div className="wy-wrap wy-reveal">
          <h2 className="wy-h2">Dress Code</h2>
          <Divider />
          <p className="text-2xl font-semibold italic" style={{ color: SOGAN, fontFamily: "var(--font-serif-elegant), Georgia, serif" }}>
            Javanese Traditional / Formal Attire
          </p>
        </div>
      </section>

      {/* 8. Galeri */}
      {gallery.length > 0 ? <GallerySection gallery={gallery} /> : null}

      {/* 9. Live Streaming (bila data video tersedia) */}
      {data.videos && data.videos.length > 0 ? (
        <section id="live" className="wy-section dark">
          <div className="wy-wrap wy-reveal">
            <h2 className="wy-h2">Live Streaming</h2>
            <Divider />
            <p className="wy-lead">Hadiri momen bahagia kami secara virtual.</p>
            {data.videos[0]?.url ? (
              <a
                className="wy-btn mt-8 inline-block"
                target="_blank"
                rel="noopener noreferrer"
                href={data.videos[0].url}
              >
                Join Live Streaming
              </a>
            ) : null}
          </div>
        </section>
      ) : null}

      {/* 10. RSVP */}
      <section id="rsvp" className="wy-section">
        <div className="wy-wrap wy-reveal">
          <h2 className="wy-h2">RSVP</h2>
          <Divider />
          <p className="wy-lead">
            Merupakan suatu kehormatan bagi kami apabila Bapak/Ibu/Saudara/i
            berkenan hadir dan memberikan doa restu.
          </p>
          <div className="wy-form">
            <RsvpForm
              invitationId={invitationId}
              initialName={guestName}
              // Teks diberi ! agar menang atas text-white bawaan tombol;
              // latar emas mengikuti tombol utama template (.wy-btn).
              accentClass="bg-gradient-to-r from-[#e2c274] to-[#b98f3e]! text-[#14261c]! hover:brightness-105"
              borderClass="border-[#b98f3e] focus:border-[#6b4226] focus:ring-[#e2c274]/30"
            />
          </div>
        </div>
      </section>

      {/* 11. Ucapan & Doa */}
      <section id="ucapan" className="wy-section alt">
        <div className="wy-wrap">
          <h2 className="wy-h2 wy-reveal">Ucapan &amp; Doa</h2>
          <Divider />
          <div className="mx-auto mt-6 grid max-h-[420px] max-w-[640px] gap-3 overflow-y-auto px-2 text-left">
            <WishList
              wishes={wishes ?? []}
              cardClass="wy-frame !p-4"
              nameClass="text-[#6b4226]"
              avatarClass="bg-[#b98f3e]/20 text-[#6b4226]"
              emptyClass="text-[#6b4226]/60"
            />
          </div>
          <div className="wy-form">
            <WishForm
              invitationId={invitationId}
              accentClass="bg-gradient-to-r from-[#e2c274] to-[#b98f3e]! text-[#14261c]! hover:brightness-105"
              borderClass="border-[#b98f3e] focus:border-[#6b4226] focus:ring-[#e2c274]/30"
            />
          </div>
        </div>
      </section>

      {/* 12. Amplop Digital / Kado Digital (dark) */}
      {gifts.length > 0 ? (
        <section className="wy-section dark">
          <div className="wy-wrap">
            <h2 className="wy-h2 wy-reveal">Amplop Digital</h2>
            <Divider />
            <p className="wy-lead wy-reveal">
              Doa dan restu Anda merupakan hadiah terindah bagi kami. Bagi yang
              ingin memberikan tanda kasih, dapat melalui:
            </p>
            <div className="wy-pay">
              {gifts.map((g, i) => (
                <div
                  key={g.id}
                  className="wy-frame wy-card wy-reveal"
                  style={{ background: "rgba(251,247,236,.96)" }}
                >
                  <small className="text-[11px] uppercase tracking-[0.2em]" style={{ color: GOLD }}>
                    {i === 0 ? "BANK" : g.provider || "E-WALLET"}
                  </small>
                  <p>
                    <b>{g.provider}</b>
                  </p>
                  <p className="n">{g.accountNumber}</p>
                  {g.holderName ? <p>a.n. {g.holderName}</p> : null}
                  <div className="mt-3">
                    <CopyButton text={g.accountNumber} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <ParangStrip />

      {/* 13. Closing */}
      <section
        id="closing"
        className="wy-section dark relative flex min-h-[90svh] items-center justify-center overflow-hidden"
        style={{ background: `radial-gradient(ellipse at 50% 30%, rgba(226,194,116,.22), transparent 60%), ${KAWUNG_URL}, ${GREEN_D}` }}
      >
        <WayangPair />
        <div className="wy-wrap relative z-10">
          <div className="wy-reveal flex justify-center">
            <Gunungan className="float-slow" stroke={GOLD_L} strokeWidth={1.5} style={{ height: 80, width: "auto" }} />
          </div>
          <p className="wy-script my-4">Terima Kasih</p>
          <p className="wy-lead">
            Atas doa, restu, dan kehadiran Anda dalam hari bahagia kami.
          </p>
          <div
            className="my-7 text-center"
            style={{ fontFamily: "var(--font-script), cursive", fontSize: "clamp(36px,9vw,60px)", color: GOLD_L }}
          >
            {(groom?.nickname ?? groom?.name ?? "")} &amp; {(bride?.nickname ?? bride?.name ?? "")}
          </div>
        
        </div>
      </section>
      <ParangStrip />

      {/* Footer watermark Meduta bagian paling bawah */}
      <footer
        className="py-6 text-center"
        style={{ background: GREEN_D, borderTop: `1px solid rgba(185,143,62,.35)` }}
      >
        <p
          className="text-[10px] uppercase tracking-widest"
          style={{ color: "rgba(226,194,116,.55)" }}
        >
          &copy; {new Date().getFullYear()} - Meduta
        </p>
      </footer>

      {/* Musik FAB + back-to-top */}
      {data.musicUrl && music ? (
        <div className="fixed bottom-6 right-6 z-[45] flex flex-col gap-3">
          <MusicFab
            isPlaying={music.isPlaying}
            onToggle={music.toggle}
            buttonClassName="border border-[#b98f3e] bg-[#1f3a2b] text-[#e2c274] shadow-[0_0_18px_rgba(185,143,62,.35)]"
            playingIconClassName="h-5 w-5 text-[#e2c274]"
            pausedIconClassName="h-5 w-5 opacity-70"
          />
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            aria-label="Kembali ke atas"
            style={{ background: GREEN, border: `1px solid ${GOLD}` }}
            className="flex h-12 w-12 items-center justify-center rounded-full text-[#e2c274] shadow-lg transition-transform duration-300 hover:scale-110"
          >
            <ArrowUp className="h-5 w-5" />
          </button>
        </div>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Sub-component                                                       */
/* ------------------------------------------------------------------ */

function DraftNotice() {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center"
      style={{ background: GREEN_D, color: CREAM }}
    >
      <Heart className="h-8 w-8 text-[#e2c274]" />
      <p className="text-lg font-medium">Undangan belum dipublikasikan</p>
      <p className="max-w-sm text-sm opacity-60">
        Pemilik undangan belum mengaktifkan halaman ini. Silakan cek kembali nanti.
      </p>
    </div>
  );
}

function Gate({
  groomNick,
  brideNick,
  guestName,
  eventDate,
  eventName,
  photoUrl,
  locked,
  onOpen,
}: {
  groomNick?: string;
  brideNick?: string;
  guestName?: string;
  eventDate?: string;
  eventName?: string;
  photoUrl?: string;
  locked?: boolean;
  onOpen?: () => void;
}) {
  if (!locked) return null;
  return (
    <WayangGate
      groomNick={groomNick}
      brideNick={brideNick}
      guestName={guestName}
      eventDate={eventDate}
      eventName={eventName === "Undangan Pernikahan" ? "The Wedding Of" : eventName}
      photoUrl={photoUrl}
      onOpen={onOpen}
    />
  );
}

function QuoteSection({ customMessage }: { customMessage?: string }) {
  // Kutipan default Ar-Rum: 21 seperti referensi; jika admin/user mengisi
  // customMessage maka pakai itu.
  return (
    <section className="wy-section alt">
      <div className="wy-wrap">
        <div className="wy-frame py-11 px-6">
          <p className="wy-script" style={{ fontSize: "clamp(27px,6vw,36px)" }}>
            {customMessage?.trim() || "Ar-Rum : 21"}
          </p>
          <p
            className="wy-quote"
            style={{ fontStyle: "italic", color: SOGAN_D }}
          >
            &ldquo;Dan di antara tanda-tanda kekuasaan-Nya ialah Dia menciptakan
            untukmu pasangan hidup dari jenismu sendiri, supaya kamu mendapatkan
            ketenangan hati dan dijadikan-Nya di antaramu rasa kasih dan sayang.&rdquo;
          </p>
          <p className="mt-3 tracking-[0.14em]" style={{ color: GOLD }}>
            QS. Ar-Rum: 21
          </p>
        </div>
      </div>
    </section>
  );
}

function PersonCard({
  person,
  role,
}: {
  person?: TemplateProps["data"]["groom"];
  role: string;
  placeholderIdx?: number;
}) {
  return (
    <div className="wy-reveal">
      <div className="wy-frame wy-ph">
        {person?.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            loading="lazy"
            src={person.photoUrl}
            alt={person.name ?? role}
          />
        ) : role === "Mempelai Pria" ? (
          role
        ) : (
          role
        )}
      </div>
      <p className="wy-pn">
        {person?.name ?? "-"}
        <small>
          {person?.childOf ?? (role === "Mempelai Pria" ? "Putra" : "Putri")} dari {person?.parentName ?? "-"}
        </small>
      </p>
      {person?.instagram ? (
        <a
          href={`https://instagram.com/${person.instagram.replace(/^@/, "")}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold"
          style={{ borderColor: GOLD, color: SOGAN }}
        >
          <AtSign className="h-3.5 w-3.5" style={{ color: GOLD }} />
          {person.instagram}
        </a>
      ) : null}
    </div>
  );
}

function StorySection({
  story,
}: {
  story: NonNullable<TemplateProps["data"]["story"]>;
}) {
  return (
    <section className="wy-section alt">
      <div className="wy-wrap">
        <h2 className="wy-h2 wy-reveal">Our Story</h2>
        <Divider />
        <div className="wy-tl">
          {story.map((item) => (
            <div key={item.id} className="wy-st wy-reveal">
              <Gunungan className="wy-st-ico" stroke={GOLD} strokeWidth={2} />
              <span>{item.date ? formatDate(item.date) : ""}</span>
              <h3>{item.title ?? ""}</h3>
              <p>{item.description ?? ""}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function EventCard({
  title,
  date,
  time,
  venue,
  mapUrl,
}: {
  title: string;
  date?: string;
  time?: string;
  venue?: string;
  mapUrl?: string;
}) {
  return (
    <div
      className="wy-frame wy-card wy-reveal"
      style={{ background: "rgba(251,247,236,.96)" }}
    >
      <h3>{title}</h3>
      <Divider />
      {date ? <p>{formatDate(date)}</p> : null}
      {time ? <p className="big">{formatTime(time)}</p> : null}
      {venue ? (
        <p>
          <b>{venue}</b>
        </p>
      ) : null}
      {mapUrl ? (
        <a
          href={mapUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="wy-btn mt-3 inline-block"
        >
          Buka Google Maps
        </a>
      ) : null}
    </div>
  );
}

function CountdownBlock({
  eventDate,
  eventName,
}: {
  eventDate?: string;
  eventName?: string;
}) {
  const { days, hours, minutes, seconds } = useCountdown(eventDate);
  const items = [
    { label: "Hari", value: days },
    { label: "Jam", value: hours },
    { label: "Menit", value: minutes },
    { label: "Detik", value: seconds },
  ];
  const calUrl = googleCalendarUrl({
    title: eventName ?? "Pernikahan",
    date: eventDate,
  });
  return (
    <div className="wy-reveal" style={{ marginTop: 56 }}>
      <p className="wy-script">Hari Bahagia Kami</p>
      <div className="wy-cd">
        {items.map((item) => (
          <div key={item.label}>
            <b>{String(item.value).padStart(2, "0")}</b>
            <small>{item.label}</small>
          </div>
        ))}
      </div>
      {eventDate ? (
        <a
          href={calUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="wy-btn o mt-2 inline-block"
        >
          <CalendarDays className="mr-2 inline-block h-4 w-4" />
          Simpan Tanggal
        </a>
      ) : null}
      <div className="mt-6 flex flex-col items-center gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.35em] opacity-60">
          Gulir Ke Bawah
        </span>
        <span className="wy-scroll-hint flex h-10 w-10 items-center justify-center rounded-full" style={{ border: `1px solid ${GOLD}` }}>
          <ChevronDown className="h-6 w-6" />
        </span>
      </div>
    </div>
  );
}

function GallerySection({
  gallery,
}: {
  gallery: NonNullable<TemplateProps["data"]["gallery"]>;
}) {
  const [selected, setSelected] = useState<{ url: string; caption?: string } | null>(null);

  return (
    <section id="galeri" className="wy-section alt">
      <div className="wy-wrap">
        <h2 className="wy-h2 wy-reveal">Our Moments</h2>
        <Divider />
        <div className="wy-gal wy-reveal">
          {gallery.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelected({ url: item.url, caption: item.caption })}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                loading="lazy"
                src={item.url}
                alt={item.caption ?? "Foto galeri"}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {selected ? (
        <div
          className="fixed inset-0 z-[60] grid place-items-center p-5"
          style={{ background: "rgba(15,25,18,.94)" }}
          onClick={() => setSelected(null)}
          role="dialog"
          aria-label="Lihat foto"
        >
          <div className="wy-lb-content relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={selected.url}
              alt={selected.caption ?? "Foto galeri"}
              className="max-h-[82vh] w-full max-w-[720px] rounded-[3px] border object-contain"
              style={{ borderColor: GOLD_L }}
            />
            <button
              type="button"
              onClick={() => setSelected(null)}
              aria-label="Tutup"
              className="absolute -top-12 right-0 text-3xl"
              style={{ color: GOLD }}
            >
              <X className="h-7 w-7" />
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

/* Google Maps helpers (embed + link) */
function mapEmbedSrc(query?: string): string {
  if (!query) return "";
  return `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;
}
function mapLinkSrc(query?: string): string {
  if (!query) return "https://www.google.com/maps";
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}
