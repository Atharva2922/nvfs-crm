"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { OperationsNav } from "@/modules/operations/components/operations-nav";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Layers,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Filter,
} from "lucide-react";

export default function OperationsCalendarPage() {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"month" | "week" | "day">("month");
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);

  useEffect(() => {
    fetchEvents();
  }, [currentDate, viewMode]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const start = new Date(year, month - 1, 15);
      const end = new Date(year, month + 2, 15);

      const res = await fetch(`/api/operations/calendar?startDate=${start.toISOString()}&endDate=${end.toISOString()}`);
      const json = await res.json();
      if (json.success) {
        setEvents(json.data.events || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const nextPeriod = () => {
    if (viewMode === "month") {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    } else if (viewMode === "week") {
      setCurrentDate(new Date(currentDate.getTime() + 7 * 86400000));
    } else {
      setCurrentDate(new Date(currentDate.getTime() + 86400000));
    }
  };

  const prevPeriod = () => {
    if (viewMode === "month") {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    } else if (viewMode === "week") {
      setCurrentDate(new Date(currentDate.getTime() - 7 * 86400000));
    } else {
      setCurrentDate(new Date(currentDate.getTime() - 86400000));
    }
  };

  // Month calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const calendarCells = [];
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const dayNum = daysInPrevMonth - i;
    calendarCells.push({
      date: new Date(year, month - 1, dayNum),
      isCurrentMonth: false,
      dayNum,
    });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarCells.push({
      date: new Date(year, month, d),
      isCurrentMonth: true,
      dayNum: d,
    });
  }
  const remaining = 35 - calendarCells.length;
  for (let n = 1; n <= (remaining > 0 ? remaining : 42 - calendarCells.length); n++) {
    calendarCells.push({
      date: new Date(year, month + 1, n),
      isCurrentMonth: false,
      dayNum: n,
    });
  }

  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0];
    return events.filter((ev) => {
      const evStart = ev.startDate.split("T")[0];
      const evEnd = ev.endDate.split("T")[0];
      return dateStr >= evStart && dateStr <= evEnd;
    });
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Operational Execution Calendar"
        description="Unified schedule of operation project milestones, SLA delivery dates, and task completion gates."
      />

      <OperationsNav />

      {/* Calendar Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-800 bg-[#0c121e] p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <button
              onClick={prevPeriod}
              className="rounded-lg border border-slate-800 bg-slate-900 p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1 text-xs text-slate-300 hover:bg-slate-800"
            >
              Today
            </button>
            <button
              onClick={nextPeriod}
              className="rounded-lg border border-slate-800 bg-slate-900 p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <h2 className="text-base font-bold text-white">
            {monthNames[month]} {year}
          </h2>
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 p-1">
          <button
            onClick={() => setViewMode("month")}
            className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
              viewMode === "month" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            Month
          </button>
          <button
            onClick={() => setViewMode("week")}
            className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
              viewMode === "week" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setViewMode("day")}
            className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
              viewMode === "day" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            Day
          </button>
        </div>
      </div>

      {/* MONTH VIEW */}
      {viewMode === "month" && (
        <div className="rounded-xl border border-slate-800 bg-[#0c121e] overflow-hidden shadow-sm">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 border-b border-slate-800 bg-slate-900/60 text-center text-[11px] font-semibold uppercase text-slate-400 py-2.5">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>

          {/* Day Grid */}
          <div className="grid grid-cols-7 divide-x divide-y divide-slate-800/60">
            {calendarCells.map((cell, idx) => {
              const dayEvents = getEventsForDate(cell.date);
              const isToday = cell.date.toDateString() === new Date().toDateString();

              return (
                <div
                  key={idx}
                  className={`min-h-[110px] p-1.5 transition-colors ${
                    cell.isCurrentMonth ? "bg-[#0c121e]" : "bg-slate-950/40 text-slate-600"
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span
                      className={`text-xs font-mono font-medium rounded-full h-5 w-5 flex items-center justify-center ${
                        isToday ? "bg-blue-600 text-white font-bold" : cell.isCurrentMonth ? "text-slate-300" : "text-slate-600"
                      }`}
                    >
                      {cell.dayNum}
                    </span>
                    {dayEvents.length > 0 && (
                      <span className="text-[10px] font-mono text-slate-500">{dayEvents.length} items</span>
                    )}
                  </div>

                  <div className="space-y-1">
                    {dayEvents.slice(0, 3).map((ev) => (
                      <div
                        key={ev.id}
                        onClick={() => setSelectedEvent(ev)}
                        className="cursor-pointer truncate rounded px-1.5 py-0.5 text-[10px] font-medium transition-opacity hover:opacity-80"
                        style={{
                          backgroundColor: `${ev.color}20`,
                          color: ev.color,
                          borderLeft: `2px solid ${ev.color}`,
                        }}
                      >
                        {ev.title}
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <span className="text-[9px] text-slate-500 pl-1 block">+{dayEvents.length - 3} more</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* WEEK & DAY VIEWS: Agenda Style */}
      {(viewMode === "week" || viewMode === "day") && (
        <div className="rounded-xl border border-slate-800 bg-[#0c121e] p-5 shadow-sm space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Scheduled Operational Events</h3>
          <div className="space-y-2">
            {events.length === 0 ? (
              <div className="text-xs text-slate-500 py-6 text-center">No operational milestones in this window.</div>
            ) : (
              events.map((ev) => (
                <div
                  key={ev.id}
                  onClick={() => setSelectedEvent(ev)}
                  className="cursor-pointer flex items-center justify-between rounded-lg border border-slate-800/80 bg-slate-900/60 p-3 hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: ev.color }} />
                    <div>
                      <div className="font-semibold text-white text-xs">{ev.title}</div>
                      <div className="text-[10px] text-slate-400">{ev.description}</div>
                    </div>
                  </div>

                  <div className="text-right text-xs">
                    <span className="text-slate-300 font-mono">{new Date(ev.startDate).toLocaleDateString()}</span>
                    <span className="rounded border border-slate-700 bg-slate-800 px-1.5 py-0.5 text-[9px] block text-slate-400 mt-1">
                      {ev.badgeLabel || "Event"}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* EVENT DETAIL POPUP */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-800 bg-[#0f172a] p-5 shadow-2xl space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-mono uppercase text-blue-400">{selectedEvent.badgeLabel}</span>
                <h3 className="text-sm font-bold text-white mt-0.5">{selectedEvent.title}</h3>
              </div>
              <button onClick={() => setSelectedEvent(null)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300 whitespace-pre-wrap">{selectedEvent.description}</p>

            <div className="space-y-1.5 text-xs text-slate-400 border-t border-slate-800 pt-3">
              <div className="flex justify-between">
                <span>Date:</span>
                <span className="text-slate-200 font-mono">
                  {new Date(selectedEvent.startDate).toLocaleDateString()}
                </span>
              </div>
              {selectedEvent.metadata?.ownerName && (
                <div className="flex justify-between">
                  <span>Lead:</span>
                  <span className="text-slate-200">{selectedEvent.metadata.ownerName}</span>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              {selectedEvent.metadata?.actionUrl && (
                <Link
                  href={selectedEvent.metadata.actionUrl}
                  className="rounded bg-blue-600 hover:bg-blue-500 px-3 py-1 text-xs font-semibold text-white flex items-center gap-1"
                >
                  Open Workspace <ExternalLink className="h-3 w-3" />
                </Link>
              )}
              <button
                onClick={() => setSelectedEvent(null)}
                className="rounded border border-slate-700 bg-slate-800 px-3 py-1 text-xs text-slate-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
