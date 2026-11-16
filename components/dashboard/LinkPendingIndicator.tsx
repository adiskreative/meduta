"use client";

import { useLinkStatus } from "next/link";
import { Loader2 } from "lucide-react";

/**
 * Indikator pending kecil di dalam <Link>. useLinkStatus hanya boleh dipakai
 * pada komponen turunan Link. Ukuran wadah dibuat tetap agar label menu tidak
 * bergeser saat spinner muncul/hilang.
 */
export default function LinkPendingIndicator() {
  const { pending } = useLinkStatus();

  return (
    <span
      aria-hidden
      className="ml-auto flex h-4 w-4 shrink-0 items-center justify-center"
    >
      {pending && <Loader2 className="h-3.5 w-3.5 animate-spin text-rose-500" />}
    </span>
  );
}
