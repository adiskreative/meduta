import Link from "next/link";
import { Palette, Images, Users, FileText, ArrowRight } from "lucide-react";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Admin Panel | Meduta" };
export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const [templateCount, userCount, invitationCount, assetCount] = await Promise.all([
    prisma.template.count(),
    prisma.user.count(),
    prisma.invitation.count(),
    prisma.templateAsset.count(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Ringkasan Admin</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Kelola template dan aset desain untuk semua undangan.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Palette} label="Template" value={templateCount} />
        <StatCard icon={FileText} label="Undangan" value={invitationCount} />
        <StatCard icon={Users} label="Pengguna" value={userCount} />
        <StatCard icon={Images} label="Aset Desain" value={assetCount} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Link
          href="/admin/templates"
          className="group rounded-2xl border border-zinc-200 bg-white p-6 transition hover:border-rose-200 hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
                <Palette className="h-5 w-5" />
              </span>
              <div>
                <p className="font-semibold text-zinc-900">Kelola Template</p>
                <p className="text-sm text-zinc-500">Tambah / ubah desain undangan</p>
              </div>
            </div>
            <ArrowRight className="h-5 w-5 text-zinc-300 transition group-hover:text-rose-500" />
          </div>
        </Link>

        <Link
          href="/admin/assets"
          className="group rounded-2xl border border-zinc-200 bg-white p-6 transition hover:border-rose-200 hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
                <Images className="h-5 w-5" />
              </span>
              <div>
                <p className="font-semibold text-zinc-900">Kelola Aset Desain</p>
                <p className="text-sm text-zinc-500">Unggah foto, bingkai, bunga, background</p>
              </div>
            </div>
            <ArrowRight className="h-5 w-5 text-zinc-300 transition group-hover:text-rose-500" />
          </div>
        </Link>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5">
      <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
        <Icon className="h-5 w-5" />
      </span>
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="mt-0.5 text-2xl font-bold text-zinc-900">{value}</p>
    </div>
  );
}
