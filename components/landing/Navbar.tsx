"use client";

import { useEffect, useState } from "react";
import { Menu, UserRound, X } from "lucide-react";
import Link from "next/link";
import Logo from "@/components/Logo";

const navigationLinks = [
  { href: "#fitur", label: "Fitur" },
  { href: "#template", label: "Template" },
  { href: "#cara-kerja", label: "Cara Kerja" },
  { href: "#panduan", label: "Panduan" },
  { href: "#tentang", label: "Tentang" },
  { href: "#harga", label: "Harga" },
  { href: "#kontak", label: "Kontak" },
];

export default function Navbar({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!isMobileMenuOpen) return;

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setIsMobileMenuOpen(false);
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [isMobileMenuOpen]);

  function closeMobileMenu() {
    setIsMobileMenuOpen(false);
  }

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#10173f]/90 shadow-sm shadow-black/5 backdrop-blur-xl">
        <nav className="relative mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="shrink-0">
            <Logo className="h-10 w-auto" />
          </Link>

          <div className="hidden items-center gap-1 text-sm font-medium text-zinc-300 lg:flex">
            {navigationLinks.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="rounded-full px-3 py-2 transition hover:bg-white/10 hover:text-white"
              >
                {item.label}
              </a>
            ))}
          </div>

          <div className="hidden items-center gap-3 lg:flex">
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                aria-label="Kembali ke dashboard"
                title="Kembali ke dashboard"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-zinc-200 transition hover:bg-white/10 hover:text-white"
              >
                <UserRound className="h-5 w-5" />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="flex min-h-[44px] items-center px-3 text-sm font-medium text-zinc-200 transition hover:text-white"
                >
                  Masuk
                </Link>
                <Link
                  href="/register"
                  className="rounded-full bg-pink-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-pink-950/20 transition hover:bg-pink-500"
                >
                  Daftar
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsMobileMenuOpen((isOpen) => !isOpen)}
            aria-label={isMobileMenuOpen ? "Tutup navigasi" : "Buka navigasi"}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-navigation"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/20 text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-400 lg:hidden"
          >
            {isMobileMenuOpen ? (
              <X className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Menu className="h-5 w-5" aria-hidden="true" />
            )}
          </button>

          <div
            id="mobile-navigation"
            className={`absolute inset-x-4 top-[calc(100%+0.5rem)] z-50 rounded-2xl border border-white/10 bg-[#10173f] p-2 shadow-2xl shadow-black/30 sm:inset-x-6 ${
              isMobileMenuOpen ? "block" : "hidden"
            }`}
          >
            <div className="max-h-[calc(100dvh-6rem)] overflow-y-auto">
              {navigationLinks.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={closeMobileMenu}
                  className="block rounded-xl px-4 py-3 text-sm font-medium text-zinc-200 transition hover:bg-white/10 hover:text-white"
                >
                  {item.label}
                </a>
              ))}
              <div className="mt-2 flex flex-col gap-2 border-t border-white/10 p-2 pt-3">
                {isLoggedIn ? (
                  <Link
                    href="/dashboard"
                    onClick={closeMobileMenu}
                    className="rounded-xl px-4 py-3 text-sm font-medium text-zinc-200 transition hover:bg-white/10 hover:text-white"
                  >
                    Kembali ke dashboard
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/login"
                      onClick={closeMobileMenu}
                      className="rounded-xl px-4 py-3 text-sm font-medium text-zinc-200 transition hover:bg-white/10 hover:text-white"
                    >
                      Masuk
                    </Link>
                    <Link
                      href="/register"
                      onClick={closeMobileMenu}
                      className="rounded-xl bg-pink-600 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-pink-500"
                    >
                      Daftar
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </nav>
      </header>

      {isMobileMenuOpen && (
        <button
          type="button"
          aria-label="Tutup menu navigasi"
          onClick={closeMobileMenu}
          className="fixed inset-0 z-40 bg-black/20 lg:hidden"
        />
      )}
    </>
  );
}
