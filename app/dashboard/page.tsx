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
} from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getEventName } from "@/lib/invitation-data";
import CopyLinkButton from "@/components/dashboard/CopyLinkButton";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const headerList = await headers();
  const protocol = headerList.get("x-forwarded-proto") ?? "http";
  const host =
    headerList.get("x-forwarded-host") ??
    headerList.get("host") ??
    "localhost:3000";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? `${protocol}://${host}`;

  const invitation = await prisma.invitation.findFirst({
    where: { userId: session.user.id },
    include: {
      template: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

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
          className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700"
        >
          <Plus className="h-4 w-4" />
          Buat Undangan Baru
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
          value="Gratis"
          sub="Lihat paket berbayar"
        />
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-zinc-900">
          Undangan Anda
        </h2>

        {invitation ? (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium text-zinc-900">
                  {getEventName(invitation.data) ?? invitation.slug}
                </p>
                <p className="text-sm text-zinc-500">
                  Template: {invitation.template.name} •{" "}
                  <span
                    className={`font-medium ${
                      invitation.status === "published"
                        ? "text-emerald-600"
                        : "text-amber-600"
                    }`}
                  >
                    {invitation.status === "published" ? "Published" : "Draft"}
                  </span>
                </p>
                <p className="mt-1 truncate text-xs text-zinc-400">
                  {appUrl}/u/{invitation.slug}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <CopyLinkButton url={`${appUrl}/u/${invitation.slug}`} />
                <Link
                  href={`/u/${invitation.slug}`}
                  target="_blank"
                  className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
                >
                  <Eye className="h-4 w-4" />
                  Lihat Undangan
                </Link>
                <Link
                  href="/dashboard/pengaturan-umum"
                  className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800"
                >
                  Edit
                </Link>
              </div>
            </div>
            {invitation.status !== "published" && (
              <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700">
                Undangan masih berstatus <strong>Draft</strong>. Tamu hanya bisa
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
        ) : (
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