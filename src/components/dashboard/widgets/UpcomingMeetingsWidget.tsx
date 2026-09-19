"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Calendar as CalendarIcon, Video, MapPin, ArrowRight } from "lucide-react";

export interface MeetingItem {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  type: string;
  location?: string | null;
  meetUrl?: string | null;
}

interface UpcomingMeetingsWidgetProps {
  initialMeetings?: MeetingItem[];
}

export function UpcomingMeetingsWidget({ initialMeetings }: UpcomingMeetingsWidgetProps = {}) {
  const [meetings, setMeetings] = useState<MeetingItem[]>(initialMeetings || []);
  const [loading, setLoading] = useState(!initialMeetings);

  useEffect(() => {
    if (initialMeetings) return;
    async function fetchMeetings() {
      try {
        setLoading(true);
        const res = await fetch("/api/calendar/upcoming");
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            setMeetings(Array.isArray(json.data) ? json.data : []);
          }
        }
      } catch (err) {
        console.error("Failed to fetch upcoming meetings:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchMeetings();
  }, [initialMeetings]);

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 shadow-xs transition-all hover:shadow-md">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800/60">
            <CalendarIcon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Upcoming Events</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Scheduled calendar items</p>
          </div>
        </div>
        <Link
          href="/app/calendar"
          className="flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-amber-400 hover:underline"
        >
          View Calendar <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {loading ? (
        <div className="py-6 text-center text-xs text-slate-400">Loading schedule...</div>
      ) : !Array.isArray(meetings) || meetings.length === 0 ? (
        <div className="py-6 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-lg">
          No upcoming meetings today
        </div>
      ) : (
        <div className="space-y-2">
          {meetings.slice(0, 3).map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs"
            >
              <div className="truncate pr-2">
                <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">{item.title}</p>
                <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                  <span className="font-mono">
                    {new Date(item.startDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  {item.meetUrl ? (
                    <span className="flex items-center gap-1 text-purple-500 font-medium">
                      <Video className="h-3 w-3" /> Virtual
                    </span>
                  ) : item.location ? (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {item.location}
                    </span>
                  ) : null}
                </div>
              </div>
              {item.meetUrl && (
                <a
                  href={item.meetUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-[10px] font-semibold transition-colors"
                >
                  Join
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
