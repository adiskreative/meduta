import Link from "next/link";

/**
 * Logo Meduta.
 * - `full`: logo lengkap (mark M + teks "eduta") untuk latar gelap/terang.
 * - `mark`: hanya ikon M (lamaran) — untuk latar terang, favicon-ish.
 * Mark dirancang untuk latar gelap; di latar terang dipakai apa adanya
 * (pink kontras cukup), teks "Meduta" ditulis terpisah.
 */

export function LogoMark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/design/logo-mark.png"
      alt="Logo Meduta"
      className={`${className} object-contain`}
    />
  );
}

export default function Logo({
  variant = "full",
  className = "",
}: {
  variant?: "full" | "mark";
  className?: string;
}) {
  if (variant === "mark") {
    return <LogoMark className={className} />;
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/design/logo-full.webp"
      alt="Meduta — Undangan Digital Pernikahan"
      className={`${className} object-contain`}
    />
  );
}

/** Logo + teks untuk navbar/sidebar di latar terang. */
export function LogoWithText({
  href = "/",
  textClass = "text-zinc-900",
  markClass = "h-9 w-auto",
  textSize = "text-lg",
}: {
  href?: string;
  textClass?: string;
  markClass?: string;
  textSize?: string;
}) {
  return (
    <Link href={href} className="flex items-center gap-2.5">
      <LogoMark className={markClass} />
      <span className={`${textSize} font-bold tracking-tight ${textClass}`}>
        Meduta
      </span>
    </Link>
  );
}
