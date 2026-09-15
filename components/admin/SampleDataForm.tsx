"use client";

import { useActionState } from "react";
import { Save, RotateCcw, Loader2 } from "lucide-react";
import {
  updateSampleData,
  SampleDataState,
} from "@/lib/actions/admin-template";
import SamplePhotoUploader from "./SamplePhotoUploader";
import type { InvitationView } from "@/components/templates/types";

type Defaults = Pick<
  InvitationView,
  | "eventName"
  | "eventDate"
  | "eventTime"
  | "venueName"
  | "location"
  | "locationMap"
  | "customMessage"
>;

/**
 * Form Data Contoh template. Placeholder memperlihatkan nilai bawaan
 * sistem; kolom dikosongkan = pakai bawaan. Saat mengedit, nilai override
 * yang tersimpan dimuat sebagai defaultValue (props value override > default).
 */
export default function SampleDataForm({
  templateId,
  defaults,
  overrides,
  resetAction,
}: {
  templateId: string;
  defaults: Defaults & {
    groom?: { name?: string; nickname?: string; parentName?: string; bio?: string; photoUrl?: string };
    bride?: { name?: string; nickname?: string; parentName?: string; bio?: string; photoUrl?: string };
    gifts?: Array<{ provider: string; accountNumber: string; holderName: string }>;
  };
  overrides: Record<string, unknown>;
  resetAction: (templateId: string) => Promise<void>;
}) {
  const action = updateSampleData.bind(null, templateId);
  const [state, formAction, isPending] = useActionState<
    SampleDataState | undefined,
    FormData
  >(action, undefined);

  // Nilai terisi: override yang tersimpan, kalau tidak ada pakai bawaan
  const v = (path: string, fallback = ""): string => {
    const keys = path.split(".");
    let cur: unknown = overrides;
    for (const k of keys) {
      if (cur && typeof cur === "object" && k in (cur as Record<string, unknown>)) {
        cur = (cur as Record<string, unknown>)[k];
      } else {
        cur = undefined;
        break;
      }
    }
    return typeof cur === "string" ? cur : fallback;
  };

  const inputClass = (hasError: boolean) =>
    `w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition focus:border-rose-400 focus:ring-2 focus:ring-rose-100 ${
      hasError ? "border-red-400" : "border-zinc-300"
    }`;

  // Fungsi biasa (bukan komponen) agar JSX inline — input tidak remount
  // saat state berubah sehingga teks yang diketik tidak hilang.
  const field = ({
    label,
    name,
    path,
    placeholder,
    type = "text",
    area = false,
  }: {
    label: string;
    name: string;
    path: string;
    placeholder: string;
    type?: string;
    area?: boolean;
  }) => (
    <div>
      <label
        htmlFor={name}
        className="mb-1.5 block text-sm font-medium text-zinc-700"
      >
        {label}
      </label>
      {area ? (
        <textarea
          id={name}
          name={name}
          rows={3}
          defaultValue={v(path)}
          placeholder={placeholder}
          className={inputClass(!!state?.errors?.[name])}
        />
      ) : (
        <input
          id={name}
          name={name}
          type={type}
          defaultValue={v(path)}
          placeholder={placeholder}
          className={inputClass(!!state?.errors?.[name])}
        />
      )}
      {state?.errors?.[name] && (
        <p className="mt-1 text-xs text-red-600">{state.errors[name][0]}</p>
      )}
      <p className="mt-1 text-xs text-zinc-400">
        Bawaan: <span className="italic">{placeholder}</span>
      </p>
    </div>
  );

  return (
    <form action={formAction} className="space-y-6">
      {state?.message && (
        <div
          className={`rounded-lg px-4 py-3 text-sm ${
            state.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
          }`}
        >
          {state.message}
        </div>
      )}

      <div className="rounded-2xl border border-zinc-200 bg-white p-6">
        <h2 className="mb-1 text-lg font-semibold text-zinc-900">
          Mempelai Contoh
        </h2>
        <p className="mb-4 text-xs text-zinc-400">
          Foto bisa diunggah langsung dari perangkat — URL terisi otomatis.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {field({ label: "Nama pria (lengkap)", name: "sample.groom.name", path: "groom.name", placeholder: defaults.groom?.name ?? "" })}
          {field({ label: "Nama panggilan pria", name: "sample.groom.nickname", path: "groom.nickname", placeholder: defaults.groom?.nickname ?? "" })}
          {field({ label: "Orang tua pria", name: "sample.groom.parentName", path: "groom.parentName", placeholder: defaults.groom?.parentName ?? "" })}
          {field({ label: "Bio pria", name: "sample.groom.bio", path: "groom.bio", placeholder: defaults.groom?.bio ?? "" })}
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <input
              type="hidden"
              id="sample.groom.photoUrl"
              name="sample.groom.photoUrl"
              defaultValue={v("groom.photoUrl")}
            />
            <SamplePhotoUploader
              fieldId="sample.groom.photoUrl"
              currentUrl={v("groom.photoUrl") || defaults.groom?.photoUrl}
            />
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {field({ label: "Nama wanita (lengkap)", name: "sample.bride.name", path: "bride.name", placeholder: defaults.bride?.name ?? "" })}
          {field({ label: "Nama panggilan wanita", name: "sample.bride.nickname", path: "bride.nickname", placeholder: defaults.bride?.nickname ?? "" })}
          {field({ label: "Orang tua wanita", name: "sample.bride.parentName", path: "bride.parentName", placeholder: defaults.bride?.parentName ?? "" })}
          {field({ label: "Bio wanita", name: "sample.bride.bio", path: "bride.bio", placeholder: defaults.bride?.bio ?? "" })}
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <input
              type="hidden"
              id="sample.bride.photoUrl"
              name="sample.bride.photoUrl"
              defaultValue={v("bride.photoUrl")}
            />
            <SamplePhotoUploader
              fieldId="sample.bride.photoUrl"
              currentUrl={v("bride.photoUrl") || defaults.bride?.photoUrl}
            />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-zinc-900">
          Acara Utama
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {field({ label: "Nama acara", name: "sample.eventName", path: "eventName", placeholder: defaults.eventName ?? "" })}
          {field({ label: "Tanggal", name: "sample.eventDate", path: "eventDate", placeholder: defaults.eventDate ?? "" })}
          {field({ label: "Jam", name: "sample.eventTime", path: "eventTime", placeholder: defaults.eventTime ?? "" })}
          {field({ label: "Nama gedung/venue", name: "sample.venueName", path: "venueName", placeholder: defaults.venueName ?? "" })}
          {field({ label: "Alamat", name: "sample.location", path: "location", placeholder: defaults.location ?? "" })}
          {field({ label: "URL Google Maps", name: "sample.locationMap", path: "locationMap", placeholder: defaults.locationMap ?? "", type: "url" })}
        </div>
        <div className="mt-4">
          {field({ label: "Pesan pembuka", name: "sample.customMessage", path: "customMessage", placeholder: defaults.customMessage ?? "", area: true })}
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-6">
        <h2 className="mb-1 text-lg font-semibold text-zinc-900">
          Tamu &amp; Rekening Contoh
        </h2>
        <p className="mb-4 text-xs text-zinc-400">
          Kartu &quot;Kepada Yth.&quot; di gerbang/cover &amp; kartu kado pertama.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {field({ label: "Nama tamu (Kepada Yth.)", name: "sample.guestName", path: "guestName", placeholder: "Bapak Ahmad & Ibu Siti" })}
          {field({ label: "Bank rekening", name: "sample.giftProvider", path: "gifts.0.provider", placeholder: defaults.gifts?.[0]?.provider ?? "" })}
          {field({ label: "No. rekening", name: "sample.giftAccountNumber", path: "gifts.0.accountNumber", placeholder: defaults.gifts?.[0]?.accountNumber ?? "" })}
          {field({ label: "Atas nama", name: "sample.giftHolderName", path: "gifts.0.holderName", placeholder: defaults.gifts?.[0]?.holderName ?? "" })}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {isPending ? "Menyimpan..." : "Simpan Data Contoh"}
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => {
            if (confirm("Kembalikan semua data contoh template ini ke bawaan sistem?")) {
              resetAction(templateId).then(() => window.location.reload());
            }
          }}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-300 px-5 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-60"
        >
          <RotateCcw className="h-4 w-4" />
          Reset ke Bawaan
        </button>
      </div>
    </form>
  );
}
