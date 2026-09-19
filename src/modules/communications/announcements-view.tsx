"use client";

import React, { useState, useEffect } from "react";
import {
  Megaphone,
  Plus,
  CheckCircle2,
  Eye,
  Calendar,
  Building,
  Shield,
  AlertTriangle,
  Loader2,
  Paperclip,
  Check,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useAuth } from "@/components/providers/auth-provider";

interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: "NORMAL" | "IMPORTANT" | "URGENT";
  audienceType?: string;
  audience?: string;
  publishedAt: string;
  expiresAt: string | null;
  isRead: boolean;
  readAt: string | null;
  readCount: number;
  authorName?: string;
  author: {
    id: string;
    firstName?: string;
    lastName?: string;
    designation?: string;
    user?: {
      id: string;
      email: string;
    };
  };
}

export function AnnouncementsView() {
  const { user, role } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [readStats, setReadStats] = useState<any | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  // New announcement form state
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newPriority, setNewPriority] = useState<"NORMAL" | "IMPORTANT" | "URGENT">("NORMAL");
  const [newAudience, setNewAudience] = useState<"ALL" | "DEPARTMENT" | "ROLE">("ALL");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canPublish = [
    "SUPER_ADMIN",
    "CEO",
    "CHAIRPERSON",
    "CTO",
    "CMO",
    "CFO",
    "ADMIN",
    "HR_MANAGER",
    "DEPARTMENT_HEAD",
  ].includes(role);

  const fetchAnnouncements = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/communications/announcements");
      if (res.ok) {
        const data = await res.json();
        setAnnouncements(data.data?.announcements || []);
      }
    } catch (e) {
      console.error("Failed to fetch announcements:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleSelectAnnouncement = async (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setReadStats(null);

    // Mark as read if not already read
    if (!announcement.isRead) {
      try {
        await fetch(`/api/communications/announcements/${announcement.id}/read`, {
          method: "POST",
        });
        setAnnouncements((prev) =>
          prev.map((a) =>
            a.id === announcement.id ? { ...a, isRead: true, readCount: a.readCount + 1 } : a
          )
        );
      } catch (e) {
        console.error("Failed to mark read:", e);
      }
    }

    // If admin or publisher, fetch read stats
    if (canPublish || announcement.author.id === user?.employee?.id) {
      setIsLoadingStats(true);
      try {
        const statsRes = await fetch(`/api/communications/announcements/${announcement.id}/read`);
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setReadStats(statsData.data);
        }
      } catch (e) {
        console.error("Failed to fetch read stats:", e);
      } finally {
        setIsLoadingStats(false);
      }
    }
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/communications/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle,
          content: newContent,
          priority: newPriority,
          audience: newAudience,
        }),
      });

      if (res.ok) {
        setIsPublishModalOpen(false);
        setNewTitle("");
        setNewContent("");
        setNewPriority("NORMAL");
        fetchAnnouncements();
      }
    } catch (e) {
      console.error("Failed to publish announcement:", e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredAnnouncements = announcements.filter((a) => {
    const authorStr = a.authorName || `${a.author?.firstName || ""} ${a.author?.lastName || ""}`.trim();
    return (
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      authorStr.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="flex h-full flex-col lg:flex-row gap-6 p-4 lg:p-6">
      {/* Left / List column */}
      <div className="flex-1 flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600/10 text-blue-600 dark:bg-blue-500/20">
              <Megaphone className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Company Announcements
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Official broadcasts, organizational updates, and department notices
              </p>
            </div>
          </div>

          {canPublish && (
            <Button
              onClick={() => setIsPublishModalOpen(true)}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5 shadow-sm"
            >
              <Plus className="h-4 w-4" />
              New Announcement
            </Button>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search announcements by title, author, or keyword..."
            className="pl-9 text-xs"
          />
        </div>

        {/* List of announcements */}
        {isLoading ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          </div>
        ) : filteredAnnouncements.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 p-6 text-center dark:border-slate-800">
            <Megaphone className="h-8 w-8 text-slate-400" />
            <p className="mt-2 text-sm font-medium text-slate-700 dark:text-slate-300">
              No announcements found
            </p>
            <p className="text-xs text-slate-400">
              Check back later for company broadcasts or start one above.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAnnouncements.map((ann) => {
              const isSelected = selectedAnnouncement?.id === ann.id;
              const authorLabel =
                ann.authorName ||
                `${ann.author?.firstName || ""} ${ann.author?.lastName || ""}`.trim() ||
                "Management";
              return (
                <div
                  key={ann.id}
                  onClick={() => handleSelectAnnouncement(ann)}
                  className={`cursor-pointer rounded-xl border p-4 transition-all duration-150 ${
                    isSelected
                      ? "border-blue-500 bg-blue-50/40 shadow-sm dark:border-blue-500/60 dark:bg-blue-950/20"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs dark:border-slate-800 dark:bg-slate-900/80 dark:hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                          ann.priority === "URGENT"
                            ? "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400"
                            : ann.priority === "IMPORTANT"
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400"
                            : "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400"
                        }`}
                      >
                        {ann.priority}
                      </span>
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                        Audience: {ann.audienceType || ann.audience || "ALL"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {ann.isRead ? (
                        <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                          <Check className="h-3 w-3" /> Read
                        </span>
                      ) : (
                        <span className="h-2 w-2 rounded-full bg-blue-600 ring-2 ring-blue-100 dark:ring-blue-900" />
                      )}
                    </div>
                  </div>

                  <h3 className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {ann.title}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-xs text-slate-600 dark:text-slate-400">
                    {ann.content}
                  </p>

                  <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-[9px] font-bold text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                        {authorLabel[0]?.toUpperCase()}
                      </div>
                      <span>{authorLabel}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span>{new Date(ann.publishedAt).toLocaleDateString()}</span>
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" /> {ann.readCount}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Right / Detail & Read tracking column */}
      <div className="w-full lg:w-96 flex flex-col rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900/90 shadow-xs">
        {selectedAnnouncement ? (
          <div className="space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div>
                <span
                  className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                    selectedAnnouncement.priority === "URGENT"
                      ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400"
                      : "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400"
                  }`}
                >
                  {selectedAnnouncement.priority}
                </span>
                <h3 className="mt-2 text-base font-bold text-slate-900 dark:text-slate-100">
                  {selectedAnnouncement.title}
                </h3>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                  {(
                    selectedAnnouncement.authorName ||
                    `${selectedAnnouncement.author?.firstName || ""} ${selectedAnnouncement.author?.lastName || ""}`.trim() ||
                    "M"
                  )[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">
                    {selectedAnnouncement.authorName ||
                      `${selectedAnnouncement.author?.firstName || ""} ${selectedAnnouncement.author?.lastName || ""}`.trim() ||
                      "Management"}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {new Date(selectedAnnouncement.publishedAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-slate-50 p-4 text-xs leading-relaxed text-slate-700 dark:bg-slate-800/60 dark:text-slate-300 whitespace-pre-wrap">
              {selectedAnnouncement.content}
            </div>

            {/* Read Telemetry for Admins */}
            {(canPublish || selectedAnnouncement.author.id === user?.employee?.id) && (
              <div className="mt-4 border-t border-slate-100 pt-4 dark:border-slate-800">
                <h4 className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                  <Eye className="h-3.5 w-3.5 text-blue-600" />
                  Read Tracking Statistics
                </h4>

                {isLoadingStats ? (
                  <div className="p-4 text-center">
                    <Loader2 className="mx-auto h-4 w-4 animate-spin text-blue-600" />
                  </div>
                ) : readStats ? (
                  <div className="mt-2 space-y-3">
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="rounded-md bg-slate-100 p-2 dark:bg-slate-800">
                        <p className="text-[10px] text-slate-500">Recipients</p>
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                          {readStats.totalRecipients}
                        </p>
                      </div>
                      <div className="rounded-md bg-emerald-50 p-2 dark:bg-emerald-950/40">
                        <p className="text-[10px] text-emerald-600">Read</p>
                        <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                          {readStats.readCount}
                        </p>
                      </div>
                      <div className="rounded-md bg-amber-50 p-2 dark:bg-amber-950/40">
                        <p className="text-[10px] text-amber-600">Unread</p>
                        <p className="text-sm font-bold text-amber-700 dark:text-amber-400">
                          {readStats.unreadCount}
                        </p>
                      </div>
                    </div>

                    {readStats.reads?.length > 0 && (
                      <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 text-[11px]">
                        <p className="pb-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                          Recent Readers
                        </p>
                        {readStats.reads.slice(0, 10).map((r: any) => (
                          <div key={r.employeeId} className="flex items-center justify-between py-1.5">
                            <span className="font-medium text-slate-700 dark:text-slate-300">
                              {r.name}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {new Date(r.readAt).toLocaleDateString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            )}
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center text-center text-slate-400">
            <Megaphone className="h-8 w-8 text-slate-300 dark:text-slate-600" />
            <p className="mt-2 text-xs">Select an announcement to view full details and tracking</p>
          </div>
        )}
      </div>

      {/* Publish Announcement Modal */}
      <Dialog open={isPublishModalOpen} onOpenChange={setIsPublishModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-blue-600" />
              Publish Company Announcement
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handlePublish} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Title <span className="text-red-500">*</span>
              </label>
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g., Annual Organization Strategy Meeting 2026"
                className="text-xs"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Priority
                </label>
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value as any)}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                >
                  <option value="NORMAL">Normal</option>
                  <option value="IMPORTANT">Important</option>
                  <option value="URGENT">Urgent Alert</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Audience
                </label>
                <select
                  value={newAudience}
                  onChange={(e) => setNewAudience(e.target.value as any)}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                >
                  <option value="ALL">Entire Organization</option>
                  <option value="DEPARTMENT">My Department</option>
                  <option value="ROLE">Management & Leads</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Content <span className="text-red-500">*</span>
              </label>
              <textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                rows={5}
                placeholder="Write the full announcement broadcast..."
                className="w-full rounded-md border border-slate-300 bg-white p-2.5 text-xs text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                required
              />
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsPublishModalOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting || !newTitle.trim() || !newContent.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  "Publish Broadcast"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
