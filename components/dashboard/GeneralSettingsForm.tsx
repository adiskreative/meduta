"use client";

import { useActionState, useState } from "react";
import { Save, Eye, Link2 } from "lucide-react";
import { saveGeneralSettings, GeneralState } from "@/lib/actions/general";
import PublishButton from "@/components/dashboard/PublishButton";

/**
 * Preset kutipan populer lintas kepercayaan — user klik, ketiga kolom terisi.
 * Teks siap diedit; pilihan ini hanya mengisi form, side server tetap satu schema.
 */
const QUOTE_PRESETS = [
  {
    id: "islam",
    emoji: "🕌",
    label: "Islam",
    title: "Ar-Rum : 21",
    text:
      "Dan di antara tanda-tanda kekuasaan-Nya ialah Dia menciptakan untukmu pasangan hidup dari jenismu sendiri, supaya kamu mendapatkan ketenangan hati dan dijadikan-Nya di antaramu rasa kasih dan sayang.",
    source: "QS. Ar-Rum: 21",
  },
  {
    id: "kristen",
    emoji: "✝️",
    label: "Kristen",
    title: "Matius 19:6",
    text:
      "Maka mereka bukan lagi dua, melainkan satu daging. Karena itu, apa yang telah dipersatukan Allah, tidak boleh diceraikan manusia.",
    source: "Matius 19:6",
  },
  {
    id: "katolik",
    emoji: "⛪",
    label: "Katolik",
    title: "Roma 12:9-10",
    text:
      "Kasihmu itu harus sungguh-sungguh. Benci-lah yang jahat, berpegang-lah pada yang baik, dan seorang kepada saudaranya memakai hormat.",
    source: "fwds. Rm 12:9-10",
  },
  {
    id: "hindu",
    emoji: "🕉️",
    label: "Hindu",
    title: "Mantra Pernikahan",
    text:
      "Semoga kalian berdua mendapat berkat, berjalan dengan satu tujuan, dan ditakdirkan menyatu sebagai pasangan hidup yang saling mencintai.",
    source: "Ṛg Veda 10.85",
  },
  {
    id: "secular",
    emoji: "💬",
    label: "Secular",
    title: "Tentang Cinta",
    text:
      "Aku mencintaimu bukan karena siapa dirimu, tetapi karena siapa diriku saat bersamamu.",
    source: "— Roy Crof",
  },
] as const;

export default function GeneralSettingsForm({
  invitationId,
  defaultEventName,
  defaultSlug,
  slugChangeCount,
  defaultCustomMessage,
  defaultQuoteTitle,
  defaultQuoteText,
  defaultQuoteSource,
  defaultQuoteHidden,
  isPublished,
}: {
  invitationId: string;
  defaultEventName: string;
  defaultSlug: string;
  slugChangeCount: number;
  defaultCustomMessage: string;
  defaultQuoteTitle: string;
  defaultQuoteText: string;
  defaultQuoteSource: string;
  defaultQuoteHidden: boolean;
  isPublished: boolean;
}) {
  const boundAction = saveGeneralSettings.bind(null, invitationId);
  const [state, formAction, isPending] = useActionState<GeneralState | undefined, FormData>(
    boundAction,
    undefined,
  );

  // Kutipan dikontrol state agar tombol preset bisa mengisi ketiga kolom sekaligus.
  const [quoteTitle, setQuoteTitle] = useState(defaultQuoteTitle);
  const [quoteText, setQuoteText] = useState(defaultQuoteText);
  const [quoteSource, setQuoteSource] = useState(defaultQuoteSource);

  const applyPreset = (p: (typeof QUOTE_PRESETS)[number]) => {
    setQuoteTitle(p.title);
    setQuoteText(p.text);
    setQuoteSource(p.source);
  };

  const clearQuote = () => {
    setQuoteTitle("");
    setQuoteText("");
    setQuoteSource("");
  };

  const slugRemaining = 3 - slugChangeCount;
  const inputClass = (hasError: boolean) =>
    `w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition focus:border-rose-400 focus:ring-2 focus:ring-rose-100 ${
      hasError ? "border-red-400" : "border-zinc-300"
    }`;

  return (
    <form action={formAction} className="space-y-6">
      {state?.message && (
        <div
          className={`rounded-lg px-4 py-3 text-sm ${
            state.success
              ? "bg-emerald-50 text-emerald-700"
              : "bg-red-50 text-red-600"
          }`}
        >
          {state.message}
        </div>
      )}

      <div className="rounded-2xl border border-zinc-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-zinc-900">Nama Acara</h2>
        <label
          htmlFor="eventName"
          className="mb-1.5 block text-sm font-medium text-zinc-700"
        >
          Nama acara / undangan
        </label>
        <input
          id="eventName"
          name="eventName"
          type="text"
          defaultValue={defaultEventName}
          placeholder="cth: Pernikahan Rizky & Maharani"
          className={inputClass(!!state?.errors?.eventName)}
        />
        {state?.errors?.eventName && (
          <p className="mt-1 text-xs text-red-600">{state.errors.eventName[0]}</p>
        )}
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-6">
        <h2 className="mb-1 text-lg font-semibold text-zinc-900">
          Link / URL Undangan
        </h2>
        <p className="mb-4 flex items-center gap-1.5 text-sm text-zinc-500">
          <Link2 className="h-4 w-4" />
          meduta.my.id/{defaultSlug}
        </p>

        {slugRemaining > 0 ? (
          <>
            <label
              htmlFor="slug"
              className="mb-1.5 block text-sm font-medium text-zinc-700"
            >
              Slug undangan
            </label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-zinc-400">meduta.my.id/</span>
              <input
                id="slug"
                name="slug"
                type="text"
                defaultValue={defaultSlug}
                className={inputClass(!!state?.errors?.slug)}
              />
            </div>
            <p className="mt-2 text-xs text-zinc-400">
              Sisa kesempatan ganti link: {slugRemaining}x
            </p>
            {state?.errors?.slug && (
              <p className="mt-1 text-xs text-red-600">{state.errors.slug[0]}</p>
            )}
          </>
        ) : (
          <div className="rounded-lg bg-zinc-50 px-4 py-3 text-sm text-zinc-500">
            Link undangan: <span className="font-medium">meduta.my.id/{defaultSlug}</span>.
            Batas ganti link (3x) sudah habis.
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-zinc-900">
          Pesan / Ucapan di Undangan
        </h2>
        <label
          htmlFor="customMessage"
          className="mb-1.5 block text-sm font-medium text-zinc-700"
        >
          Pesan custom (opsional)
        </label>
        <textarea
          id="customMessage"
          name="customMessage"
          rows={3}
          defaultValue={defaultCustomMessage}
          placeholder="Tulis sambutan atau pesan khusus untuk tamu..."
          className={inputClass(!!state?.errors?.customMessage)}
        />
        {state?.errors?.customMessage && (
          <p className="mt-1 text-xs text-red-600">
            {state.errors.customMessage[0]}
          </p>
        )}
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-6">
        <h2 className="mb-1 text-lg font-semibold text-zinc-900">
          Kutipan di Undangan
        </h2>
        <p className="mb-4 text-xs text-zinc-500">
          Ubah sesuai kepercayaan Anda (ayat, quote, atau kalimat lain).
          Kolom yang dikosongkan memakai kutipan bawaan template.
        </p>
        <label className="mb-4 inline-flex cursor-pointer items-center gap-2.5 rounded-lg bg-zinc-50 px-3.5 py-2.5 text-sm font-medium text-zinc-700">
          <input
            type="checkbox"
            name="quoteHidden"
            defaultChecked={!defaultQuoteHidden}
            className="h-4 w-4 accent-rose-600"
          />
          Tampilkan bagian kutipan
        </label>
        <p className="mb-2 block text-sm font-medium text-zinc-700">
          Preset kutipan populer
        </p>
        <div className="mb-4 flex flex-wrap gap-2">
          {QUOTE_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => applyPreset(p)}
              title={p.text}
              className="inline-flex items-center gap-1.5 rounded-full border border-zinc-300 bg-white px-3.5 py-1.5 text-xs font-medium text-zinc-700 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700"
            >
              <span aria-hidden>{p.emoji}</span>
              {p.label}
            </button>
          ))}
          {(quoteTitle || quoteText || quoteSource) && (
            <button
              type="button"
              onClick={clearQuote}
              className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-zinc-300 bg-zinc-50 px-3.5 py-1.5 text-xs font-medium text-zinc-500 transition hover:border-zinc-400 hover:text-zinc-700"
            >
              Pakai bawaan template
            </button>
          )}
        </div>

        <label
          htmlFor="quoteTitle"
          className="mb-1.5 block text-sm font-medium text-zinc-700"
        >
          Judul kutipan
        </label>
        <input
          id="quoteTitle"
          name="quoteTitle"
          type="text"
          value={quoteTitle}
          onChange={(e) => setQuoteTitle(e.target.value)}
          placeholder="cth: Ar-Rum : 21 atau Febi & Aldi"
          className={inputClass(!!state?.errors?.quoteTitle)}
        />
        {state?.errors?.quoteTitle && (
          <p className="mt-1 text-xs text-red-600">{state.errors.quoteTitle[0]}</p>
        )}

        <label
          htmlFor="quoteText"
          className="mb-1.5 mt-4 block text-sm font-medium text-zinc-700"
        >
          Isi kutipan
        </label>
        <textarea
          id="quoteText"
          name="quoteText"
          rows={4}
          value={quoteText}
          onChange={(e) => setQuoteText(e.target.value)}
          placeholder="Tulis ayat, quote, atau kalimat religi/inspiratif untuk tamu..."
          className={inputClass(!!state?.errors?.quoteText)}
        />
        {state?.errors?.quoteText && (
          <p className="mt-1 text-xs text-red-600">{state.errors.quoteText[0]}</p>
        )}

        <label
          htmlFor="quoteSource"
          className="mb-1.5 mt-4 block text-sm font-medium text-zinc-700"
        >
          Sumber kutipan
        </label>
        <input
          id="quoteSource"
          name="quoteSource"
          type="text"
          value={quoteSource}
          onChange={(e) => setQuoteSource(e.target.value)}
          placeholder="cth: QS. Ar-Rum: 21 atau fwds. Rm 12:9"
          className={inputClass(!!state?.errors?.quoteSource)}
        />
        {state?.errors?.quoteSource && (
          <p className="mt-1 text-xs text-red-600">{state.errors.quoteSource[0]}</p>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Save className="h-4 w-4" />
          {isPending ? "Menyimpan..." : "Simpan Pengaturan"}
        </button>

        <a
          href={`/u/${defaultSlug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-300 px-5 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
        >
          <Eye className="h-4 w-4" />
          Preview
        </a>

        <PublishButton
          invitationId={invitationId}
          isPublished={isPublished}
          disabled={isPending}
        />
      </div>
    </form>
  );
}