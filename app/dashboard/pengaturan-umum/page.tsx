import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getEventName } from "@/lib/invitation-data";
import GeneralSettingsForm from "@/components/dashboard/GeneralSettingsForm";

export const metadata = { title: "Pengaturan Umum | Meduta" };

export default async function PengaturanUmumPage() {
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

  const data = invitation.data as Record<string, unknown> | null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Pengaturan Umum</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Atur nama acara, link undangan, dan pesan untuk tamu.
        </p>
      </div>

      <GeneralSettingsForm
        invitationId={invitation.id}
        defaultEventName={getEventName(invitation.data) ?? ""}
        defaultSlug={invitation.slug}
        slugChangeCount={invitation.slugChangeCount}
        defaultCustomMessage={
          typeof data?.customMessage === "string" ? data.customMessage : ""
        }
        isPublished={invitation.status === "published"}
      />
    </div>
  );
}