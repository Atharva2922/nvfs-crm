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
  const [currentDate, setCurrentDate] = useState(new Date(2026, 8, 1)); // September 2026 (seed reference)
  const [events, setEvents] = useState<CalendarItem[]>([]);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"month" | "agenda">("month");

  // Filter Stream Toggles
  const [activeFilters, setActiveFilters] = useState<Record<string, boolean>>({
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
  const [newStartDate, setNewStartDate] = useState("2026-09-20T10:00");
  const [newEndDate, setNewEndDate] = useState("2026-09-20T11:00");
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
    setCurrentDate(new Date(2026, 8, 1));
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

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Unified Corporate Calendar"
          description="Cross-functional aggregation of meetings, deliverables, company holidays, employee leaves, and statutory deadlines."
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

      {/* Stream Filter Pills */}
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-800 bg-[#0f172a]/90 p-3">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mr-2 flex items-center gap-1">
          <Layers className="h-3 w-3" /> Event Streams:
        </span>
        {[
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
                "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium transition-all",
                active
                  ? "bg-slate-800 text-white border border-slate-700 shadow-sm"
                  : "bg-slate-900/60 text-slate-500 border border-transparent opacity-60"
              )}
            >
              <span className={cn("h-2 w-2 rounded-full", stream.color)} />
              <span>{stream.label}</span>
            </button>
          );
        })}
      </div>

      {/* Calendar Controls */}
      <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-[#0c1322] px-4 py-3">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-bold text-white tracking-tight">
            {monthNames[month]} {year}
          </h2>
          <button
            onClick={handleToday}
            className="rounded-md border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-xs font-medium text-slate-200 hover:bg-slate-700 transition-colors"
          >
            Today (Sep 2026)
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handlePrevMonth}
            className="rounded p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={handleNextMonth}
            className="rounded p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Main Month Grid View */}
      {viewMode === "month" ? (
        <div className="rounded-xl border border-slate-800 bg-[#0c1322] overflow-hidden">
          {/* Weekday Headers */}
          <div className="grid grid-cols-7 border-b border-slate-800 bg-[#0f172a] text-center text-[11px] font-semibold text-slate-400 py-2">
            <div>SUN</div>
            <div>MON</div>
            <div>TUE</div>
            <div>WED</div>
            <div>THU</div>
            <div>FRI</div>
            <div>SAT</div>
          </div>

          {/* Day Cells Grid */}
          <div className="grid grid-cols-7 divide-x divide-y divide-slate-800/80">
            {calendarCells.map((cell, idx) => {
              const dayEvents = getEventsForDate(cell.date);
              const isToday =
                cell.date.getFullYear() === 2026 &&
                cell.date.getMonth() === 8 &&
                cell.dayNum === 9;

              return (
                <div
                  key={idx}
                  className={cn(
                    "min-h-28 p-1.5 transition-colors flex flex-col justify-between",
                    cell.isCurrentMonth ? "bg-[#0b111e]/80" : "bg-[#070b14]/50 opacity-40"
                  )}
                >
                  {/* Date Header */}
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={cn(
                        "flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold",
                        isToday
                          ? "bg-blue-600 text-white font-bold"
                          : cell.isCurrentMonth
                          ? "text-slate-300"
                          : "text-slate-600"
                      )}
                    >
                      {cell.dayNum}
                    </span>
                    {dayEvents.length > 3 && (
                      <span className="text-[9px] text-slate-500 font-medium">
                        +{dayEvents.length - 2} more
                      </span>
                    )}
                  </div>

                  {/* Events in Cell */}
                  <div className="space-y-1 overflow-y-auto max-h-24">
                    {dayEvents.slice(0, 3).map((ev) => (
                      <div
                        key={ev.id}
                        onClick={() => setSelectedEvent(ev)}
                        style={{ borderLeftColor: ev.color }}
                        className="cursor-pointer truncate rounded border-l-2 bg-slate-900/90 px-1.5 py-0.5 text-[10px] font-medium text-slate-200 hover:bg-slate-800 transition-colors"
                        title={ev.title}
                      >
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
        <div className="rounded-xl border border-slate-800 bg-[#0c1322] divide-y divide-slate-800/80 overflow-hidden">
          {events.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500">
              No calendar events in the selected filter window.
            </div>
          ) : (
            events.map((ev) => (
              <div
                key={ev.id}
                onClick={() => setSelectedEvent(ev)}
                className="flex items-start justify-between gap-4 p-4 hover:bg-slate-800/30 cursor-pointer transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div
                    style={{ backgroundColor: `${ev.color}20`, borderColor: ev.color }}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border text-xs font-bold"
                  >
                    <span style={{ color: ev.color }}>{ev.badgeLabel?.[0] || "E"}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-semibold text-slate-100">{ev.title}</h4>
                      <span
                        style={{ backgroundColor: `${ev.color}20`, color: ev.color }}
                        className="rounded px-2 py-0.5 text-[9px] font-semibold uppercase"
                      >
                        {ev.badgeLabel}
                      </span>
                    </div>
                    {ev.description && (
                      <p className="text-[11px] text-slate-400 mt-1">{ev.description}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-[10px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(ev.startDate).toLocaleDateString()} {new Date(ev.startDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      {ev.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {ev.location}
                        </span>
                      )}
                      {ev.meetUrl && (
                        <span className="flex items-center gap-1 text-blue-400">
                          <Video className="h-3 w-3" /> Virtual Meeting
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <ChevronRight className="h-4 w-4 text-slate-600 mt-2" />
              </div>
            ))
          )}
        </div>
      )}

      {/* Event Details Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-xl border border-slate-800 bg-[#0f172a] p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-start justify-between pb-3 border-b border-slate-800 mb-4">
              <div>
                <span
                  style={{ backgroundColor: `${selectedEvent.color}20`, color: selectedEvent.color }}
                  className="rounded px-2 py-0.5 text-[10px] font-semibold uppercase"
                >
                  {selectedEvent.badgeLabel}
                </span>
                <h3 className="text-sm font-bold text-white mt-1.5">{selectedEvent.title}</h3>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {selectedEvent.description && (
                <div className="rounded-lg border border-slate-800 bg-slate-950 p-3 text-slate-300">
                  {selectedEvent.description}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 text-slate-400">
                <div className="rounded-lg border border-slate-800/60 bg-slate-900/40 p-2.5">
                  <span className="text-[10px] uppercase font-semibold text-slate-500">Date & Time</span>
                  <p className="text-slate-200 font-medium mt-0.5">
                    {new Date(selectedEvent.startDate).toLocaleDateString()}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {selectedEvent.isAllDay
                      ? "All Day"
                      : `${new Date(selectedEvent.startDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - ${new Date(selectedEvent.endDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}
                  </p>
                </div>

                <div className="rounded-lg border border-slate-800/60 bg-slate-900/40 p-2.5">
                  <span className="text-[10px] uppercase font-semibold text-slate-500">Source Module</span>
                  <p className="text-slate-200 font-medium mt-0.5">{selectedEvent.sourceEntity}</p>
                </div>
              </div>

              {selectedEvent.location && (
                <div className="flex items-center gap-2 text-slate-300">
                  <MapPin className="h-3.5 w-3.5 text-slate-500" />
                  <span>{selectedEvent.location}</span>
                </div>
              )}

              {selectedEvent.meetUrl && (
                <div className="flex items-center justify-between rounded-lg border border-blue-900/40 bg-blue-950/20 p-2.5 text-blue-400">
                  <div className="flex items-center gap-2">
                    <Video className="h-4 w-4" />
                    <span>Virtual Conference Room</span>
                  </div>
                  <a
                    href={selectedEvent.meetUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-semibold hover:underline"
                  >
                    Join <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedEvent(null)}
                className="rounded-lg border border-slate-700 px-4 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Event Modal */}
      {scheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-xl border border-slate-800 bg-[#0f172a] p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-blue-500" />
                <h3 className="text-sm font-semibold text-white">Schedule Meeting or Company Event</h3>
              </div>
              <button
                onClick={() => setScheduleModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 rounded-md bg-rose-500/10 border border-rose-500/30 p-2.5 text-xs text-rose-400">
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
                  className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Category</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as any)}
                    className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="MEETING">Team Meeting</option>
                    <option value="COMPANY_EVENT">Company Event</option>
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
                    className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
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
                    className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-300 mb-1">End Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={newEndDate}
                    onChange={(e) => setNewEndDate(e.target.value)}
                    className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-blue-500 focus:outline-none"
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
                  className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
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
                  className="w-full rounded-md border border-slate-700 bg-slate-900 p-2 text-slate-200 h-24 focus:border-blue-500 focus:outline-none"
                >
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id} className="p-1">
                      {emp.firstName} {emp.lastName} ({emp.designation})
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-slate-500">Hold Ctrl / Cmd to select multiple attendees.</span>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Meeting agenda and preparation notes..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
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
