import { redirect } from "next/navigation";
import { Check, Sparkles, Eye } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { useTemplate } from "@/lib/actions/template";

export const metadata = { title: "Pilih Tema | Meduta" };

export default async function PilihTemaPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [templates, invitation] = await Promise.all([
    prisma.template.findMany({ orderBy: [{ isPremium: "asc" }, { name: "asc" }] }),
    prisma.invitation.findFirst({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Pilih Tema</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Pilih desain undangan yang paling sesuai dengan acara Anda.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => {
          const isActive = invitation?.templateId === template.id;
          return (
            <div
              key={template.id}
              className="group overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition hover:shadow-md"
            >
              <div className="relative aspect-[3/4] overflow-hidden bg-zinc-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={template.thumbnailUrl}
                  alt={template.name}
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                />
                {template.isPremium && (
                  <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-amber-400 px-2.5 py-1 text-xs font-semibold text-amber-950">
                    <Sparkles className="h-3 w-3" />
                    Premium
                  </span>
                )}
                {isActive && (
                  <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-emerald-500 px-2.5 py-1 text-xs font-semibold text-white">
                    <Check className="h-3 w-3" />
                    Dipakai
                  </span>
                )}
              </div>

              <div className="p-4">
                <h3 className="font-semibold text-zinc-900">{template.name}</h3>
                <div className="mt-3 grid grid-cols-[auto_1fr] gap-2">
                  <a
                    href={`/preview/${template.componentKey}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-zinc-300 px-3.5 py-2 text-sm font-semibold text-zinc-700 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700"
                  >
                    <Eye className="h-4 w-4" />
                    Preview
                  </a>
                  <form action={useTemplate.bind(null, template.id)}>
                    <button
                      type="submit"
                      disabled={isActive}
                      className="w-full rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-400"
                    >
                      {isActive ? "Template Aktif" : "Pakai Template Ini"}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}