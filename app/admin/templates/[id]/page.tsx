import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import TemplateForm from "@/components/admin/TemplateForm";
import TemplateMusicManager from "@/components/admin/TemplateMusicManager";

export const metadata = { title: "Edit Template | Meduta" };

export const dynamic = "force-dynamic";

export default async function AdminTemplateDetailPage({
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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/templates"
          className="rounded-lg border border-zinc-300 p-2 text-zinc-500 transition hover:bg-zinc-50"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Edit Template</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Ubah detail template &quot;{template.name}&quot;.
          </p>
        </div>
      </div>

      <TemplateForm
        mode="edit"
        templateId={template.id}
        defaultValues={{
          name: template.name,
          thumbnailUrl: template.thumbnailUrl,
          componentKey: template.componentKey,
          isPremium: template.isPremium,
        }}
      />

      <TemplateMusicManager
        templateId={template.id}
        defaultMusicUrl={template.defaultMusicUrl}
      />
    </div>
  );
}
