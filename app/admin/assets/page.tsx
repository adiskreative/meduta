import { Images, Image as ImageIcon, Frame, Flower2, Wallpaper, Music, Library } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { deleteAsset } from "@/lib/actions/admin-asset";
import AssetForm from "@/components/admin/AssetForm";
import DeleteButton from "@/components/admin/DeleteButton";

export const metadata = { title: "Kelola Aset Desain | Meduta" };
export const dynamic = "force-dynamic";

const TYPE_META: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  IMAGE: { label: "Gambar", icon: ImageIcon, color: "text-sky-600" },
  FRAME: { label: "Bingkai", icon: Frame, color: "text-violet-600" },
  DECOR: { label: "Dekorasi", icon: Flower2, color: "text-rose-600" },
  BACKGROUND: { label: "Background", icon: Wallpaper, color: "text-emerald-600" },
  MUSIC: { label: "Musik", icon: Music, color: "text-amber-600" },
  GALLERY: { label: "Galeri", icon: Library, color: "text-indigo-600" },
};

export default async function AdminAssetsPage() {
  const assets = await prisma.templateAsset.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { decorations: true } } },
  });

  const countByType = assets.reduce<Record<string, number>>((acc, a) => {
    acc[a.type] = (acc[a.type] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Kelola Aset Desain</h1>
        <p className="mt-1 text-sm text-zinc-500">
          {assets.length} aset — unggah bingkai, bunga, background, musik, dan galeri.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {Object.entries(TYPE_META).map(([type, meta]) => {
          const Icon = meta.icon;
          return (
            <div
              key={type}
              className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-4"
            >
              <span className={`flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-50 ${meta.color}`}>
                <Icon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs text-zinc-400">{meta.label}</p>
                <p className="text-lg font-bold text-zinc-900">{countByType[type] ?? 0}</p>
              </div>
            </div>
          );
        })}
      </div>

      <AssetForm />

      <div className="rounded-2xl border border-zinc-200 bg-white">
        <div className="flex items-center gap-2 border-b border-zinc-100 px-6 py-4">
          <Images className="h-5 w-5 text-rose-500" />
          <h2 className="font-semibold text-zinc-900">Daftar Aset</h2>
        </div>

        {assets.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-zinc-500">
            Belum ada aset. Unggah atau tambahkan dari URL di atas.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3">
            {assets.map((asset) => {
              const meta = TYPE_META[asset.type];
              const Icon = meta.icon;
              return (
                <div
                  key={asset.id}
                  className="flex flex-col overflow-hidden rounded-xl border border-zinc-200"
                >
                  <div className="flex h-36 items-center justify-center bg-zinc-50">
                    {asset.type === "MUSIC" ? (
                      <Music className="h-10 w-10 text-zinc-400" />
                    ) : (
                      <img
                        src={asset.thumbnail ?? asset.url}
                        alt={asset.name}
                        className="h-full w-full object-contain"
                      />
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-zinc-900">{asset.name}</p>
                        <span className={`mt-1 inline-flex items-center gap-1 text-xs ${meta.color}`}>
                          <Icon className="h-3 w-3" />
                          {meta.label}
                        </span>
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-zinc-400">
                      Dipakai {asset._count.decorations} dekorasi
                    </p>
                    <div className="mt-3">
                      <DeleteButton
                        deleteId={asset.id}
                        action={deleteAsset}
                        disabled={asset._count.decorations > 0}
                        disabledTitle="Aset masih dipakai dekorasi"
                        label="Hapus"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
