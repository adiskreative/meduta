import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import Logo from "@/components/Logo";

/**
 * Layout bersama halaman legal (Syarat & Ketentuan, Kebijakan Privasi,
 * Tim): navbar minimal yang konsisten dengan landing page (warna navy
 * senada), tombol kembali, dan footer dengan kontak + tautan antar
 * halaman legal.
 */
export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#10173f]/85 backdrop-blur">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <Logo className="h-10 w-auto" />
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-4 py-2 text-sm font-medium text-zinc-200 transition hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Beranda
          </Link>
        </nav>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-white/10 bg-[#10173f] py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
          <Logo className="h-8 w-auto" />
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-zinc-400">
            <Link href="/syarat-ketentuan" className="transition hover:text-white">
              Syarat & Ketentuan
            </Link>
            <Link href="/kebijakan-privasi" className="transition hover:text-white">
              Kebijakan Privasi
            </Link>
            <Link href="/tim" className="transition hover:text-white">
              Tim Kami
            </Link>
            <span className="text-zinc-600">•</span>
            <a
              href="mailto:adi.skreative@gmail.com"
              className="transition hover:text-white"
            >
              adi.skreative@gmail.com
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
