"use client";

import Link from "next/link";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Users, Check, X, Clock, Mail, MailOpen, RefreshCw, Phone } from "lucide-react";
import { deleteGuest, updateGuestStatus } from "@/lib/actions/rsvp";
import { resendGuestInvitation } from "@/lib/actions/guest";

type GuestRow = {
  id: string;
  name: string;
  status: "PENDING" | "CONFIRMED" | "DECLINED";
  guestCount: number;
  message: string;
  submittedAt: string | null;
  email: string | null;
  phone: string | null;
  emailSent: boolean;
  lastSendError: string | null;
};

export default function GuestList({
  guests,
  activeFilter,
  totalCount,
  filterLabel,
  appUrl,
}: {
  guests: GuestRow[];
  activeFilter: "PENDING" | "CONFIRMED" | "DECLINED" | null;
  totalCount: number;
  filterLabel: string | null;
  appUrl: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const statusBadge = (status: GuestRow["status"]) => {
    const map = {
      PENDING: {
        cls: "bg-amber-50 text-amber-700 border-amber-200",
        icon: <Clock className="h-3.5 w-3.5" />,
        label: "Menunggu",
      },
      CONFIRMED: {
        cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
        icon: <Check className="h-3.5 w-3.5" />,
        label: "Hadir",
      },
      DECLINED: {
        cls: "bg-red-50 text-red-600 border-red-200",
        icon: <X className="h-3.5 w-3.5" />,
        label: "Berhalangan",
      },
    } as const;
    return map[status];
  };

  const filterClass = (key: string | null, active: string | null) =>
    `rounded-lg px-3 py-1.5 text-sm font-medium transition ${
      active === key
        ? "bg-rose-600 text-white"
        : "bg-white text-zinc-600 hover:bg-zinc-50 border border-zinc-300"
    }`;

  async function handleDelete(id: string) {
    if (!confirm("Hapus tamu ini?")) return;
    startTransition(async () => {
      await deleteGuest(id);
      router.refresh();
    });
  }

  async function handleResend(guest: GuestRow) {
    startTransition(async () => {
      const form = new FormData();
      form.set("appUrl", appUrl);
      await resendGuestInvitation(guest.id, form);
      router.refresh();
    });
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white">
      <div className="flex flex-col gap-3 border-b border-zinc-200 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <Link
            href="/dashboard/rsvp"
            className={filterClass("all", activeFilter === null ? "all" : null)}
          >
            Semua ({totalCount})
          </Link>
          <Link
            href="/dashboard/rsvp?status=CONFIRMED"
            className={filterClass("CONFIRMED", activeFilter)}
          >
            Hadir
          </Link>
          <Link
            href="/dashboard/rsvp?status=DECLINED"
            className={filterClass("DECLINED", activeFilter)}
          >
            Berhalangan
          </Link>
          <Link
            href="/dashboard/rsvp?status=PENDING"
            className={filterClass("PENDING", activeFilter)}
          >
            Menunggu
          </Link>
        </div>
      </div>

      {guests.length === 0 ? (
        <div className="p-10 text-center">
          <Users className="mx-auto h-8 w-8 text-zinc-300" />
          <p className="mt-3 text-sm text-zinc-500">
            {activeFilter
              ? `Belum ada tamu berstatus "${filterLabel}".`
              : "Belum ada tamu. Tambahkan tamu di menu Kirim Undangan."}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-zinc-100">
          {guests.map((guest) => {
            const badge = statusBadge(guest.status);
            return (
              <div
                key={guest.id}
                className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-medium text-zinc-900">{guest.name}</p>
                    <span
                      className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${badge.cls}`}
                    >
                      {badge.icon}
                      {badge.label}
                    </span>
                    {guest.guestCount > 0 && (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">
                        <Users className="h-3 w-3" />
                        {guest.guestCount} orang
                      </span>
                    )}
                  </div>
                  {guest.message && (
                    <p className="mt-1 truncate text-sm text-zinc-500">{guest.message}</p>
                  )}
                  {(guest.phone || guest.email) && (
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      {guest.phone && (
                        <span className="inline-flex items-center gap-1 text-xs text-zinc-400">
                          <Phone className="h-3 w-3" />
                          {guest.phone}
                        </span>
                      )}
                      {guest.email && (
                        <span className="inline-flex items-center gap-1 text-xs text-zinc-400">
                          <Mail className="h-3 w-3" />
                          {guest.email}
                        </span>
                      )}
                      {guest.email ? (
                        guest.emailSent ? (
                          <span
                            className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700"
                            title={
                              guest.lastSendError
                                ? `Gagal terakhir: ${guest.lastSendError}`
                                : "Email undangan telah dikirim"
                            }
                          >
                            <MailOpen className="h-3 w-3" />
                            Email terkirim
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                            <Mail className="h-3 w-3" />
                            Email belum dikirim
                          </span>
                        )
                      ) : null}
                      {guest.lastSendError && (
                        <span
                          className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600"
                          title={guest.lastSendError}
                        >
                          <X className="h-3 w-3" />
                          Gagal kirim
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  {guest.email && (
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleResend(guest)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-50"
                      title="Kirim ulang email undangan"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      Kirim Ulang
                    </button>
                  )}
                  <select
                    defaultValue={guest.status}
                    className="rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 text-sm text-zinc-700 outline-none focus:border-rose-400"
                    onChange={async (e) => {
                      const next = e.target.value as GuestRow["status"];
                      const form = new FormData();
                      form.set("status", next);
                      await updateGuestStatus(guest.id, form);
                      router.refresh();
                    }}
                  >
                    <option value="PENDING">Menunggu</option>
                    <option value="CONFIRMED">Hadir</option>
                    <option value="DECLINED">Berhalangan</option>
                  </select>

                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => handleDelete(guest.id)}
                    className="rounded-md p-2 text-zinc-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                    aria-label="Hapus tamu"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}