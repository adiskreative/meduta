import { Music } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { deleteAsset } from "@/lib/actions/admin-asset";
import { MAX_MUSIC_FILES_PER_UPLOAD } from "@/lib/asset-limits";
import AssetForm from "@/components/admin/AssetForm";
import DeleteButton from "@/components/admin/DeleteButton";

export const metadata = { title: "Kelola Aset Musik | Meduta" };
export const dynamic = "force-dynamic";

export default async function AdminMusicPage() {
  const musicAssets = await prisma.templateAsset.findMany({
    where: { type: "MUSIC" },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Kelola Aset Musik</h1>
        <p className="mt-1 text-sm text-zinc-500">
          {musicAssets.length} musik — koleksi stok yang bisa dipilih pengguna
          saat mengatur background music undangan. Unggah beberapa file sekaligus
          (maks {MAX_MUSIC_FILES_PER_UPLOAD} file, diproses otomatis per batch).
        </p>
      </div>

      <AssetForm variant="music" />

      <div className="rounded-2xl border border-zinc-200 bg-white">
        <div className="flex items-center gap-2 border-b border-zinc-100 px-6 py-4">
          <Music className="h-5 w-5 text-amber-500" />
          <h2 className="font-semibold text-zinc-900">Daftar Musik</h2>
        </div>

        {musicAssets.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-zinc-500">
            Belum ada aset musik. Unggah file atau tambahkan dari URL di atas.
          </div>
        ) : (
          <ul className="divide-y divide-zinc-100">
            {musicAssets.map((asset) => (
              <li
                key={asset.id}
                className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                    <Music className="h-4 w-4" />
                  </span>
                  <p className="truncate font-medium text-zinc-900">{asset.name}</p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <audio
                    controls
                    src={asset.url}
                    preload="none"
                    className="h-10 w-full sm:w-72"
                  />
                  <DeleteButton
                    deleteId={asset.id}
                    action={deleteAsset}
                    label="Hapus"
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
