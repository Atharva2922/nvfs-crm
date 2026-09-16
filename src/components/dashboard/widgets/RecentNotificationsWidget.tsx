"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Bell, ArrowRight, Check } from "lucide-react";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export function RecentNotificationsWidget() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchNotifications() {
      try {
        setLoading(true);
        const res = await fetch("/api/notifications?limit=4");
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            const list = Array.isArray(json.data)
              ? json.data
              : Array.isArray(json.data.notifications)
              ? json.data.notifications
              : [];
            setNotifications(list);
          }
        }
      } catch (err) {
        console.error("Failed to fetch notifications:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchNotifications();
  }, []);

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 shadow-xs transition-all hover:shadow-md">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60">
            <Bell className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Recent Notifications</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Updates & alerts</p>
          </div>
        </div>
        <Link
          href="/app/notifications"
          className="flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-amber-400 hover:underline"
        >
          View All <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {loading ? (
        <div className="py-6 text-center text-xs text-slate-400">Loading notifications...</div>
      ) : !Array.isArray(notifications) || notifications.length === 0 ? (
        <div className="py-6 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-lg">
          No new notifications
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((item) => (
            <div
              key={item.id}
              className={`p-2.5 rounded-lg border text-xs transition-colors ${
                item.isRead
                  ? "bg-slate-50 dark:bg-slate-800/30 border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                  : "bg-amber-50/50 dark:bg-amber-950/30 border-amber-200/60 dark:border-amber-900/50 text-slate-900 dark:text-slate-200 font-medium"
              }`}
            >
              <div className="flex justify-between items-start">
                <span className="truncate pr-2 font-semibold">{item.title}</span>
                <span className="text-[9px] text-slate-400 font-mono shrink-0">
                  {new Date(item.createdAt).toLocaleDateString([], { month: "short", day: "numeric" })}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                {item.message}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
