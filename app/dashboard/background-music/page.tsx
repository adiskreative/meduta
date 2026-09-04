import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import MusicForm from "@/components/dashboard/MusicForm";

export const metadata = { title: "Background Music | Meduta" };

export default async function BackgroundMusicPage() {
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
  const musicUrl = typeof data.musicUrl === "string" ? data.musicUrl : "";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Background Music</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Atur musik latar yang diputar saat undangan dibuka.
        </p>
      </div>

      <MusicForm invitationId={invitation.id} defaultMusicUrl={musicUrl} />
    </div>
  );
}
