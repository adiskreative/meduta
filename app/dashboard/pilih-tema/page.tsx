import Link from "next/link";
import { redirect } from "next/navigation";
import { Check, Eye, Lock, Plus } from "lucide-react";
import RingIcon from "@/components/icons/RingIcon";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createInvitation, useTemplate } from "@/lib/actions/template";
import { isPremiumUser } from "@/lib/premium";
import { getActiveInvitation } from "@/lib/invitations";
import LiveTemplatePreview from "@/components/landing/LiveTemplatePreview";

export const metadata = { title: "Pilih Tema | Meduta" };

export default async function PilihTemaPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const premiumAccess = await isPremiumUser(session.user.id);

  const [templates, invitation, invitationCount] = await Promise.all([
    prisma.template.findMany({ orderBy: [{ isPremium: "asc" }, { name: "asc" }] }),
    getActiveInvitation(session.user.id),
    prisma.invitation.count({ where: { userId: session.user.id } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Pilih Tema</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Pilih desain undangan yang paling sesuai dengan acara Anda.
          {invitationCount > 0 &&
            ` Anda punya ${invitationCount} undangan — satu akun boleh membuat lebih dari satu undangan.`}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => {
          const isActive = invitation?.templateId === template.id;
          // Template premium terbuka bila: akun premium, ATAU undangan aktif
          // sudah diaktivasi premium untuk template ini.
          const canUsePremium =
            !template.isPremium || premiumAccess || (isActive && invitation.isPremium);
          return (
            <div
              key={template.id}
              className="group overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition hover:shadow-md"
            >
              <div className="relative flex justify-center bg-gradient-to-b from-rose-50/70 to-white py-8">
                {template.isPremium && (
                  <span className="absolute left-3 top-3 z-10 inline-flex items-center gap-1 rounded-full bg-amber-400 px-2.5 py-1 text-xs font-semibold text-amber-950">
                    <RingIcon className="h-3 w-3" />
                    Premium
                  </span>
                )}
                {isActive && (
                  <span className="absolute left-3 top-3 z-10 inline-flex items-center gap-1 rounded-full bg-emerald-500 px-2.5 py-1 text-xs font-semibold text-white">
                    <Check className="h-3 w-3" />
                    Dipakai
                  </span>
                )}
                {/* Thumbnail live: template asli berjalan dalam bingkai ponsel,
                    pan otomatis saat hover — konsisten dengan landing page */}
                <a
                  href={`/preview/${template.componentKey}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Lihat pratinjau template ${template.name}`}
                  className="relative w-60"
                >
                  <LiveTemplatePreview templateKey={template.componentKey} />
                </a>
              </div>

              <div className="p-4">
                <h3 className="font-semibold text-zinc-900">{template.name}</h3>
                <div className="mt-3 space-y-2">
                  <a
                    href={`/preview/${template.componentKey}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-zinc-300 px-3.5 py-2 text-sm font-semibold text-zinc-700 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700"
                  >
                    <Eye className="h-4 w-4" />
                    Preview
                  </a>
                  {/* Template premium terkunci untuk akun gratis */}
                  {canUsePremium ? (
                    <form action={useTemplate.bind(null, template.id)}>
                      <button
                        type="submit"
                        disabled={isActive}
                        className="w-full rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-400"
                      >
                        {isActive ? "Template Aktif" : "Pakai Template Ini"}
                      </button>
                    </form>
                  ) : (
                    <Link
                      href="/dashboard/upgrade"
                      className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800 transition hover:bg-amber-100"
                    >
                      <Lock className="h-4 w-4" />
                      Upgrade Premium
                    </Link>
                  )}
                  {/* Satu user bisa punya banyak undangan: buat undangan baru
                      dengan template ini (premium = bayar per-undangan) */}
                  {!(isActive && invitationCount === 1) && (
                    <form action={createInvitation.bind(null, template.id)}>
                      <button
                        type="submit"
                        className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-700"
                      >
                        <Plus className="h-4 w-4" />
                        {template.isPremium && !canUsePremium
                          ? "Beli & Buat Undangan Baru"
                          : "Buat Undangan Baru"}
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
// Halaman membaca sesi & data DB — wajib dirender dinamis agar
// perubahan (dan sesi) selalu terbaru, tidak ter-cache statis.
export const dynamic = "force-dynamic";
