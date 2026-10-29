import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getActiveInvitation } from "@/lib/invitations";
import { prisma } from "@/lib/prisma";
import WishList from "@/components/dashboard/WishList";

export const metadata = { title: "Ucapan | Meduta" };

export default async function UcapanPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { filter } = await searchParams;

  const invitation = await getActiveInvitation(session.user.id);

  if (!invitation) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center">
        <p className="text-sm text-zinc-500">
          Anda belum punya undangan. Mulai dengan{" "}
          <a href="/dashboard/pilih-tema" className="font-medium text-rose-600">
            memilih template
          </a>
          .
        </p>
      </div>
    );
  }

  const allWishes = await prisma.wish.findMany({
    where: { invitationId: invitation.id },
    orderBy: { createdAt: "desc" },
  });

  const filterMode = filter === "hidden" || filter === "visible" ? filter : null;
  const wishes = filterMode
    ? allWishes.filter((w) => (filterMode === "hidden" ? w.isHidden : !w.isHidden))
    : allWishes;

  const visibleCount = allWishes.filter((w) => !w.isHidden).length;
  const hiddenCount = allWishes.length - visibleCount;

  const compactWishes = wishes.map((w) => ({
    id: w.id,
    guestName: w.guestName,
    message: w.message,
    isHidden: w.isHidden,
    createdAt: w.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Ucapan &amp; Doa</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Kelola ucapan tamu yang masuk di Wedding Wall.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5">
          <p className="text-sm text-zinc-500">Total Ucapan</p>
          <p className="mt-1 text-3xl font-bold text-zinc-900">{allWishes.length}</p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-5">
          <p className="text-sm text-zinc-500">Terlihat</p>
          <p className="mt-1 text-3xl font-bold text-emerald-600">{visibleCount}</p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-5">
          <p className="text-sm text-zinc-500">Tersembunyi</p>
          <p className="mt-1 text-3xl font-bold text-amber-600">{hiddenCount}</p>
        </div>
      </div>

      <WishList
        wishes={compactWishes}
        visibleCount={visibleCount}
        hiddenCount={hiddenCount}
        activeFilter={filterMode}
      />
    </div>
  );
}
// Halaman membaca sesi & data DB — wajib dirender dinamis agar
// perubahan (dan sesi) selalu terbaru, tidak ter-cache statis.
export const dynamic = "force-dynamic";
