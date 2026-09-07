import { redirect } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import GuestList from "@/components/dashboard/GuestList";
import { headers } from "next/headers";
import { resendAllPendingInvitations } from "@/lib/actions/guest";

export const metadata = { title: "RSVP | Meduta" };

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Menunggu",
  CONFIRMED: "Hadir",
  DECLINED: "Berhalangan",
};

export default async function RsvpPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { status } = await searchParams;

  const headerList = await headers();
  const protocol = headerList.get("x-forwarded-proto") ?? "http";
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host") ?? "localhost:3000";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? `${protocol}://${host}`;

  const invitation = await prisma.invitation.findFirst({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

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

  const allGuests = await prisma.guest.findMany({
    where: { invitationId: invitation.id },
    orderBy: { createdAt: "desc" },
  });

  const statusKey =
    status === "CONFIRMED" || status === "DECLINED" || status === "PENDING"
      ? (status as "PENDING" | "CONFIRMED" | "DECLINED")
      : null;

  const filtered = statusKey
    ? allGuests.filter((g) => g.rsvpStatus === statusKey)
    : allGuests;

  const counts = {
    all: allGuests.length,
    CONFIRMED: allGuests.filter((g) => g.rsvpStatus === "CONFIRMED").length,
    DECLINED: allGuests.filter((g) => g.rsvpStatus === "DECLINED").length,
    PENDING: allGuests.filter((g) => g.rsvpStatus === "PENDING").length,
  };

  const statusLabel = statusKey ? STATUS_LABEL[statusKey] : null;

  const pendingEmailCount = allGuests.filter(
    (g) => g.email && (!g.emailSent || g.lastSendError),
  ).length;

  return (
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">RSVP / Daftar Tamu</h1>
            <p className="mt-1 text-sm text-zinc-500">
              Pantau konfirmasi kehadiran tamu undangan Anda.
            </p>
          </div>
          {pendingEmailCount > 0 && (
            <form
              action={resendAllPendingInvitations.bind(null, invitation.id)}
              className="shrink-0"
            >
              <input type="hidden" name="appUrl" value={appUrl} />
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-lg border border-rose-300 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
              >
                <RefreshCw className="h-4 w-4" />
                Kirim Ulang Email ({pendingEmailCount})
              </button>
            </form>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="Total Tamu" value={counts.all} />
          <StatCard label="Hadir" value={counts.CONFIRMED} accent="text-emerald-600" />
          <StatCard label="Berhalangan" value={counts.DECLINED} accent="text-red-600" />
          <StatCard label="Menunggu" value={counts.PENDING} accent="text-amber-600" />
        </div>

        <GuestList
          guests={filtered.map((g) => ({
            id: g.id,
            name: g.name,
            status: (g.rsvpStatus ?? "PENDING") as "PENDING" | "CONFIRMED" | "DECLINED",
            guestCount: g.guestCount ?? 0,
            message: g.message ?? "",
            submittedAt: g.submittedAt?.toISOString() ?? null,
            email: g.email ?? null,
            phone: g.phone ?? null,
            emailSent: g.emailSent ?? false,
            lastSendError: g.lastSendError ?? null,
          }))}
          totalCount={counts.all}
          activeFilter={statusKey}
          filterLabel={statusLabel}
          appUrl={appUrl}
        />
      </div>
  );
}

function StatCard({
  label,
  value,
  accent = "text-zinc-900",
}: {
  label: string;
  value: number;
  accent?: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5">
      <p className="text-sm text-zinc-500">{label}</p>
      <p className={`mt-1 text-3xl font-bold ${accent}`}>{value}</p>
    </div>
  );
}