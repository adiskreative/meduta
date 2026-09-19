"use client";

import { useEffect, useActionState, useRef, useState } from "react";
import {
  Save,
  Copy,
  Check,
  Link2,
  Upload,
  FileSpreadsheet,
  Mail,
  Eye,
  X,
} from "lucide-react";
import {
  createGuests,
  GuestState,
  importGuests,
  ImportGuestState,
} from "@/lib/actions/guest";
import * as XLSX from "xlsx";

type Row = { name: string; email?: string };

type SavedGuest = {
  id: string;
  name: string;
  email?: string;
  uniqueLink: string;
};

export default function SendInvitationForm({
  invitationId,
  appUrl,
  savedGuests = [],
}: {
  invitationId: string;
  appUrl: string;
  /** Riwayat tamu dari DB — tampil persisten meski halaman di-refresh. */
  savedGuests?: SavedGuest[];
}) {
  const boundAction = createGuests.bind(null, invitationId);
  const [state, formAction, isPending] = useActionState<GuestState | undefined, FormData>(
    boundAction,
    undefined,
  );

  const boundImport = importGuests.bind(null, invitationId);
  const [importState, importAction, isImporting] = useActionState<
    ImportGuestState | undefined,
    FormData
  >(boundImport, undefined);

  const [namesText, setNamesText] = useState("");
  const [sendEmail, setSendEmail] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [importRows, setImportRows] = useState<Row[]>([]);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const inputClass = (hasError: boolean) =>
    `w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition focus:border-rose-400 focus:ring-2 focus:ring-rose-100 ${
      hasError ? "border-red-400" : "border-zinc-300"
    }`;

  // Setelah generate sukses: kosongkan area ketik (riwayat tetap tampil
  // di panel bawah, tersimpan di DB) + hapus baris import yang sudah dipakai.
  const lastSuccess = state?.success ?? importState?.success;
  useEffect(() => {
    if (lastSuccess) {
      setNamesText("");
      setImportRows([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastSuccess, state?.message, importState?.message]);

  async function copyLink(link: string) {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(link);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      // clipboard tidak tersedia
    }
  }

  async function handleFileImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportError(null);
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
        defval: "",
      });

      const rows: Row[] = json
        .map((raw) => {
          const nameRaw =
            raw["Nama"] ?? raw["nama"] ?? raw["Name"] ?? raw["name"] ?? raw["Tamu"];
          const emailRaw =
            raw["Email"] ?? raw["email"] ?? raw["E-mail"] ?? raw["Email Tamu"];
          return {
            name: String(nameRaw ?? "").trim(),
            email: emailRaw ? String(emailRaw).trim() : undefined,
          };
        })
        .filter((row) => row.name.length >= 2);

      if (rows.length === 0) {
        setImportError(
          "File tidak berisi kolom nama yang valid. Pastikan ada kolom 'Nama'.",
        );
        setImportRows([]);
        return;
      }

      setImportRows(rows);
      setNamesText(rows.map((r) => r.name).join("\n"));
    } catch {
      setImportError("Gagal membaca file. Pastikan format CSV/Excel valid.");
      setImportRows([]);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  const createdLinks = state?.createdGuests ?? importState?.createdGuests ?? [];
  const activeMessage = importState?.message ?? state?.message;
  const activeSuccess = state?.success ?? importState?.success;

  // Riwayat persisten: gabungan tamu tersimpan (DB) + yang barusan dibuat
  // (belum tentu ter-reload) — dedup berdasarkan uniqueLink.
  const seenLinks = new Set<string>();
  const allGuests = [...createdLinks.map((g) => ({
    id: g.uniqueLink + g.name,
    name: g.name,
    email: g.email,
    uniqueLink: g.uniqueLink,
  })), ...savedGuests].filter((g) => {
    if (seenLinks.has(g.uniqueLink)) return false;
    seenLinks.add(g.uniqueLink);
    return true;
  });

  return (
    <div className="space-y-6">
      {/* ====== Form nama per baris ====== */}
      <form action={formAction} className="space-y-6">
        <input type="hidden" name="appUrl" value={appUrl} />
        <input type="hidden" name="sendEmail" value={sendEmail ? "on" : "off"} />

        {activeMessage && (
          <div
            className={`rounded-lg px-4 py-3 text-sm ${
              activeSuccess ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
            }`}
          >
            {activeMessage}
          </div>
        )}

        <div className="rounded-2xl border border-zinc-200 bg-white p-6">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-zinc-900">
                Daftar Nama Tamu
              </h2>
              <p className="mt-1 text-sm text-zinc-500">
                Tulis satu nama per baris, atau impor dari file CSV/Excel.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-rose-300 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
              >
                <Upload className="h-4 w-4" />
                Import CSV/Excel
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv, .xlsx, .xls"
                className="hidden"
                onChange={handleFileImport}
              />
            </div>
          </div>

          {importError && (
            <div className="mb-3 flex items-start justify-between gap-3 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
              <span>{importError}</span>
              <button
                type="button"
                onClick={() => setImportError(null)}
                className="shrink-0"
                aria-label="Tutup"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {importRows.length > 0 && (
            <div className="mb-3 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              <FileSpreadsheet className="h-4 w-4 shrink-0" />
              <span>
                {importRows.length} baris dibaca dari file. Periksa kembali lalu
                klik <strong>Import Tamu</strong>.
              </span>
            </div>
          )}

          <label htmlFor="names" className="mb-1.5 block text-sm font-medium text-zinc-700">
            Nama tamu (pisahkan tiap baris)
          </label>
          <textarea
            id="names"
            name="names"
            rows={8}
            value={namesText}
            onChange={(e) => setNamesText(e.target.value)}
            placeholder={"cth:\nBapak Ahmad & Ibu Siti\nRizky Pratama\nSari Dewi"}
            className={inputClass(!!state?.errors?.names)}
          />
          {state?.errors?.names && (
            <p className="mt-1 text-xs text-red-600">{state.errors.names[0]}</p>
          )}

          <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm text-zinc-700">
            <input
              type="checkbox"
              checked={sendEmail}
              onChange={(e) => setSendEmail(e.target.checked)}
              className="h-4 w-4 rounded border-zinc-300 text-rose-600 accent-rose-600"
            />
            <Mail className="h-4 w-4 text-zinc-400" />
            Kirim email undangan ke tamu yang punya alamat email (jika email
            dikonfigurasi)
          </label>
          <p className="mt-1 text-xs text-zinc-400">
            Catatan: email hanya bisa dikirim untuk tamu dengan alamat email.
            Gunakan import CSV/Excel yang mendukung kolom Email untuk ini.
          </p>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {isPending ? "Membuat..." : "Generate Link Undangan"}
            </button>
          </div>
        </div>
      </form>

      {/* ====== Form import CSV/Excel ====== */}
      {importRows.length > 0 && (
        <form action={importAction} className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <input type="hidden" name="appUrl" value={appUrl} />
          <input
            type="hidden"
            name="sendEmail"
            value={sendEmail ? "on" : "off"}
          />
          <input
            type="hidden"
            name="rows"
            value={JSON.stringify(importRows)}
          />
          <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2 text-sm text-emerald-700">
              <FileSpreadsheet className="h-4 w-4 shrink-0" />
              <span>
                {importRows.length} baris siap diimpor. Periksa kembali daftar
                nama, lalu klik&nbsp;
                <strong>Import Tamu</strong>.
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setImportRows([]);
                  setNamesText("");
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 px-3 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100"
              >
                <X className="h-4 w-4" />
                Batal
              </button>
              <button
                type="submit"
                disabled={isImporting}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <FileSpreadsheet className="h-4 w-4" />
                {isImporting ? "Mengimpor..." : `Import ${importRows.length} Tamu`}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* ====== Riwayat tamu tersimpan (persisten di DB) ====== */}
      {allGuests.length > 0 && (
        <div className="rounded-2xl border border-zinc-200 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-zinc-900">
              <Link2 className="h-4 w-4" />
              Daftar Tamu &amp; Link Undangan ({allGuests.length})
            </h2>
            <p className="text-xs text-zinc-400">
              Tersimpan permanen — aman di-refresh
            </p>
          </div>
          <div className="space-y-2">
            {allGuests.map((guest) => {
              const full = `${appUrl}/u/${guest.uniqueLink}`;
              return (
                <div
                  key={guest.id}
                  className="flex flex-col gap-2 rounded-lg border border-zinc-200 p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-zinc-800">
                      {guest.name}
                    </p>
                    {guest.email && (
                      <p className="text-xs text-zinc-400">{guest.email}</p>
                    )}
                    <p className="truncate text-xs text-zinc-500">{full}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <a
                      href={full}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Buka
                    </a>
                    <button
                      type="button"
                      onClick={() => copyLink(full)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50"
                    >
                      {copied === full ? (
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                      {copied === full ? "Tersalin" : "Salin"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
