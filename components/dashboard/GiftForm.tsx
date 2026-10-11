"use client";

import { useActionState, useState } from "react";
import { Save, Eye, Plus, Trash2 } from "lucide-react";
import { saveGifts, GiftState } from "@/lib/actions/content";

type GiftItem = {
  id: string;
  provider?: string;
  name?: string;
  accountNumber?: string;
  holderName?: string;
};

export default function GiftForm({
  invitationId,
  defaultGifts,
}: {
  invitationId: string;
  defaultGifts: GiftItem[];
}) {
  const boundAction = saveGifts.bind(null, invitationId);
  const [state, formAction, isPending] = useActionState<GiftState | undefined, FormData>(
    boundAction,
    undefined,
  );
  const [items, setItems] = useState<GiftItem[]>(defaultGifts);

  function add() {
    setItems((prev) => [...prev, { id: crypto.randomUUID() }]);
  }
  function remove(id: string) {
    setItems((prev) => prev.filter((e) => e.id !== id));
  }

  const inputClass = (hasError?: boolean) =>
    `w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition focus:border-rose-400 focus:ring-2 focus:ring-rose-100 ${
      hasError ? "border-red-400" : "border-zinc-300"
    }`;

  return (
    <form action={formAction} className="space-y-6">
      {state?.message && (
        <div
          className={`rounded-lg px-4 py-3 text-sm ${
            state.success ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
          }`}
        >
          {state.message}
        </div>
      )}

      <div className="rounded-2xl border border-zinc-200 bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900">Kado Nikah</h2>
            <p className="text-sm text-zinc-500">
              Tambahkan rekening / e-wallet untuk menerima kado.
            </p>
          </div>
          <button
            type="button"
            onClick={add}
            className="inline-flex items-center gap-1.5 rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-100"
          >
            <Plus className="h-4 w-4" />
            Tambah Rekening
          </button>
        </div>

        {items.length === 0 && (
          <p className="rounded-lg bg-zinc-50 px-4 py-3 text-sm text-zinc-500">
            Belum ada rekening. Klik {`"Tambah Rekening"`} untuk menambahkan.
          </p>
        )}

        <div className="space-y-6">
          {items.map((item, index) => (
            <div key={item.id} className="rounded-xl border border-zinc-200 p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-medium text-zinc-700">Rekening {index + 1}</span>
                <button
                  type="button"
                  onClick={() => remove(item.id)}
                  className="rounded-md p-1.5 text-zinc-400 transition hover:bg-red-50 hover:text-red-600"
                  aria-label="Hapus rekening"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <input name="gift.id[]" type="hidden" value={item.id} />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <input
                    name="gift.provider[]"
                    type="text"
                    placeholder="Penyedia (cth: BCA / GoPay)"
                    defaultValue={item.provider ?? ""}
                    className={inputClass()}
                  />
                </div>
                <div>
                  <input
                    name="gift.name[]"
                    type="text"
                    placeholder="Nama produk (cth: Tabungan)"
                    defaultValue={item.name ?? ""}
                    className={inputClass()}
                  />
                </div>
                <div>
                  <input
                    name="gift.accountNumber[]"
                    type="text"
                    placeholder="Nomor rekening"
                    defaultValue={item.accountNumber ?? ""}
                    className={inputClass()}
                  />
                </div>
                <div>
                  <input
                    name="gift.holderName[]"
                    type="text"
                    placeholder="Atas nama"
                    defaultValue={item.holderName ?? ""}
                    className={inputClass()}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Save className="h-4 w-4" />
          {isPending ? "Menyimpan..." : "Simpan Kado Nikah"}
        </button>
        <a
          href="#"
          onClick={(e) => e.preventDefault()}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-300 px-5 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
        >
          <Eye className="h-4 w-4" />
          Preview
        </a>
      </div>
    </form>
  );
}
