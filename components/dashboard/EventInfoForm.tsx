"use client";

import { useActionState, useState } from "react";
import { Save, Eye, Plus, Trash2, MapPin } from "lucide-react";
import { saveEventInfo, EventState } from "@/lib/actions/event";

type AdditionalEvent = {
  id: string;
  title?: string;
  date?: string;
  time?: string;
  location?: string;
  locationMap?: string;
};

export default function EventInfoForm({
  invitationId,
  defaultEventDate,
  defaultEventTime,
  defaultVenueName,
  defaultLocation,
  defaultLocationMap,
  defaultEvents,
}: {
  invitationId: string;
  defaultEventDate: string;
  defaultEventTime: string;
  defaultVenueName: string;
  defaultLocation: string;
  defaultLocationMap: string;
  defaultEvents: AdditionalEvent[];
}) {
  const boundAction = saveEventInfo.bind(null, invitationId);
  const [state, formAction, isPending] = useActionState<EventState | undefined, FormData>(
    boundAction,
    undefined,
  );
  const [events, setEvents] = useState<AdditionalEvent[]>(defaultEvents);

  function addEvent() {
    setEvents((prev) => [...prev, { id: crypto.randomUUID() }]);
  }

  function removeEvent(id: string) {
    setEvents((prev) => prev.filter((e) => e.id !== id));
  }

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
        <h2 className="mb-4 text-lg font-semibold text-zinc-900">Acara Utama</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="eventDate" className="mb-1.5 block text-sm font-medium text-zinc-700">
              Tanggal acara
            </label>
            <input
              id="eventDate"
              name="eventDate"
              type="date"
              defaultValue={defaultEventDate}
              className={inputClass(!!state?.errors?.eventDate)}
            />
            {state?.errors?.eventDate && (
              <p className="mt-1 text-xs text-red-600">{state.errors.eventDate[0]}</p>
            )}
          </div>
          <div>
            <label htmlFor="eventTime" className="mb-1.5 block text-sm font-medium text-zinc-700">
              Jam acara
            </label>
            <input
              id="eventTime"
              name="eventTime"
              type="time"
              defaultValue={defaultEventTime}
              className={inputClass(!!state?.errors?.eventTime)}
            />
            {state?.errors?.eventTime && (
              <p className="mt-1 text-xs text-red-600">{state.errors.eventTime[0]}</p>
            )}
          </div>
        </div>

        <div className="mt-4">
          <label htmlFor="venueName" className="mb-1.5 block text-sm font-medium text-zinc-700">
            Nama tempat / venue
          </label>
          <input
            id="venueName"
            name="venueName"
            type="text"
            defaultValue={defaultVenueName}
            placeholder="cth: Hotel Grand Ballroom"
            className={inputClass(!!state?.errors?.venueName)}
          />
          {state?.errors?.venueName && (
            <p className="mt-1 text-xs text-red-600">{state.errors.venueName[0]}</p>
          )}
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="location" className="mb-1.5 block text-sm font-medium text-zinc-700">
              Alamat lokasi
            </label>
            <textarea
              id="location"
              name="location"
              rows={2}
              defaultValue={defaultLocation}
              placeholder="Nama jalan, kota, dsb."
              className={inputClass(!!state?.errors?.location)}
            />
            {state?.errors?.location && (
              <p className="mt-1 text-xs text-red-600">{state.errors.location[0]}</p>
            )}
          </div>
          <div>
            <label htmlFor="locationMap" className="mb-1.5 block text-sm font-medium text-zinc-700">
              Link Google Maps (embed/iframe)
            </label>
            <input
              id="locationMap"
              name="locationMap"
              type="text"
              defaultValue={defaultLocationMap}
              placeholder="https://maps.google.com/..."
              className={inputClass(!!state?.errors?.locationMap)}
            />
            {state?.errors?.locationMap && (
              <p className="mt-1 text-xs text-red-600">{state.errors.locationMap[0]}</p>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900">Acara Tambahan</h2>
            <p className="text-sm text-zinc-500">
              Tambahkan lebih dari satu acara (akad, resepsi, dll).
            </p>
          </div>
          <button
            type="button"
            onClick={addEvent}
            className="inline-flex items-center gap-1.5 rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-100"
          >
            <Plus className="h-4 w-4" />
            Tambah Acara
          </button>
        </div>

        <div className="space-y-6">
          {events.length === 0 && (
            <p className="rounded-lg bg-zinc-50 px-4 py-3 text-sm text-zinc-500">
              Belum ada acara tambahan. Klik {`"Tambah Acara"`} untuk menambahkan.
            </p>
          )}

          {events.map((event, index) => (
            <div
              key={event.id}
              className="rounded-xl border border-zinc-200 p-4"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-medium text-zinc-700">
                  Acara {index + 1}
                </span>
                <button
                  type="button"
                  onClick={() => removeEvent(event.id)}
                  className="rounded-md p-1.5 text-zinc-400 transition hover:bg-red-50 hover:text-red-600"
                  aria-label="Hapus acara"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <input
                    name="addlEvent.title[]"
                    type="text"
                    placeholder="Nama acara (cth: Akad)"
                    defaultValue={event.title ?? ""}
                    className={inputClass(false)}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-500">
                    Tanggal
                  </label>
                  <input
                    name="addlEvent.date[]"
                    type="date"
                    defaultValue={event.date ?? ""}
                    className={inputClass(false)}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-500">
                    Jam
                  </label>
                  <input
                    name="addlEvent.time[]"
                    type="time"
                    defaultValue={event.time ?? ""}
                    className={inputClass(false)}
                  />
                </div>
                <div className="sm:col-span-2 flex gap-2">
                  <MapPin className="mt-2.5 h-4 w-4 shrink-0 text-zinc-400" />
                  <input
                    name="addlEvent.location[]"
                    type="text"
                    placeholder="Lokasi acara"
                    defaultValue={event.location ?? ""}
                    className={inputClass(false)}
                  />
                </div>
                <div className="sm:col-span-2">
                  <input
                    name="addlEvent.locationMap[]"
                    type="text"
                    placeholder="Link Google Maps (opsional)"
                    defaultValue={event.locationMap ?? ""}
                    className={inputClass(false)}
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
          {isPending ? "Menyimpan..." : "Simpan Informasi Acara"}
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