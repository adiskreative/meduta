import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import SendInvitationForm from "@/components/dashboard/SendInvitationForm";
import WhatsAppShareForm from "@/components/dashboard/WhatsAppShareForm";

export const metadata = { title: "Kirim Undangan | Meduta" };

export default async function KirimUndanganPage() {
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

  const headerList = await headers();
  const host = headerList.get("host") ?? "localhost:3111";
  const protocol = host.includes("localhost") ? "http" : "https";
  const appUrl = `${protocol}://${host}`;

  // Riwayat tamu tersimpan — tampil terus meski halaman di-refresh,
  // sehingga user tidak pernah kehilangan link undangan tamunya.
  const guests = await prisma.guest.findMany({
    where: { invitationId: invitation.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, email: true, uniqueLink: true },
    take: 500,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Kirim Undangan</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Masukkan daftar tamu untuk membuat link undangan pribadi yang bisa Anda bagikan.
        </p>
      </div>

      <div className="space-y-6">
        <WhatsAppShareForm
          invitationId={invitation.id}
          invitationSlug={invitation.slug}
          appUrl={appUrl}
        />

        <SendInvitationForm
          invitationId={invitation.id}
          appUrl={appUrl}
          savedGuests={guests.map((g) => ({
            id: g.id,
            name: g.name,
            email: g.email ?? undefined,
            uniqueLink: g.uniqueLink,
          }))}
        />
      </div>
    </div>
  );
}
// Halaman membaca sesi & data DB — wajib dirender dinamis agar
// perubahan (dan sesi) selalu terbaru, tidak ter-cache statis.
export const dynamic = "force-dynamic";
