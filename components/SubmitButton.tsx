"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";

/**
 * Tombol submit untuk <form action={serverAction}> yang dirender dari
 * Server Component. Status pending HARUS dibaca lewat useFormStatus dari
 * komponen anak <form>; Server Component tidak punya state klien, sehingga
 * tanpa komponen ini tombol tampak tidak bereaksi saat diklik.
 */
export default function SubmitButton({
  idleText,
  pendingText,
  icon,
  className = "",
  disabled = false,
}: {
  idleText: string;
  /** Teks saat menunggu; default tetap idleText + spinner. */
  pendingText?: string;
  icon?: React.ReactNode;
  className?: string;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className={`inline-flex items-center justify-center gap-1.5 disabled:cursor-not-allowed ${className}`}
    >
      {pending ? (
        <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
      ) : (
        icon
      )}
      {pending ? (pendingText ?? idleText) : idleText}
    </button>
  );
}
