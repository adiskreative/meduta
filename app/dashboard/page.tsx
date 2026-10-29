import { redirect } from "next/navigation";
import Link from "next/link";
import { headers } from "next/headers";
import {
  FileText,
  ClipboardCheck,
  MessageCircleHeart,
  CalendarClock,
  Plus,
  Eye,
  House,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  isPremiumUser,
  PREMIUM_PRICE,
  PREMIUM_ORIGINAL_PRICE,
  FREE_ACTIVE_DAYS,
} from "@/lib/premium";
import { getActiveInvitationId } from "@/lib/invitations";
import { setActiveInvitation } from "@/lib/actions/template";
import { Clock } from "lucide-react";
import { getEventName } from "@/lib/invitation-data";
import CopyLinkButton from "@/components/dashboard/CopyLinkButton";
import DeleteInvitationButton from "@/components/dashboard/DeleteInvitationButton";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const headerList = await headers();
  const protocol = headerList.get("x-forwarded-proto") ?? "http";
  const host =
    headerList.get("x-forwarded-host") ??
    headerList.get("host") ??
    "meduta.my.id";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? `${protocol}://${host}`;

  const activeId = await getActiveInvitationId(session.user.id);
  const invitations = await prisma.invitation.findMany({
    where: { userId: session.user.id },
    include: {
      template: { select: { name: true, isPremium: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  const invitation = invitations.find((inv) => inv.id === activeId) ?? invitations[0] ?? null;

  const premiumAccess = await isPremiumUser(session.user.id);

  // Premium per-undangan: undangan yang belum dibayar tetap menunggu pembayaran
  const needsInvitationPayment =
    invitation !== null &&
    invitation.template.isPremium &&
    !invitation.isPremium &&
    !premiumAccess;

  // Sisa masa aktif (hari, dibulatkan ke atas); null = premium/tanpa batas
  const expiresAt = invitation?.expiresAt ? new Date(invitation.expiresAt) : null;
  const currentTime = new Date().getTime();
  const daysLeft =
    expiresAt && !premiumAccess && !invitation?.isPremium
      ? Math.max(
          0,
          Math.ceil((expiresAt.getTime() - currentTime) / 86400000),
        )
      : null;

  const [rsvpCount, wishCount] = await Promise.all([
    invitation
      ? prisma.guest.count({
          where: {
            invitationId: invitation.id,
            rsvpStatus: { not: null },
          },
        })
      : Promise.resolve(0),
    invitation
      ? prisma.wish.count({ where: { invitationId: invitation.id } })
      : Promise.resolve(0),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">
            Halo, {session.user.name?.split(" ")[0] ?? "Selamat datang"} 👋
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Kelola undangan digital Anda dari sini.
          </p>
        </div>
        <Link
          href="/dashboard/pilih-tema"
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700 sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          Buat Undangan Baru
        </Link>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
        >
          <House className="h-4 w-4" />
          Ke Beranda
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatusCard
          icon={FileText}
          label="Status Undangan"
          value={invitation ? "Terkonfigurasi" : "Belum dibuat"}
          sub={invitation?.template.name ?? "Pilih template untuk mulai"}
        />
        <StatusCard
          icon={ClipboardCheck}
          label="RSVP Masuk"
          value={String(rsvpCount)}
          sub="Tamu yang sudah konfirmasi"
        />
        <StatusCard
          icon={MessageCircleHeart}
          label="Total Ucapan"
          value={String(wishCount)}
          sub="Doa & ucapan dari tamu"
        />
        <StatusCard
          icon={CalendarClock}
          label="Status Paket"
          value={premiumAccess || invitation?.isPremium ? "Premium" : "Gratis"}
          sub={
            premiumAccess || invitation?.isPremium
              ? "Semua fitur aktif"
              : "Upgrade untuk fitur penuh"
          }
        />
      </div>

      {/* Banner pembayaran premium undangan yang belum diselesaikan */}
      {needsInvitationPayment && invitation && (
        <div className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center sm:gap-3">
          <Clock className="h-5 w-5 shrink-0 text-amber-500" />
          <p className="text-sm text-amber-800">
            Undangan ini memakai template premium <strong>{invitation.template.name}</strong>{" "}
            dan belum diaktivasi, tamu belum bisa melihatnya sampai pembayaran selesai.
          </p>
          <Link
            href={`/dashboard/upgrade?undangan=${invitation.id}`}
            className="inline-flex shrink-0 items-center justify-center rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-amber-950 transition hover:bg-amber-600 hover:text-white"
          >
            Selesaikan Pembayaran
          </Link>
        </div>
      )}

      {/* Banner masa aktif untuk akun gratis */}
      {!premiumAccess && invitation && (
        <div
          className={`flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:gap-3 ${
            daysLeft !== null && daysLeft <= 5
              ? "border-red-200 bg-red-50"
              : "border-zinc-200 bg-white"
          }`}
        >
          <Clock
            className={`h-5 w-5 shrink-0 ${
              daysLeft !== null && daysLeft <= 5 ? "text-red-500" : "text-zinc-400"
            }`}
          />
          <p className="text-sm text-zinc-700">
            {daysLeft !== null && daysLeft <= 5
              ? `Segera berakhir: undangan Anda aktif ${daysLeft} hari lagi (paket Gratis = ${FREE_ACTIVE_DAYS} hari).`
              : `Masa aktif undangan Anda ${daysLeft ?? FREE_ACTIVE_DAYS} hari lagi (paket Gratis = ${FREE_ACTIVE_DAYS} hari).`}{" "}
            <Link
              href="/dashboard/upgrade"
              className="font-semibold text-rose-600 hover:underline"
            >
              Upgrade Premium | aktif 1 tahun
            </Link>
          </p>
        </div>
      )}

      {!premiumAccess && (
        <div className="flex flex-col gap-4 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-white p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold text-zinc-900">
              Buka semua template premium 👑
            </p>
            <p className="mt-1 text-sm text-zinc-600">
              <span className="text-zinc-400 line-through">
                Rp{PREMIUM_ORIGINAL_PRICE.toLocaleString("id-ID")}
              </span>{" "}
              <span className="font-bold text-rose-600">
                Rp{PREMIUM_PRICE.toLocaleString("id-ID")}
              </span>{" "}
              / 1 tahun - bebas ganti template & tanpa watermark.
            </p>
          </div>
          <Link
            href="/dashboard/upgrade"
            className="inline-flex shrink-0 items-center justify-center rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-semibold text-amber-950 transition hover:bg-amber-600 hover:text-white"
          >
            Upgrade Sekarang
          </Link>
        </div>
      )}

      <div className="rounded-2xl border border-zinc-200 bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-900">
            Undangan Anda {invitations.length > 0 && `(${invitations.length})`}
          </h2>
          <Link
            href="/dashboard/pilih-tema"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-rose-600 hover:underline"
          >
            <Plus className="h-4 w-4" />
            Buat baru
          </Link>
        </div>

        {invitations.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <FileText className="h-10 w-10 text-zinc-300" />
            <p className="text-sm text-zinc-500">
              Anda belum punya undangan. Mulai dengan memilih template!
            </p>
            <Link
              href="/dashboard/pilih-tema"
              className="mt-1 inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700"
            >
              <Plus className="h-4 w-4" />
              Pilih Template
            </Link>
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-zinc-100">
            {invitations.map((inv) => {
              const isActiveInv = inv.id === invitation?.id;
              const invNeedsPayment =
                inv.template.isPremium && !inv.isPremium && !premiumAccess;
              return (
                <div key={inv.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2 font-medium text-zinc-900">
                      {getEventName(inv.data) ?? inv.slug}
                      {isActiveInv && (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                          Aktif
                        </span>
                      )}
                      {inv.template.isPremium && (
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                            inv.isPremium || premiumAccess
                              ? "bg-amber-100 text-amber-800"
                              : "bg-zinc-100 text-zinc-500"
                          }`}
                        >
                          {inv.isPremium || premiumAccess ? "Premium" : "Premium (belum bayar)"}
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-zinc-500">
                      Template: {inv.template.name} •{" "}
                      <span
                        className={`font-medium ${
                          inv.status === "published"
                            ? "text-emerald-600"
                            : "text-amber-600"
                        }`}
                      >
                        {inv.status === "published" ? "Published" : "Draft"}
                      </span>
                    </p>
                    <p className="mt-1 truncate text-xs text-zinc-400">
                      {appUrl}/u/{inv.slug}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {invNeedsPayment ? (
                      <Link
                        href={`/dashboard/upgrade?undangan=${inv.id}`}
                        className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-amber-950 transition hover:bg-amber-600 hover:text-white"
                      >
                        Bayar &amp; Aktifkan
                      </Link>
                    ) : (
                      <form action={setActiveInvitation.bind(null, inv.id)}>
                        <button
                          type="submit"
                          disabled={isActiveInv}
                          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-400"
                        >
                          {isActiveInv ? "Sedang Diedit" : "Kelola"}
                        </button>
                      </form>
                    )}
                    <CopyLinkButton url={`${appUrl}/u/${inv.slug}`} />
                    <Link
                      href={`/u/${inv.slug}`}
                      target="_blank"
                      className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
                    >
                      <Eye className="h-4 w-4" />
                      Lihat
                    </Link>
                    <DeleteInvitationButton
                      invitationId={inv.id}
                      eventName={getEventName(inv.data)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {invitation && invitation.status !== "published" && (
          <p className="mt-2 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700">
            Undangan aktif masih berstatus <strong>Draft</strong>. Tamu hanya bisa
            melihatnya setelah Anda{" "}
            <Link
              href="/dashboard/pengaturan-umum"
              className="font-semibold underline"
            >
              publish
            </Link>{" "}
            di Pengaturan Umum.
          </p>
        )}
      </div>
    </div>
  );
}

function StatusCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="mt-0.5 text-xl font-bold text-zinc-900">{value}</p>
      <p className="mt-1 text-xs text-zinc-400">{sub}</p>
    </div>
  );
}
// Halaman membaca sesi & data DB — wajib dirender dinamis agar
// perubahan (dan sesi) selalu terbaru, tidak ter-cache statis.
export const dynamic = "force-dynamic";
