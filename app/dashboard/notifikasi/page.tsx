import { Bell } from "lucide-react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import NotificationList from "@/components/dashboard/NotificationList";

export const metadata = { title: "Notifikasi | Meduta" };

export default async function NotifikasiPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const unreadCount = await prisma.notification.count({
    where: { userId: session.user.id, isRead: false },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Notifikasi</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Pemberitahuan penting tentang undangan dan akun Anda.
        </p>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white">
        <div className="flex items-center gap-2 border-b border-zinc-100 px-6 py-4">
          <Bell className="h-5 w-5 text-rose-500" />
          <h2 className="font-semibold text-zinc-900">Semua Notifikasi</h2>
          {unreadCount > 0 && (
            <span className="ml-1 rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-700">
              {unreadCount} belum dibaca
            </span>
          )}
        </div>

        <NotificationList notifications={notifications} />
      </div>
    </div>
  );
}

// Halaman membaca sesi & data DB — wajib dirender dinamis agar
// perubahan (dan sesi) selalu terbaru, tidak ter-cache statis.
export const dynamic = "force-dynamic";
