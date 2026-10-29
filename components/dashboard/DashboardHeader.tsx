"use client";

import { Menu, Bell } from "lucide-react";
import Link from "next/link";

type InvitationOption = {
  id: string;
  label: string;
  templateName: string;
};

export default function DashboardHeader({
  onMenuClick,
  unreadNotifications = 0,
  invitations = [],
  activeInvitationId = null,
  onSwitchInvitation,
  switching = false,
}: {
  onMenuClick: () => void;
  unreadNotifications?: number;
  invitations?: InvitationOption[];
  activeInvitationId?: string | null;
  onSwitchInvitation?: (invitationId: string) => void;
  switching?: boolean;
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
        {/* Switcher undangan aktif (multi-undangan per akun) */}
        {invitations.length > 0 && onSwitchInvitation && (
          <select
            value={activeInvitationId ?? invitations[0]?.id ?? ""}
            onChange={(event) => onSwitchInvitation(event.target.value)}
            disabled={switching}
            aria-label="Undangan aktif"
            className="max-w-44 truncate rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 text-sm font-medium text-zinc-700 transition hover:border-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-200 disabled:opacity-60 sm:max-w-64"
          >
            {invitations.map((inv) => (
              <option key={inv.id} value={inv.id}>
                {inv.label} | {inv.templateName}
              </option>
            ))}
          </select>
        )}
        <Link
          href="/dashboard/notifikasi"
          className="relative rounded-full p-2 text-zinc-600 hover:bg-zinc-100"
          aria-label="Notifikasi"
        >
          <Bell className="h-5 w-5" />
          {unreadNotifications > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold leading-none text-white">
              {unreadNotifications > 99 ? "99+" : unreadNotifications}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}
