import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AccountForm from "@/components/dashboard/AccountForm";

export const metadata = { title: "Pengaturan Akun | Meduta" };

export default async function AkunPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Pengaturan Akun</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Kelola nama, email, dan password akun Anda.
        </p>
      </div>

      <AccountForm
        defaultName={user?.name ?? ""}
        defaultEmail={user?.email ?? session.user.email ?? ""}
        hasPassword={!!user?.password}
      />
    </div>
  );
}
