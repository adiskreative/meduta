import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import CoupleForm from "@/components/dashboard/CoupleForm";

export const metadata = { title: "Mempelai | Meduta" };

type Person = {
  name?: string;
  nickname?: string;
  childOf?: string;
  parentName?: string;
  bio?: string;
  instagram?: string;
  photoUrl?: string;
};

export default async function MempelaiPage() {
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
  const groom = (data.groom ?? {}) as Person;
  const bride = (data.bride ?? {}) as Person;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Mempelai</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Lengkapi data kedua mempelai untuk undangan Anda.
        </p>
      </div>

      <CoupleForm invitationId={invitation.id} groom={groom} bride={bride} />
    </div>
  );
}