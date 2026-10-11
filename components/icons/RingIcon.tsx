import type { SVGProps } from "react";

/**
 * Ikon cincin kawin custom bergaya lucide: band cincin + berlian di atasnya.
 * Menggantikan ikon Sparkles di seluruh aplikasi (tema pernikahan lebih pas).
 * API sama seperti ikon lucide — menerima className & props SVG standar.
 */
export function RingIcon({ width = 24, height = 24, ...props }: SVGProps<SVGSVGElement> & { width?: number; height?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {/* Berlian di atas band */}
      <path d="M7 7h10l-5 6-5-6Z" />
      <path d="m7 7 2.5-3.5h5L17 7" />
      {/* Band cincin */}
      <circle cx="12" cy="15.5" r="5.5" />
    </svg>
  );
}

export default RingIcon;
