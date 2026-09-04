import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import GiftForm from "@/components/dashboard/GiftForm";

export const metadata = { title: "Kado Nikah | Meduta" };

type GiftItem = {
  id: string;
  provider?: string;
  name?: string;
  accountNumber?: string;
  holderName?: string;
};

export default async function KadoNikahPage() {
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
  const gifts = Array.isArray(data.gifts) ? (data.gifts as GiftItem[]) : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Kado Nikah</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Atur rekening atau e-wallet untuk menerima kado dari tamu.
        </p>
      </div>

      <GiftForm invitationId={invitation.id} defaultGifts={gifts} />
    </div>
  );
}
