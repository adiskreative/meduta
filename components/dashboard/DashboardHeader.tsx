"use client";

import { Menu, Bell } from "lucide-react";
import Link from "next/link";

export default function DashboardHeader({
  onMenuClick,
}: {
  onMenuClick: () => void;
}) {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-zinc-200 bg-white/90 px-4 backdrop-blur lg:px-8">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="rounded-md p-2 text-zinc-600 hover:bg-zinc-100 lg:hidden"
          aria-label="Buka menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <span className="text-sm font-medium text-zinc-500">Dashboard</span>
      </div>

      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/notifikasi"
          className="relative rounded-full p-2 text-zinc-600 hover:bg-zinc-100"
          aria-label="Notifikasi"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rose-500" />
        </Link>
      </div>
    </header>
  );
}