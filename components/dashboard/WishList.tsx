"use client";

import Link from "next/link";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Trash2, MessageSquareHeart, Mail } from "lucide-react";
import { toggleHideWish, deleteWish } from "@/lib/actions/wish";

type WishRow = {
  id: string;
  guestName: string;
  message: string;
  isHidden: boolean;
  createdAt: string;
};

export default function WishList({
  wishes,
  visibleCount,
  hiddenCount,
  activeFilter,
}: {
  wishes: WishRow[];
  visibleCount: number;
  hiddenCount: number;
  activeFilter: "visible" | "hidden" | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const filterClass = (key: string | null, active: string | null) =>
    `rounded-lg px-3 py-1.5 text-sm font-medium transition ${
      active === key
        ? "bg-rose-600 text-white"
        : "bg-white text-zinc-600 hover:bg-zinc-50 border border-zinc-300"
    }`;

  function runToogle(id: string, hidden: boolean) {
    startTransition(async () => {
      try {
        await toggleHideWish(id, hidden);
        router.refresh();
      } catch {
        // error moderasi
      }
    });
  }

  function runDelete(id: string) {
    if (!confirm("Hapus ucapan ini?")) return;
    startTransition(async () => {
      try {
        await deleteWish(id);
        router.refresh();
      } catch {
        // error moderasi
      }
    });
  }

  function formatDate(iso: string) {
    try {
      return new Date(iso).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "";
    }
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white">
      <div className="flex flex-col gap-3 border-b border-zinc-200 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <Link
            href="/dashboard/ucapan"
            className={filterClass(null, activeFilter)}
          >
            Semua ({visibleCount + hiddenCount})
          </Link>
          <Link
            href="/dashboard/ucapan?filter=visible"
            className={filterClass("visible", activeFilter)}
          >
            Terlihat ({visibleCount})
          </Link>
          <Link
            href="/dashboard/ucapan?filter=hidden"
            className={filterClass("hidden", activeFilter)}
          >
            Tersembunyi ({hiddenCount})
          </Link>
        </div>
      </div>

      {wishes.length === 0 ? (
        <div className="p-10 text-center">
          <MessageSquareHeart className="mx-auto h-8 w-8 text-zinc-300" />
          <p className="mt-3 text-sm text-zinc-500">Belum ada ucapan di kategori ini.</p>
        </div>
      ) : (
        <div className="divide-y divide-zinc-100">
          {wishes.map((wish) => (
            <div
              key={wish.id}
              className={`flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between ${
                wish.isHidden ? "bg-zinc-50" : ""
              }`}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-zinc-900">{wish.guestName}</p>
                  {wish.isHidden && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                      <EyeOff className="h-3 w-3" />
                      Disembunyikan
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 text-xs text-zinc-400">
                    <Mail className="h-3 w-3" />
                    {formatDate(wish.createdAt)}
                  </span>
                </div>
                <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-600">
                  {wish.message}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => runToogle(wish.id, !wish.isHidden)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 px-2.5 py-1.5 text-xs font-medium text-zinc-600 transition hover:bg-zinc-50 disabled:opacity-50"
                >
                  {wish.isHidden ? (
                    <>
                      <Eye className="h-3.5 w-3.5" />
                      Tampilkan
                    </>
                  ) : (
                    <>
                      <EyeOff className="h-3.5 w-3.5" />
                      Sembunyikan
                    </>
                  )}
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => runDelete(wish.id)}
                  className="rounded-md p-2 text-zinc-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                  aria-label="Hapus ucapan"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}