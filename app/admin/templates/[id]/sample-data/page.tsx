import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DEFAULT_SAMPLE_DATA, mergeSampleData } from "@/lib/sample-data";
import SampleDataForm from "@/components/admin/SampleDataForm";
import { resetSampleData } from "@/lib/actions/admin-template";

export const metadata = { title: "Data Contoh Template | Meduta" };
export const dynamic = "force-dynamic";

export default async function AdminTemplateSampleDataPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  const { id } = await params;
  const template = await prisma.template.findUnique({ where: { id } });
  if (!template) notFound();

  const merged = mergeSampleData(template.sampleData);

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
              Data Contoh &quot;{template.name}&quot;
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              Isi yang tampil di pratinjau &amp; thumbnail template: nama pasangan,
              tamu, orang tua, rekening, dll.
            </p>
          </div>
        </div>
        <Link
          href={`/preview/${template.componentKey}`}
          target="_blank"
          className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
        >
          <ExternalLink className="h-4 w-4" />
          Pratinjau
        </Link>
      </div>

      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        Kolom yang <strong>dikosongkan</strong> otomatis kembali memakai nilai bawaan
        sistem. Kolom yang diisi akan <strong>menggantikan</strong> nilai bawaan pada
        pratinjau &amp; thumbnail live — undangan user tidak terpengaruh.
      </div>

      <SampleDataForm
        templateId={template.id}
        defaults={DEFAULT_SAMPLE_DATA}
        overrides={(template.sampleData ?? {}) as Record<string, unknown>}
        resetAction={resetSampleData}
      />
    </div>
  );
}
