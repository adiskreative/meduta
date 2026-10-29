"use client";

import { useState, useTransition } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { setActiveInvitation } from "@/lib/actions/template";

type InvitationOption = {
  id: string;
  label: string;
  templateName: string;
};

export default function DashboardShell({
  children,
  isAdmin = false,
  unreadNotifications = 0,
  invitations = [],
  activeInvitationId = null,
}: {
  children: React.ReactNode;
  isAdmin?: boolean;
  unreadNotifications?: number;
  invitations?: InvitationOption[];
  activeInvitationId?: string | null;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSwitchInvitation(invitationId: string) {
    startTransition(async () => {
      try {
        await setActiveInvitation(invitationId);
      } catch {
        // Ganti undangan gagal (mis. sesi berakhir) — biarkan halaman tetap.
      }
    });
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} isAdmin={isAdmin} />

      <div className="lg:pl-64">
        <DashboardHeader
          onMenuClick={() => setSidebarOpen(true)}
          unreadNotifications={unreadNotifications}
          invitations={invitations}
          activeInvitationId={activeInvitationId}
          onSwitchInvitation={handleSwitchInvitation}
          switching={pending}
        />
        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
