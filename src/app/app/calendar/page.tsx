"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/page-header";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  MapPin,
  Video,
  Users,
  CheckSquare,
  AlertCircle,
  Sparkles,
  Layers,
  X,
  Tag,
  ExternalLink,
  Flame,
  Radio,
  Compass,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CalendarItem {
  id: string;
  title: string;
  description?: string | null;
  type: string;
  startDate: string;
  endDate: string;
  isAllDay: boolean;
  color: string;
  sourceEntity: string;
  sourceId: string;
  location?: string | null;
  meetUrl?: string | null;
  badgeLabel?: string;
  metadata?: Record<string, any>;
}

interface EmployeeOption {
  id: string;
  firstName: string;
  lastName: string;
  designation: string;
}

export default function CalendarPage() {
  const [today, setToday] = useState<Date>(new Date());
  const [currentTime, setCurrentTime] = useState<string>("");
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [events, setEvents] = useState<CalendarItem[]>([]);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"month" | "agenda">("month");

  // Keep live time and today reference in sync
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setToday(now);
      setCurrentTime(
        now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        })
      );
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Filter Stream Toggles
  const [activeFilters, setActiveFilters] = useState<Record<string, boolean>>({
    CURRENT_AFFAIR: true,
    MEETING: true,
    COMPANY_EVENT: true,
    CLIENT_MEETING: true,
    HOLIDAY: true,
    LEAVE: true,
    TASK_DUE: true,
    DEADLINE: true,
  });

  // Modals
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarItem | null>(null);

  // Form State
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newType, setNewType] = useState<"MEETING" | "COMPANY_EVENT" | "CLIENT_MEETING" | "DEADLINE">("MEETING");
  const [newStartDate, setNewStartDate] = useState(
    new Date().toISOString().slice(0, 16)
  );
  const [newEndDate, setNewEndDate] = useState(
    new Date(Date.now() + 3600000).toISOString().slice(0, 16)
  );
  const [newLocation, setNewLocation] = useState("");
  const [newMeetUrl, setNewMeetUrl] = useState("");
  const [selectedAttendees, setSelectedAttendees] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();

      // Range covers current month + padding
      const start = new Date(year, month - 1, 20);
      const end = new Date(year, month + 1, 10);

      const types = Object.keys(activeFilters).filter((k) => activeFilters[k]).join(",");
      const res = await fetch(
        `/api/calendar?startDate=${start.toISOString()}&endDate=${end.toISOString()}&types=${types}`
      );
      const data = await res.json();
      if (data.success) {
        setEvents(data.data.events);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await fetch("/api/employees?limit=50");
      const data = await res.json();
      if (data.success && data.data.employees) {
        setEmployees(data.data.employees);
      }
    } catch {}
  };

  useEffect(() => {
    fetchEvents();
  }, [currentDate, activeFilters]);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleToday = () => {
    const now = new Date();
    setCurrentDate(now);
  };

  const toggleFilter = (type: string) => {
    setActiveFilters((prev) => ({ ...prev, [type]: !prev[type] }));
  };

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!newTitle.trim()) {
      setFormError("Event title is required");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch("/api/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle,
          description: newDesc || undefined,
          type: newType,
          startDate: new Date(newStartDate).toISOString(),
          endDate: new Date(newEndDate).toISOString(),
          location: newLocation || undefined,
          meetUrl: newMeetUrl || undefined,
          attendees: selectedAttendees,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setFormError(data.error?.message || "Failed to schedule event");
        return;
      }

      setScheduleModalOpen(false);
      setNewTitle("");
      setNewDesc("");
      setNewLocation("");
      setNewMeetUrl("");
      setSelectedAttendees([]);
      fetchEvents();
    } catch (err: any) {
      setFormError(err.message || "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calendar Grid Calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const calendarCells = [];

  // Previous month padding
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const dayNum = daysInPrevMonth - i;
    calendarCells.push({
      date: new Date(year, month - 1, dayNum),
      isCurrentMonth: false,
      dayNum,
    });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    calendarCells.push({
      date: new Date(year, month, d),
      isCurrentMonth: true,
      dayNum: d,
    });
  }

  // Next month padding to complete 35 or 42 cells
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

  // Today specific calculations
  const todayDayName = today.toLocaleDateString("en-US", { weekday: "long" });
  const todayDateNum = today.getDate();
  const todayMonthName = today.toLocaleDateString("en-US", { month: "long" });
  const todayYear = today.getFullYear();
  const todayEvents = getEventsForDate(today);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Unified Corporate Calendar"
          description="Cross-functional aggregation of meetings, deliverables, company holidays, employee leaves, and current corporate affairs."
        />
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border border-slate-800 bg-[#0f172a] p-1">
            <button
              onClick={() => setViewMode("month")}
              className={cn(
                "rounded px-2.5 py-1 text-xs font-medium transition-colors",
                viewMode === "month" ? "bg-blue-600 text-white shadow" : "text-slate-400 hover:text-slate-200"
              )}
            >
              Month Grid
            </button>
            <button
              onClick={() => setViewMode("agenda")}
              className={cn(
                "rounded px-2.5 py-1 text-xs font-medium transition-colors",
                viewMode === "agenda" ? "bg-blue-600 text-white shadow" : "text-slate-400 hover:text-slate-200"
              )}
            >
              Agenda
            </button>
          </div>
          <button
            onClick={() => setScheduleModalOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-500 shadow-md shadow-blue-600/20 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Schedule Event</span>
          </button>
        </div>
      </div>

      {/* TODAY'S DATE, DAY & LIVE CURRENT AFFAIRS BANNER */}
      <div className="relative overflow-hidden rounded-2xl border border-blue-900/40 bg-gradient-to-r from-[#0d1627] via-[#0e1b33] to-[#091222] p-5 shadow-xl">
        <div className="absolute right-0 top-0 -mt-6 -mr-6 h-40 w-40 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Left: Prominent Date and Day */}
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl border border-blue-500/40 bg-blue-950/60 shadow-inner">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">
                {today.toLocaleDateString("en-US", { month: "short" })}
              </span>
              <span className="text-2xl font-black text-white leading-none">
                {todayDateNum}
              </span>
              <span className="text-[9px] font-medium text-slate-400">
                {todayYear}
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/15 border border-blue-400/30 px-2.5 py-0.5 text-[11px] font-bold text-blue-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  TODAY
                </span>
                <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                  <Clock className="h-3 w-3 text-slate-500" />
                  {currentTime || "Live Clock"}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight mt-1">
                {todayDayName},{" "}
                <span className="text-blue-400">{todayDateNum} {todayMonthName} {todayYear}</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {todayEvents.length > 0
                  ? `${todayEvents.length} corporate event${todayEvents.length > 1 ? "s" : ""} & observance${todayEvents.length > 1 ? "s" : ""} scheduled for today`
                  : "No scheduled conflicts for today. Full availability."}
              </p>
            </div>
          </div>

          {/* Right: Quick Today Jump & Action */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleToday}
              className="flex items-center gap-1.5 rounded-xl border border-blue-500/50 bg-blue-600/20 px-3.5 py-2 text-xs font-semibold text-blue-200 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
            >
              <CalendarIcon className="h-3.5 w-3.5" />
              <span>Jump to Today</span>
            </button>
          </div>
        </div>

        {/* Current Affairs & Events happening TODAY */}
        {todayEvents.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-800/80">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Flame className="h-3.5 w-3.5 text-amber-400" /> Today's Affairs & Highlights:
              </span>
              <span className="text-[10px] text-slate-400">Click any item for full details & virtual link</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5">
              {todayEvents.map((ev) => (
                <div
                  key={ev.id}
                  onClick={() => setSelectedEvent(ev)}
                  style={{ borderLeftColor: ev.color }}
                  className="group cursor-pointer rounded-xl border-l-4 border-slate-800 bg-[#070d18]/90 p-3 hover:bg-[#0b1526] hover:border-slate-700 transition-all shadow-md"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      style={{ backgroundColor: `${ev.color}20`, color: ev.color }}
                      className="rounded px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider"
                    >
                      {ev.badgeLabel || ev.type}
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Clock className="h-3 w-3 text-slate-500" />
                      {ev.isAllDay
                        ? "All Day"
                        : `${new Date(ev.startDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-slate-100 mt-1.5 group-hover:text-blue-300 transition-colors line-clamp-1">
                    {ev.title}
                  </h4>

                  {ev.description && (
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {ev.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/50 text-[10px] text-slate-500">
                    <span className="truncate max-w-[180px]">
                      {ev.location || "Online Corporate Portal"}
                    </span>
                    {ev.meetUrl && (
                      <span className="text-blue-400 font-semibold flex items-center gap-1">
                        <Video className="h-3 w-3" /> Virtual Room
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Stream Filter Pills */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-800 bg-[#0f172a]/90 p-3 shadow-md">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-2 flex items-center gap-1">
          <Layers className="h-3.5 w-3.5 text-blue-400" /> Event Streams:
        </span>
        {[
          { key: "CURRENT_AFFAIR", label: "Current Affairs & Observances", color: "bg-amber-400" },
          { key: "MEETING", label: "Meetings", color: "bg-blue-500" },
          { key: "COMPANY_EVENT", label: "Company Events", color: "bg-purple-500" },
          { key: "CLIENT_MEETING", label: "Client Demos", color: "bg-cyan-500" },
          { key: "HOLIDAY", label: "Holidays", color: "bg-emerald-500" },
          { key: "LEAVE", label: "Employee Leaves", color: "bg-fuchsia-500" },
          { key: "TASK_DUE", label: "Tasks Due", color: "bg-amber-500" },
          { key: "DEADLINE", label: "Statutory Deadlines", color: "bg-rose-500" },
        ].map((stream) => {
          const active = activeFilters[stream.key];
          return (
            <button
              key={stream.key}
              onClick={() => toggleFilter(stream.key)}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium transition-all",
                active
                  ? "bg-slate-800 text-white border border-slate-700 shadow-sm"
                  : "bg-slate-900/60 text-slate-500 border border-transparent opacity-60 hover:opacity-100"
              )}
            >
              <span className={cn("h-2 w-2 rounded-full", stream.color)} />
              <span>{stream.label}</span>
            </button>
          );
        })}
      </div>

      {/* Calendar Controls */}
      <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-[#0c1322] px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <h2 className="text-base sm:text-lg font-extrabold text-white tracking-tight flex items-center gap-2">
            <span>{monthNames[month]} {year}</span>
          </h2>
          <button
            onClick={handleToday}
            className="rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
          >
            Today ({todayDayName.slice(0, 3)}, {todayDateNum} {today.toLocaleDateString("en-US", { month: "short" })})
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handlePrevMonth}
            aria-label="Previous month"
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={handleNextMonth}
            aria-label="Next month"
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Main Month Grid View */}
      {viewMode === "month" ? (
        <div className="rounded-xl border border-slate-800 bg-[#0c1322] overflow-hidden shadow-2xl">
          {/* Weekday Headers */}
          <div className="grid grid-cols-7 border-b border-slate-800 bg-[#0f172a] text-center text-[11px] font-bold text-slate-400 py-2.5">
            {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((dayName, idx) => {
              const isTodayWeekday =
                today.getDay() === idx &&
                currentDate.getMonth() === today.getMonth() &&
                currentDate.getFullYear() === today.getFullYear();

              return (
                <div
                  key={dayName}
                  className={cn(
                    "transition-colors",
                    isTodayWeekday ? "text-blue-400 font-extrabold" : ""
                  )}
                >
                  {dayName}
                </div>
              );
            })}
          </div>

          {/* Day Cells Grid */}
          <div className="grid grid-cols-7 divide-x divide-y divide-slate-800/80">
            {calendarCells.map((cell, idx) => {
              const dayEvents = getEventsForDate(cell.date);
              const isToday =
                cell.date.getFullYear() === today.getFullYear() &&
                cell.date.getMonth() === today.getMonth() &&
                cell.date.getDate() === today.getDate();

              return (
                <div
                  key={idx}
                  className={cn(
                    "min-h-32 p-2 transition-all flex flex-col justify-between relative",
                    isToday
                      ? "bg-gradient-to-b from-blue-950/40 to-slate-900/90 ring-2 ring-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.25)] z-10"
                      : cell.isCurrentMonth
                      ? "bg-[#0b111e]/90 hover:bg-[#0e1626]/80"
                      : "bg-[#070b14]/50 opacity-40"
                  )}
                >
                  {/* Date Header */}
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={cn(
                          "flex h-7 w-7 items-center justify-center rounded-full text-xs transition-all",
                          isToday
                            ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-extrabold ring-2 ring-blue-400 ring-offset-1 ring-offset-[#0c1322] shadow-md"
                            : cell.isCurrentMonth
                            ? "text-slate-300 font-medium"
                            : "text-slate-600"
                        )}
                      >
                        {cell.dayNum}
                      </span>
                      {isToday && (
                        <span className="rounded bg-blue-500/25 border border-blue-400/50 px-1.5 py-0.5 text-[9px] font-extrabold text-blue-300 uppercase tracking-wider animate-pulse">
                          TODAY
                        </span>
                      )}
                    </div>

                    {dayEvents.length > 3 && (
                      <span className="text-[9px] text-slate-500 font-semibold bg-slate-800/70 px-1.5 py-0.5 rounded">
                        +{dayEvents.length - 3} more
                      </span>
                    )}
                  </div>

                  {/* Events in Cell */}
                  <div className="space-y-1 overflow-y-auto max-h-28 pr-0.5">
                    {dayEvents.slice(0, 3).map((ev) => (
                      <div
                        key={ev.id}
                        onClick={() => setSelectedEvent(ev)}
                        style={{ borderLeftColor: ev.color }}
                        className="cursor-pointer truncate rounded border-l-2 bg-slate-900/95 px-1.5 py-1 text-[10px] font-medium text-slate-200 hover:bg-slate-800 hover:text-white transition-colors shadow-sm"
                        title={`${ev.title} (${ev.badgeLabel || ev.type})`}
                      >
                        <span className="mr-1 opacity-70">
                          {ev.isAllDay ? "•" : new Date(ev.startDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                        {ev.title}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Agenda View */
        <div className="rounded-xl border border-slate-800 bg-[#0c1322] divide-y divide-slate-800/80 overflow-hidden shadow-2xl">
          {events.length === 0 ? (
            <div className="p-16 text-center text-xs text-slate-500">
              No calendar events in the selected filter window.
            </div>
          ) : (
            events.map((ev) => (
              <div
                key={ev.id}
                onClick={() => setSelectedEvent(ev)}
                className="flex items-start justify-between gap-4 p-4 hover:bg-slate-800/40 cursor-pointer transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div
                    style={{ backgroundColor: `${ev.color}20`, borderColor: ev.color }}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border text-xs font-extrabold shadow-sm"
                  >
                    <span style={{ color: ev.color }}>{ev.badgeLabel?.[0] || "E"}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs sm:text-sm font-bold text-slate-100">{ev.title}</h4>
                      <span
                        style={{ backgroundColor: `${ev.color}20`, color: ev.color }}
                        className="rounded px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider"
                      >
                        {ev.badgeLabel}
                      </span>
                    </div>
                    {ev.description && (
                      <p className="text-[11px] text-slate-400 mt-1 max-w-2xl leading-relaxed">{ev.description}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-[10px] text-slate-500">
                      <span className="flex items-center gap-1 font-medium text-slate-300">
                        <Clock className="h-3 w-3 text-slate-400" />
                        {new Date(ev.startDate).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                        {" • "}
                        {ev.isAllDay ? "All Day" : new Date(ev.startDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      {ev.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-slate-400" /> {ev.location}
                        </span>
                      )}
                      {ev.meetUrl && (
                        <span className="flex items-center gap-1 text-blue-400 font-semibold">
                          <Video className="h-3 w-3" /> Virtual Meeting
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <ChevronRight className="h-4 w-4 text-slate-600 mt-2 shrink-0" />
              </div>
            ))
          )}
        </div>
      )}

      {/* Event Details Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-[#0f172a] p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-start justify-between pb-3 border-b border-slate-800 mb-4">
              <div>
                <span
                  style={{ backgroundColor: `${selectedEvent.color}20`, color: selectedEvent.color }}
                  className="rounded px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                >
                  {selectedEvent.badgeLabel}
                </span>
                <h3 className="text-base font-extrabold text-white mt-2 leading-snug">{selectedEvent.title}</h3>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {selectedEvent.description && (
                <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3.5 text-slate-300 leading-relaxed">
                  {selectedEvent.description}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 text-slate-400">
                <div className="rounded-xl border border-slate-800/80 bg-slate-900/50 p-3">
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Date & Time</span>
                  <p className="text-slate-100 font-bold mt-1 text-xs">
                    {new Date(selectedEvent.startDate).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {selectedEvent.isAllDay
                      ? "All Day Event"
                      : `${new Date(selectedEvent.startDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - ${new Date(selectedEvent.endDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-800/80 bg-slate-900/50 p-3">
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Stream & Entity</span>
                  <p className="text-slate-100 font-bold mt-1 text-xs">{selectedEvent.sourceEntity}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">ID: {selectedEvent.sourceId.slice(-8)}</p>
                </div>
              </div>

              {selectedEvent.location && (
                <div className="flex items-center gap-2 text-slate-300 bg-slate-900/40 p-2.5 rounded-lg border border-slate-800">
                  <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
                  <span className="font-medium">{selectedEvent.location}</span>
                </div>
              )}

              {selectedEvent.meetUrl && (
                <div className="flex items-center justify-between rounded-xl border border-blue-900/50 bg-blue-950/30 p-3 text-blue-400">
                  <div className="flex items-center gap-2">
                    <Video className="h-4 w-4" />
                    <span className="font-semibold text-xs">Virtual Meeting Link</span>
                  </div>
                  <a
                    href={selectedEvent.meetUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-500 shadow-sm transition-colors"
                  >
                    Join Session <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedEvent(null)}
                className="rounded-lg border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Event Modal */}
      {scheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-[#0f172a] p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-blue-500" />
                <h3 className="text-sm font-bold text-white">Schedule Meeting or Company Event</h3>
              </div>
              <button
                onClick={() => setScheduleModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 rounded-lg bg-rose-500/10 border border-rose-500/30 p-2.5 text-xs text-rose-400">
                {formError}
              </div>
            )}

            <form onSubmit={handleScheduleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-300 mb-1">Event Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Q4 Executive Product Strategy Review"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Category</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as any)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="MEETING">Team Meeting</option>
                    <option value="COMPANY_EVENT">Company Event / Current Affairs</option>
                    <option value="CLIENT_MEETING">Client Meeting</option>
                    <option value="DEADLINE">Milestone / Deadline</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-300 mb-1">Location</label>
                  <input
                    type="text"
                    placeholder="Executive Boardroom or Zoom"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Start Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={newStartDate}
                    onChange={(e) => setNewStartDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-300 mb-1">End Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={newEndDate}
                    onChange={(e) => setNewEndDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Video Meeting Link (Optional)</label>
                <input
                  type="url"
                  placeholder="https://meet.nfvs.internal/..."
                  value={newMeetUrl}
                  onChange={(e) => setNewMeetUrl(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Invite Attendees (Notified via In-App Alerts)</label>
                <select
                  multiple
                  value={selectedAttendees}
                  onChange={(e) => {
                    const options = Array.from(e.target.selectedOptions, (option) => option.value);
                    setSelectedAttendees(options);
                  }}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 p-2 text-slate-200 h-24 focus:border-blue-500 focus:outline-none"
                >
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id} className="p-1">
                      {emp.firstName} {emp.lastName} ({emp.designation})
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-slate-500 mt-1 block">Hold Ctrl / Cmd to select multiple attendees.</span>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Meeting agenda and preparation notes..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setScheduleModalOpen(false)}
                  className="rounded-lg border border-slate-700 px-4 py-2 font-medium text-slate-300 hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-500 transition-colors shadow-md disabled:opacity-50"
                >
                  {isSubmitting ? "Scheduling..." : "Schedule Event"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
