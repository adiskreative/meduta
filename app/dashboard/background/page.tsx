import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import BackgroundForm from "@/components/dashboard/BackgroundForm";

export const metadata = { title: "Background Undangan | Meduta" };

export default async function BackgroundPage() {
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
  const backgroundUrl = typeof data.backgroundUrl === "string" ? data.backgroundUrl : "";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Background Undangan</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Ganti foto latar undangan sesuai selera Anda — bebas ganti kapan saja.
        </p>
      </div>

      <BackgroundForm invitationId={invitation.id} defaultBackgroundUrl={backgroundUrl} />
    </div>
  );
}

// Halaman membaca sesi & data DB — wajib dirender dinamis agar
// perubahan (dan sesi) selalu terbaru, tidak ter-cache statis.
export const dynamic = "force-dynamic";
