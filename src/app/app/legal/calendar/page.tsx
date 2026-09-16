"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { LegalNav } from "@/modules/legal/components/legal-nav";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Clock,
  Scale,
  FileText,
  ShieldCheck,
  ExternalLink,
} from "lucide-react";

export default function LegalCalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"month" | "agenda">("month");

  useEffect(() => {
    fetchEvents();
  }, [currentDate]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const start = new Date(year, month, 1).toISOString();
      const end = new Date(year, month + 1, 0, 23, 59, 59).toISOString();

      const res = await fetch(`/api/legal/calendar?startDate=${start}&endDate=${end}`);
      const json = await res.json();
      if (json.success) {
        setEvents(json.data);
      }
    } catch (err) {
      console.error("Error fetching legal calendar:", err);
    } finally {
      setLoading(false);
    }
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToday = () => {
    setCurrentDate(new Date());
  };

  // Month Grid Calculation
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const days: { dayNumber: number; dateStr: string; isCurrentMonth: boolean }[] = [];
  // Days from previous month
  const prevMonthDays = new Date(year, month, 0).getDate();
  for (let i = firstDay - 1; i >= 0; i--) {
    const d = prevMonthDays - i;
    const m = month === 0 ? 12 : month;
    const y = month === 0 ? year - 1 : year;
    days.push({
      dayNumber: d,
      dateStr: `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
      isCurrentMonth: false,
    });
  }

  // Days in current month
  for (let d = 1; d <= daysInMonth; d++) {
    const m = month + 1;
    days.push({
      dayNumber: d,
      dateStr: `${year}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
      isCurrentMonth: true,
    });
  }

  // Next month padding to 35 or 42
  const remaining = 35 - days.length >= 0 ? 35 - days.length : 42 - days.length;
  for (let d = 1; d <= remaining; d++) {
    const m = month + 2 > 12 ? 1 : month + 2;
    const y = month + 2 > 12 ? year + 1 : year;
    days.push({
      dayNumber: d,
      dateStr: `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
      isCurrentMonth: false,
    });
  }

  const monthName = currentDate.toLocaleString("default", { month: "long", year: "numeric" });
  const todayStr = new Date().toISOString().split("T")[0];

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Legal Master Calendar"
          description="Unified calendar aggregation for court hearings, litigation filings, contract expiration horizons, and statutory compliance due dates."
        />
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border border-slate-800 bg-[#0d131f] p-1">
            <button
              onClick={() => setViewMode("month")}
              className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
                viewMode === "month" ? "bg-amber-600 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              Month View
            </button>
            <button
              onClick={() => setViewMode("agenda")}
              className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
                viewMode === "agenda" ? "bg-amber-600 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              Agenda
            </button>
          </div>
        </div>
      </div>

      <LegalNav />

      {/* Month Navigation Strip */}
      <div className="rounded-xl border border-slate-800 bg-[#0d131f] p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-amber-400" />
            {monthName}
          </h2>
          <button
            onClick={goToday}
            className="rounded border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-300 hover:bg-slate-700"
          >
            Today
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={prevMonth}
            className="rounded-lg border border-slate-800 bg-slate-900/80 p-2 text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={nextMonth}
            className="rounded-lg border border-slate-800 bg-slate-900/80 p-2 text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <RefreshCw className="h-6 w-6 animate-spin text-amber-500" />
        </div>
      ) : viewMode === "month" ? (
        /* Month Grid */
        <div className="rounded-xl border border-slate-800 bg-[#0d131f] overflow-hidden">
          {/* Day Headers */}
          <div className="grid grid-cols-7 border-b border-slate-800 bg-slate-900/60 text-center text-xs font-semibold text-slate-400 py-2.5">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 divide-x divide-y divide-slate-800/80">
            {days.map((d, idx) => {
              const dayEvents = events.filter((ev) => ev.startDate.startsWith(d.dateStr));
              const isToday = d.dateStr === todayStr;

              return (
                <div
                  key={idx}
                  className={`min-h-[110px] p-2 space-y-1 transition-colors ${
                    d.isCurrentMonth ? "bg-transparent" : "bg-slate-950/40 opacity-40"
                  } ${isToday ? "ring-1 ring-amber-500/50 bg-amber-500/5" : ""}`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`inline-block rounded-full h-5 w-5 text-center text-xs font-semibold leading-5 ${
                        isToday ? "bg-amber-500 text-black font-bold" : "text-slate-400"
                      }`}
                    >
                      {d.dayNumber}
                    </span>
                    {dayEvents.length > 0 && (
                      <span className="text-[10px] text-slate-500">{dayEvents.length} events</span>
                    )}
                  </div>

                  {/* Day Events */}
                  <div className="space-y-1 mt-1">
                    {dayEvents.slice(0, 3).map((ev) => (
                      <Link
                        key={ev.id}
                        href={ev.metadata?.actionUrl || "#"}
                        className="block rounded px-1.5 py-0.5 text-[10px] font-medium truncate transition-opacity hover:opacity-80"
                        style={{
                          backgroundColor: `${ev.color}25`,
                          color: ev.color,
                          borderLeft: `2px solid ${ev.color}`,
                        }}
                      >
                        {ev.title}
                      </Link>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-[9px] text-slate-500 text-center font-medium">
                        +{dayEvents.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Agenda View */
        <div className="rounded-xl border border-slate-800 bg-[#0d131f] p-5 space-y-3">
          <h3 className="text-sm font-semibold text-white">Month Schedule & Agenda</h3>
          {events.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-8 text-center">No scheduled events or deadlines this month.</p>
          ) : (
            <div className="space-y-2">
              {events.map((ev) => (
                <div
                  key={ev.id}
                  className="rounded-lg border border-slate-800 bg-slate-900/40 p-3 text-xs flex items-center justify-between"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="h-2.5 w-2.5 rounded-full mt-1 shrink-0"
                      style={{ backgroundColor: ev.color }}
                    />
                    <div>
                      <h4 className="font-semibold text-slate-200">{ev.title}</h4>
                      <p className="text-slate-400 text-[11px] mt-0.5">{ev.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-amber-400">
                      {new Date(ev.startDate).toLocaleDateString()}
                    </span>
                    {ev.metadata?.actionUrl && (
                      <Link
                        href={ev.metadata.actionUrl}
                        className="rounded border border-slate-700 bg-slate-800 p-1 text-slate-300 hover:text-white"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
