"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Palette, Images, Mountain, ArrowLeft, X } from "lucide-react";
import { signOut } from "next-auth/react";
import { useState } from "react";
import { LogoMark } from "@/components/Logo";

type NavItem = { label: string; href: string; icon: React.ElementType };

const navItems: NavItem[] = [
  { label: "Ringkasan", href: "/admin", icon: LayoutDashboard },
  { label: "Template", href: "/admin/templates", icon: Palette },
  { label: "Background", href: "/admin/backgrounds", icon: Mountain },
  { label: "Aset Desain", href: "/admin/assets", icon: Images },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  function isActive(href: string) {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-zinc-200 bg-white transition-transform duration-200 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-zinc-200 px-5">
          <div className="flex items-center gap-2.5">
            <LogoMark className="h-8 w-auto" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-rose-400">
                Admin Panel
              </p>
              <p className="text-sm font-bold text-zinc-900">Meduta</p>
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 lg:hidden"
            aria-label="Tutup menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                  active
                    ? "bg-rose-50 font-medium text-rose-700"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                }`}
              >
                <Icon className="h-4.5 w-4.5 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="space-y-1 border-t border-zinc-200 p-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-600 transition hover:bg-zinc-100"
          >
            <ArrowLeft className="h-4.5 w-4.5" />
            Kembali ke Dashboard
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-600 transition hover:bg-zinc-100"
          >
            <X className="h-4.5 w-4.5 rotate-45" />
            Keluar
          </button>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="flex h-16 items-center justify-between border-b border-zinc-200 bg-white px-4">
          <button
            onClick={() => setOpen(true)}
            className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 lg:hidden"
            aria-label="Buka menu"
          >
            <X className="h-5 w-5 -rotate-45" />
          </button>
          <span className="text-sm font-medium text-zinc-700">Kelola Template &amp; Aset</span>
          <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-600">
            ADMIN
          </span>
        </header>
        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
