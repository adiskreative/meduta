import Link from "next/link";
import { Plus, Palette, Pencil, Crown, IdCard } from "lucide-react";
import RingIcon from "@/components/icons/RingIcon";
import { prisma } from "@/lib/prisma";
import { deleteTemplate } from "@/lib/actions/admin-template";
import DeleteTemplateButton from "@/components/admin/DeleteTemplateButton";

export const metadata = { title: "Kelola Template | Meduta" };

export const dynamic = "force-dynamic";

export default async function AdminTemplatesPage() {
  const templates = await prisma.template.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { invitations: true, decorations: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Kelola Template</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {templates.length} template tersedia.
          </p>
        </div>
        <Link
          href="/admin/templates/new"
          className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700"
        >
          <Plus className="h-4 w-4" />
          Tambah Template
        </Link>
      </div>

      {templates.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center">
          <Palette className="mx-auto mb-3 h-8 w-8 text-zinc-300" />
          <p className="text-sm text-zinc-500">
            Belum ada template. Klik &quot;Tambah Template&quot; untuk membuat
            yang pertama.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <div
              key={template.id}
              className="overflow-hidden rounded-2xl border border-zinc-200 bg-white transition hover:shadow-md"
            >
              <div className="relative h-40">
                <img
                  src={template.thumbnailUrl}
                  alt={template.name}
                  className="h-full w-full object-cover"
                />
                {template.isPremium && (
                  <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-amber-400 px-2.5 py-1 text-xs font-semibold text-amber-900">
                    <Crown className="h-3 w-3" />
                    Premium
                  </span>
                )}
              </div>

              <div className="p-5">
                <h2 className="font-semibold text-zinc-900">{template.name}</h2>
                <p className="mt-0.5 text-xs text-zinc-400">
                  key: <code className="rounded bg-zinc-100 px-1">{template.componentKey}</code>
                </p>
                <p className="mt-2 text-xs text-zinc-500">
                  Dipakai {template._count.invitations} undangan ·{" "}
                  {template._count.decorations} dekorasi
                </p>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Link
                    href={`/admin/templates/${template.id}`}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
                  >
                    <Pencil className="h-4 w-4" />
                    Edit
                  </Link>
                  <Link
                    href={`/admin/templates/${template.id}/decorations`}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
                  >
                    <RingIcon className="h-4 w-4" />
                    Dekorasi
                  </Link>
                  <Link
                    href={`/admin/templates/${template.id}/sample-data`}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
                  >
                    <IdCard className="h-4 w-4" />
                    Contoh
                  </Link>
                  <DeleteTemplateButton
                    templateId={template.id}
                    usedBy={template._count.invitations}
                    action={deleteTemplate}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
