import type { WishItem } from "./types";

type Props = {
  wishes: WishItem[];
  /** kelas kartu, cth: "border-rose-100 bg-white" */
  cardClass?: string;
  /** kelas nama pengirim, cth: "text-rose-600" */
  nameClass?: string;
  /** kelas avatar inisial, cth: "bg-rose-500 text-white" */
  avatarClass?: string;
  /** kelas teks kosong */
  emptyClass?: string;
};

export default function WishList({
  wishes,
  cardClass = "border-zinc-200 bg-white",
  nameClass = "text-zinc-800",
  avatarClass = "bg-zinc-200 text-zinc-600",
  emptyClass = "text-zinc-400",
}: Props) {
  if (!wishes || wishes.length === 0) {
    return (
      <p className={`py-6 text-center text-sm ${emptyClass}`}>
        Belum ada ucapan. Jadilah yang pertama mengirim doa &amp; ucapan.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {wishes.map((w) => (
        <div
          key={w.id}
          className={`rounded-2xl border p-4 text-left shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md ${cardClass}`}
        >
          <div className="flex items-center gap-2.5">
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${avatarClass}`}
            >
              {w.guestName.charAt(0).toUpperCase()}
            </span>
            <p className={`text-sm font-semibold ${nameClass}`}>{w.guestName}</p>
          </div>
          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-zinc-600">
            {w.message}
          </p>
          <p className="mt-3 text-xs text-zinc-400">
            {new Date(w.createdAt).toLocaleDateString("id-ID", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
      ))}
    </div>
  );
}
