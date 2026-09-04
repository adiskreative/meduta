"use client";

import { useState } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";

export default function DashboardShell({
  children,
  isAdmin = false,
  unreadNotifications = 0,
}: {
  children: React.ReactNode;
  isAdmin?: boolean;
  unreadNotifications?: number;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-zinc-50">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} isAdmin={isAdmin} />

      <div className="lg:pl-64">
        <DashboardHeader
          onMenuClick={() => setSidebarOpen(true)}
          unreadNotifications={unreadNotifications}
        />
        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}