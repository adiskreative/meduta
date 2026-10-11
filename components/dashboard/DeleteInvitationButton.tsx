"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { deleteInvitation } from "@/lib/actions/general";

export default function DeleteInvitationButton({
  invitationId,
  eventName,
}: {
  invitationId: string;
  eventName?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    const label = eventName ? `"${eventName}"` : "undangan ini";
    if (
      !confirm(
        `Hapus ${label}? Semua tamu dan ucapan di dalamnya ikut terhapus dan tidak bisa dikembalikan.`,
      )
    )
      return;
    startTransition(async () => {
      await deleteInvitation(invitationId);
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isPending}
      className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
      Hapus
    </button>
  );
}