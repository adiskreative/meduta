import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isPremiumUser } from "@/lib/premium";
import GalleryForm from "@/components/dashboard/GalleryForm";

export const metadata = { title: "Galeri | Meduta" };

type GalleryItem = { id: string; url?: string; caption?: string };

export default async function GaleriPage() {
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
  const gallery = Array.isArray(data.gallery) ? (data.gallery as GalleryItem[]) : [];
  const premium = await isPremiumUser(session.user.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Galeri</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Tambahkan foto-foto untuk galeri undangan Anda.
        </p>
      </div>

      <GalleryForm
        invitationId={invitation.id}
        defaultGallery={gallery}
        isPremium={premium}
      />
    </div>
  );
}

// Halaman membaca sesi & data DB — wajib dirender dinamis agar
// perubahan (dan sesi) selalu terbaru, tidak ter-cache statis.
export const dynamic = "force-dynamic";
