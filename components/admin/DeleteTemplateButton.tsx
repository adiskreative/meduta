"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function DeleteTemplateButton({
  templateId,
  usedBy,
  action,
}: {
  templateId: string;
  usedBy: number;
  action: (templateId: string) => Promise<void>;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleDelete() {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        await action(templateId);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Gagal menghapus template.");
        setConfirming(false);
      }
    });
  }

  if (confirming) {
    return (
      <button
        onClick={handleDelete}
        disabled={isPending}
        className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
      >
        <Trash2 className="h-4 w-4" />
        {isPending ? "Menghapus..." : "Yakin hapus?"}
      </button>
    );
  }

  return (
    <>
      <button
        onClick={handleDelete}
        disabled={usedBy > 0}
        title={
          usedBy > 0
            ? "Template masih dipakai undangan, tidak bisa dihapus"
            : "Hapus template"
        }
        className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:border-red-300 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-zinc-300 disabled:hover:bg-transparent disabled:hover:text-zinc-700"
      >
        <Trash2 className="h-4 w-4" />
        Hapus
      </button>
      {error && (
        <p className="mt-2 basis-full text-xs text-red-600">{error}</p>
      )}
    </>
  );
}
