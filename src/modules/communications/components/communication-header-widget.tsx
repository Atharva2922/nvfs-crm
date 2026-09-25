"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { MessageSquare, Plus, Send } from "lucide-react";
import { QuickMessageModal } from "../quick-message-modal";

export function CommunicationHeaderWidget() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isQuickMsgOpen, setIsQuickMsgOpen] = useState(false);

  const fetchUnreadCount = async () => {
    try {
      const res = await fetch("/api/communications/unread-count");
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.data?.unreadCount || 0);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(() => {
      if (typeof document !== "undefined" && document.hidden) return;
      fetchUnreadCount();
    }, 45000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-1.5">
      {/* Quick Message Button */}
      <button
        type="button"
        onClick={() => setIsQuickMsgOpen(true)}
        className="hidden sm:inline-flex items-center gap-1 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-2 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 hover:border-blue-500 hover:text-blue-600 transition-colors shadow-2xs"
        title="Quick Message without leaving page"
      >
        <Send className="h-3 w-3 text-blue-500" />
        <span>Message</span>
      </button>

      {/* Message Center Icon with Unread Badge */}
      <Link
        href="/app/communications"
        className="relative flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:border-blue-500 hover:text-blue-600 transition-colors shadow-2xs"
        title="Communication & Collaboration Hub"
      >
        <MessageSquare className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-blue-600 px-1 text-[9px] font-bold text-white shadow-xs animate-pulse">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </Link>

      {/* Quick Message Modal */}
      <QuickMessageModal
        isOpen={isQuickMsgOpen}
        onClose={() => {
          setIsQuickMsgOpen(false);
          fetchUnreadCount();
        }}
      />
    </div>
  );
}
