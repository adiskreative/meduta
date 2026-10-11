import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import EventInfoForm from "@/components/dashboard/EventInfoForm";

export const metadata = { title: "Informasi Acara | Meduta" };

type AdditionalEvent = {
  id: string;
  title?: string;
  date?: string;
  time?: string;
  location?: string;
  locationMap?: string;
};

export default async function InformasiAcaraPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

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

  const data = (invitation.data ?? {}) as Record<string, unknown>;
  const events = Array.isArray(data.events)
    ? (data.events as AdditionalEvent[])
    : [];

  const str = (key: string) =>
    typeof data[key] === "string" ? (data[key] as string) : "";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Informasi Acara</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Atur detail acara yang akan ditampilkan di undangan.
        </p>
      </div>

      <EventInfoForm
        invitationId={invitation.id}
        defaultEventDate={str("eventDate")}
        defaultEventTime={str("eventTime")}
        defaultVenueName={str("venueName")}
        defaultLocation={str("location")}
        defaultLocationMap={str("locationMap")}
        defaultEvents={events}
      />
    </div>
  );
}
// Halaman membaca sesi & data DB — wajib dirender dinamis agar
// perubahan (dan sesi) selalu terbaru, tidak ter-cache statis.
export const dynamic = "force-dynamic";
