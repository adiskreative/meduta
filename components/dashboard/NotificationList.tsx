"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCheck, ChevronRight, Mail, MessageSquare, CreditCard, Bell } from "lucide-react";
import {
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/actions/notification";
import { type NotificationType } from "@/generated/prisma/client";

export type NotificationRow = {
  id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  link: string | null;
  isRead: boolean;
  createdAt: Date;
};

const iconMap: Record<NotificationType, { icon: typeof Bell; color: string }> = {
  RSVP: { icon: Mail, color: "text-rose-600 bg-rose-50" },
  WISH: { icon: MessageSquare, color: "text-violet-600 bg-violet-50" },
  TRANSACTION: { icon: CreditCard, color: "text-emerald-600 bg-emerald-50" },
  SYSTEM: { icon: Bell, color: "text-zinc-600 bg-zinc-100" },
};

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default function NotificationList({
  notifications,
}: {
  notifications: NotificationRow[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleRead(id: string) {
    startTransition(async () => {
      await markNotificationRead(id);
      router.refresh();
    });
  }

  function handleReadAll() {
    startTransition(async () => {
      await markAllNotificationsRead();
      router.refresh();
    });
  }

  if (notifications.length === 0) {
    return (
      <div className="px-6 py-16 text-center">
        <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-zinc-50 text-zinc-300">
          <Bell className="h-7 w-7" />
        </span>
        <p className="text-sm font-medium text-zinc-700">Belum ada notifikasi</p>
        <p className="mx-auto mt-1 max-w-sm text-xs text-zinc-400">
          Notifikasi seperti RSVP baru, ucapan baru, atau pembayaran akan muncul
          di sini.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
        <h2 className="font-semibold text-zinc-900">Semua Notifikasi</h2>
        <button
          type="button"
          onClick={handleReadAll}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-600 transition hover:text-rose-700 disabled:opacity-60"
        >
          <CheckCheck className="h-3.5 w-3.5" />
          Tandai semua dibaca
        </button>
      </div>

      <ul className="divide-y divide-zinc-100">
        {notifications.map((notification) => {
          const { icon: Icon, color } =
            iconMap[notification.type] ?? iconMap.SYSTEM;
          const isUnread = !notification.isRead;

          const inner = (
            <>
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${color}`}
              >
                <Icon className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p
                    className={`truncate text-sm ${
                      isUnread ? "font-semibold text-zinc-900" : "text-zinc-600"
                    }`}
                  >
                    {notification.title}
                  </p>
                  {isUnread && (
                    <span className="h-2 w-2 shrink-0 rounded-full bg-rose-500" />
                  )}
                </div>
                {notification.body && (
                  <p className="mt-0.5 text-sm text-zinc-500">
                    {notification.body}
                  </p>
                )}
                <p className="mt-1 text-xs text-zinc-400">
                  {formatDate(notification.createdAt)}
                </p>
              </div>
              {notification.link && (
                <ChevronRight
                  className={`mt-2 h-4 w-4 shrink-0 ${
                    isUnread ? "text-rose-400" : "text-zinc-300"
                  }`}
                />
              )}
            </>
          );

          const clickHandler =
            notification.link || !notification.isRead
              ? () => handleRead(notification.id)
              : undefined;

          const classes = `group flex w-full items-start gap-3 px-6 py-4 text-left transition ${
            isUnread ? "bg-rose-50/30 hover:bg-rose-50/70" : "hover:bg-zinc-50"
          }`;

          if (notification.link) {
            return (
              <li key={notification.id}>
                <Link href={notification.link} onClick={clickHandler} className={classes}>
                  {inner}
                </Link>
              </li>
            );
          }

          return (
            <li key={notification.id}>
              <button
                type="button"
                onClick={clickHandler}
                className={classes}
                disabled={!notification.isRead}
              >
                {inner}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
