"use client";

import { useActionState } from "react";
import { Crown } from "lucide-react";
import {
  activatePremium,
  type PremiumState,
} from "@/lib/actions/premium";

export default function ActivatePremiumButton() {
  const [state, formAction, isPending] = useActionState<
    PremiumState | undefined,
    FormData
  >(activatePremium, undefined);

  return (
    <form action={formAction} className="space-y-2">
      <button
        type="submit"
        disabled={isPending}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-rose-600 px-6 py-3.5 font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Crown className="h-5 w-5" />
        {isPending ? "Memproses..." : "Aktifkan Premium Sekarang"}
      </button>
      {state?.message && (
        <p className="text-center text-sm text-zinc-600">{state.message}</p>
      )}
    </form>
  );
}
