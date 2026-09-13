import Link from "next/link";
import { redirect } from "next/navigation";
import { ImagePlus, LayoutGrid, Mountain, Eye, ExternalLink } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import BackgroundAssetCard from "@/components/admin/BackgroundAssetCard";
import BackgroundTemplateCard from "@/components/admin/BackgroundTemplateCard";

export const metadata = { title: "Kelola Background | Meduta" };
export const dynamic = "force-dynamic";

export default async function AdminBackgroundsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  const [backgroundAssets, templates] = await Promise.all([
    prisma.templateAsset.findMany({
      where: { type: "BACKGROUND" },
      orderBy: { createdAt: "desc" },
    }),
    prisma.template.findMany({
      orderBy: { name: "asc" },
      include: {
        decorations: {
          where: { layer: "background" },
          include: { asset: true },
        },
      },
    }),
  ]);

  return (
    <div className="space-y-10">
      {/* ===== Galeri Aset BACKGROUND ===== */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Kelola Background</h1>
            <p className="mt-1 text-sm text-zinc-500">
              Galeri aset latar. Pilih template pada kartu untuk memasang —
              background lama otomatis diganti.
            </p>
          </div>
          <Link
            href="/admin/assets"
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
          >
            <ImagePlus className="h-4 w-4" />
            Upload Aset Baru
          </Link>
        </div>

        {backgroundAssets.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center">
            <Mountain className="mx-auto mb-3 h-8 w-8 text-zinc-300" />
            <p className="text-sm text-zinc-500">
              Belum ada aset bertipe BACKGROUND. Upload lewat{" "}
              <Link href="/admin/assets" className="font-medium text-rose-600">
                Aset Desain
              </Link>{" "}
              dengan tipe &quot;Background&quot;.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {backgroundAssets.map((asset) => (
              <BackgroundAssetCard key={asset.id} asset={asset} templates={templates} />
            ))}
          </div>
        )}
      </section>

      {/* ===== Status background per template ===== */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-zinc-900">
            <LayoutGrid className="mr-2 inline h-5 w-5 text-rose-500" />
            Status per Template
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            Ganti langsung dari sini, atau hapus untuk kembali ke foto bawaan template.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {templates.map((template) => {
            const activeBg = template.decorations[0]?.asset.url ?? null;
            return (
              <div
                key={template.id}
                className="overflow-hidden rounded-2xl border border-zinc-200 bg-white transition hover:shadow-md"
              >
                {/* Pratinjau: background aktif, atau thumbnail bawaan jika belum dipasang */}
                <div className="relative h-44 bg-zinc-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={activeBg ?? template.thumbnailUrl}
                    alt={activeBg ? `Background aktif ${template.name}` : template.name}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                  <span
                    className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-xs font-semibold ${
                      activeBg ? "bg-emerald-500 text-white" : "bg-zinc-900/70 text-white"
                    }`}
                  >
                    {activeBg ? "Background kustom aktif" : "Bawaan template"}
                  </span>
                </div>

                <div className="space-y-3 p-5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-zinc-900">{template.name}</h3>
                      <p className="truncate text-xs text-zinc-400">
                        key: <code className="rounded bg-zinc-100 px-1">{template.componentKey}</code>
                      </p>
                    </div>
                    <a
                      href={`/preview/${template.componentKey}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-zinc-300 px-2.5 py-1.5 text-xs font-medium text-zinc-600 transition hover:bg-zinc-50"
                      title="Lihat hasil di pratinjau"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Preview
                      <ExternalLink className="h-3 w-3 opacity-50" />
                    </a>
                  </div>

                  {/* Tombol pasang/hapus background — client component */}
                  <BackgroundTemplateCard
                    templateId={template.id}
                    templateName={template.name}
                    activeBg={activeBg}
                    assets={backgroundAssets}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
