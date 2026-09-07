"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Globe, GlobeLock, Loader2 } from "lucide-react";
import { setInvitationStatus } from "@/lib/actions/general";

export default function PublishButton({
  invitationId,
  isPublished,
  disabled = false,
}: {
  invitationId: string;
  isPublished: boolean;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    startTransition(async () => {
      const form = new FormData();
      form.set("status", isPublished ? "draft" : "published");
      await setInvitationStatus(invitationId, form);
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={disabled || isPending}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
        isPublished
          ? "bg-zinc-700 hover:bg-zinc-800"
          : "bg-emerald-600 hover:bg-emerald-700"
      }`}
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isPublished ? (
        <GlobeLock className="h-4 w-4" />
      ) : (
        <Globe className="h-4 w-4" />
      )}
      {isPublished ? "Unpublish" : "Publish"}
    </button>
  );
}
