import type { WishItem } from "./types";

type Props = {
  wishes: WishItem[];
};

export default function WishList({ wishes }: Props) {
  if (!wishes || wishes.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-zinc-400">
        Belum ada ucapan. Jadilah yang pertama mengirim doa &amp; ucapan.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {wishes.map((w) => (
        <div key={w.id} className="rounded-2xl border border-zinc-200 bg-white p-4 text-left">
          <p className="text-sm font-semibold text-zinc-800">{w.guestName}</p>
          <p className="mt-1 whitespace-pre-line text-sm text-zinc-600">{w.message}</p>
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
