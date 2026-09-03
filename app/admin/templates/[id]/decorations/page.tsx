import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteDecoration } from "@/lib/actions/admin-decoration";
import DecorationForm from "@/components/admin/DecorationForm";
import DeleteButton from "@/components/admin/DeleteButton";

export const metadata = { title: "Dekorasi Template | Meduta" };
export const dynamic = "force-dynamic";

function fmtPosition(json: unknown): string {
  if (!json) return "-";
  const p = json as { x?: number; y?: number };
  return `${p.x ?? 0}, ${p.y ?? 0}`;
}

function fmtSize(json: unknown): string {
  if (!json) return "auto";
  const s = json as { width?: number; height?: number };
  return `${s.width ?? "auto"}x${s.height ?? "auto"}`;
}

export default async function AdminTemplateDecorationsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  const { id } = await params;

  const template = await prisma.template.findUnique({
    where: { id },
  });
  if (!template) notFound();

  const [assets, decorations] = await Promise.all([
    prisma.templateAsset.findMany({ orderBy: { name: "asc" } }),
    prisma.templateDecoration.findMany({
      where: { templateId: id },
      orderBy: { zIndex: "asc" },
      include: { asset: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/templates"
            className="rounded-lg border border-zinc-300 p-2 text-zinc-500 transition hover:bg-zinc-50"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">
              Dekorasi &quot;{template.name}&quot;
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              Tempatkan aset pada template ini (posisi, ukuran, layer).
            </p>
          </div>
        </div>
        <Link
          href={`/admin/templates/${id}`}
          className="rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
        >
          Edit Template
        </Link>
      </div>

      {assets.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-center text-sm text-zinc-500">
          Belum ada aset desain. Tambahkan aset dulu di{" "}
          <Link href="/admin/assets" className="font-medium text-rose-600">
            Kelola Aset Desain
          </Link>
          .
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <DecorationForm templateId={id} assets={assets} />

          <div>
            <h2 className="mb-3 text-lg font-semibold text-zinc-900">
              Dekorasi Terpasang ({decorations.length})
            </h2>
            {decorations.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-center text-sm text-zinc-500">
                Belum ada dekorasi pada template ini.
              </div>
            ) : (
              <div className="space-y-3">
                {decorations.map((d) => (
                  <div
                    key={d.id}
                    className="flex items-center gap-4 rounded-xl border border-zinc-200 bg-white p-3"
                  >
                    <img
                      src={d.asset.thumbnail ?? d.asset.url}
                      alt={d.asset.name}
                      className="h-14 w-14 shrink-0 rounded-lg object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-zinc-900">
                        {d.asset.name}
                      </p>
                      <p className="text-xs text-zinc-400">
                        {d.asset.type} · {d.placement} · {d.layer} · z:{d.zIndex} · pos (
                        {fmtPosition(d.position)}) · {fmtSize(d.size)}
                        {d.rotated != null ? ` · rotasi ${d.rotated}°` : ""}
                      </p>
                    </div>
                    <div className="shrink-0">
                      <DeleteButton
                        deleteId={d.id}
                        action={deleteDecoration}
                        label="Hapus"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
