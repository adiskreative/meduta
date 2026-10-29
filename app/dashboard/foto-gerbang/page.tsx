import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getActiveInvitationId } from "@/lib/invitations";
import GatePhotoForm from "@/components/dashboard/GatePhotoForm";
import { getGatePhotoUrl, mapDecorations } from "@/lib/decoration";

export const metadata = { title: "Foto Gerbang | Meduta" };

type GalleryItem = { id: string; url: string; caption?: string };

export default async function FotoGerbangPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const activeId = await getActiveInvitationId(session.user.id);
  const invitation = activeId
    ? await prisma.invitation.findFirst({
        where: { id: activeId },
        include: { template: { include: { decorations: { include: { asset: true } } } } },
      })
    : null;

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
  const groom = (data.groom ?? {}) as { photoUrl?: string };
  const bride = (data.bride ?? {}) as { photoUrl?: string };

  const decorations = mapDecorations(invitation.template.decorations);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Foto Gerbang</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Atur foto khusus halaman &quot;Buka Undangan&quot; undangan Anda.
        </p>
      </div>

      <GatePhotoForm
        invitationId={invitation.id}
        defaultGatePhoto={
          typeof data.gatePhotoUrl === "string"
            ? (data.gatePhotoUrl as string)
            : undefined
        }
        groomPhoto={groom.photoUrl}
        bridePhoto={bride.photoUrl}
        firstGallery={gallery[0]?.url}
      />

      {/* Catatan prioritas untuk user */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6">
        <h2 className="mb-3 text-sm font-semibold text-zinc-900">
          Urutan foto otomatis (bila Anda tidak mengunggah)
        </h2>
        <ol className="space-y-2 text-sm text-zinc-600">
          <li>
            <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-rose-100 text-xs font-bold text-rose-700">
              1
            </span>
            Foto gerbang pilihan admin/dekorasi template
            {getGatePhotoUrl(decorations) ? " — sudah ditetapkan" : " - belum ada"}
          </li>
          <li>
            <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-rose-100 text-xs font-bold text-rose-700">
              2
            </span>
            Foto mempelai pria {groom.photoUrl ? " - sudah diunggah" : " - belum ada"}
          </li>
          <li>
            <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-rose-100 text-xs font-bold text-rose-700">
              3
            </span>
            Foto mempelai wanita {bride.photoUrl ? " - sudah diunggah" : " - belum ada"}
          </li>
          <li>
            <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-rose-100 text-xs font-bold text-rose-700">
              4
            </span>
            Galeri foto pertama {gallery[0]?.url ? " - sudah diunggah" : " - belum ada"}
          </li>
          <li>
            <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-rose-100 text-xs font-bold text-rose-700">
              5
            </span>
            Foto bawaan template
          </li>
        </ol>
      </div>
    </div>
  );
}

// Halaman membaca sesi & data DB — wajib dirender dinamis agar
// perubahan (dan sesi) selalu terbaru, tidak ter-cache statis.
export const dynamic = "force-dynamic";
