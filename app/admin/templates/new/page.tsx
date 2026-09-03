import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import TemplateForm from "@/components/admin/TemplateForm";

export const metadata = { title: "Tambah Template | Meduta" };

export default function AdminTemplateNewPage() {
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
          <h1 className="text-2xl font-bold text-zinc-900">Tambah Template</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Buat desain undangan baru.
          </p>
        </div>
      </div>

      <TemplateForm mode="create" />
    </div>
  );
}
