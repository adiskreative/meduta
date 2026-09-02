"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Settings,
  Palette,
  Heart,
  BookHeart,
  CalendarDays,
  ClipboardList,
  Send,
  Images,
  Music,
  Gift,
  MessageCircleHeart,
  UserCog,
  CreditCard,
  Bell,
  X,
} from "lucide-react";
import { signOut } from "next-auth/react";

type NavItem = {
  label: string;
  href: string;
  icon: React.ElementType;
};

const navSections: { title: string; items: NavItem[] }[] = [
  {
    title: "Umum",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      {
        label: "Pengaturan Umum",
        href: "/dashboard/pengaturan-umum",
        icon: Settings,
      },
      { label: "Pilih Tema", href: "/dashboard/pilih-tema", icon: Palette },
    ],
  },
  {
    title: "Konten Undangan",
    items: [
      { label: "Mempelai", href: "/dashboard/mempelai", icon: Heart },
      { label: "Cerita Cinta", href: "/dashboard/cerita-cinta", icon: BookHeart },
      {
        label: "Informasi Acara",
        href: "/dashboard/informasi-acara",
        icon: CalendarDays,
      },
      { label: "Galeri", href: "/dashboard/galeri", icon: Images },
      {
        label: "Background Music",
        href: "/dashboard/background-music",
        icon: Music,
      },
      { label: "Kado Nikah", href: "/dashboard/kado-nikah", icon: Gift },
    ],
  },
  {
    title: "Tamu & Interaksi",
    items: [
      { label: "RSVP Undangan", href: "/dashboard/rsvp", icon: ClipboardList },
      {
        label: "Kirim Undangan",
        href: "/dashboard/kirim-undangan",
        icon: Send,
      },
      {
        label: "Doa & Ucapan",
        href: "/dashboard/ucapan",
        icon: MessageCircleHeart,
      },
    ],
  },
  {
    title: "Akun",
    items: [
      { label: "Transaksi", href: "/dashboard/transaksi", icon: CreditCard },
      { label: "Notifikasi", href: "/dashboard/notifikasi", icon: Bell },
      { label: "Pengaturan Akun", href: "/dashboard/akun", icon: UserCog },
    ],
  },
];

export default function Sidebar({
  open,
  onClose,
  isAdmin = false,
}: {
  open: boolean;
  onClose: () => void;
  isAdmin?: boolean;
}) {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-zinc-200 bg-white transition-transform duration-200 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-zinc-200 px-5">
          <Link href="/dashboard" className="text-xl font-bold text-rose-600">
            Meduta
          </Link>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 lg:hidden"
            aria-label="Tutup menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
          {navSections.map((section) => (
            <div key={section.title}>
              <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                {section.title}
              </p>
              <ul className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={onClose}
                        className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                          active
                            ? "bg-rose-50 font-medium text-rose-700"
                            : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                        }`}
                      >
                        <Icon className="h-4.5 w-4.5 shrink-0" />
                        <span>{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
          {isAdmin && (
            <div>
              <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                Admin
              </p>
              <ul className="space-y-0.5">
                <li>
                  <Link
                    href="/admin"
                    onClick={onClose}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                      pathname.startsWith("/admin")
                        ? "bg-rose-50 font-medium text-rose-700"
                        : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                    }`}
                  >
                    <UserCog className="h-4.5 w-4.5 shrink-0" />
                    <span>Admin Panel</span>
                  </Link>
                </li>
              </ul>
            </div>
          )}
        </nav>

        <div className="border-t border-zinc-200 p-3">
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900"
          >
            <X className="h-4.5 w-4.5 rotate-45" />
            <span>Keluar</span>
          </button>
        </div>
      </aside>
    </>
  );
}