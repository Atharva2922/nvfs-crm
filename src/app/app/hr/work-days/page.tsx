"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { HrNav } from "@/modules/hr/components/hr-nav";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  CalendarOff,
  PlusCircle,
  CalendarCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
} from "lucide-react";

interface WorkDayConfigItem {
  id: string;
  dayOfWeek: number;
  dayName: string;
  isWorkingDay: boolean;
  isHalfDay: boolean;
  standardHours: number;
}

interface HolidayItem {
  id: string;
  name: string;
  date: string;
  type: "NATIONAL" | "REGIONAL" | "OPTIONAL" | "COMPANY";
  isRecurring: boolean;
  description?: string | null;
  year: number;
}

export default function WorkDaysPage() {
  const [workDays, setWorkDays] = useState<WorkDayConfigItem[]>([]);
  const [holidays, setHolidays] = useState<HolidayItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingSchedule, setSavingSchedule] = useState(false);

  // New Holiday Modal state
  const [isHolidayModalOpen, setIsHolidayModalOpen] = useState(false);
  const [newHolidayName, setNewHolidayName] = useState("");
  const [newHolidayDate, setNewHolidayDate] = useState("");
  const [newHolidayType, setNewHolidayType] = useState<"NATIONAL" | "REGIONAL" | "OPTIONAL" | "COMPANY">("NATIONAL");
  const [newHolidayDesc, setNewHolidayDesc] = useState("");
  const [newHolidayRecurring, setNewHolidayRecurring] = useState(false);
  const [holidayError, setHolidayError] = useState<string | null>(null);
  const [holidaySubmitting, setHolidaySubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/hr/work-days?year=2026");
      const json = await res.json();
      if (json.success) {
        setWorkDays(json.data.workDays || []);
        setHolidays(json.data.holidays || []);
      }
    } catch (err) {
      console.error("Failed to load work schedule:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleDay = (dayOfWeek: number) => {
    setWorkDays((prev) =>
      prev.map((d) => (d.dayOfWeek === dayOfWeek ? { ...d, isWorkingDay: !d.isWorkingDay } : d))
    );
  };

  const handleToggleHalfDay = (dayOfWeek: number) => {
    setWorkDays((prev) =>
      prev.map((d) =>
        d.dayOfWeek === dayOfWeek
          ? { ...d, isHalfDay: !d.isHalfDay, standardHours: !d.isHalfDay ? 4.0 : 8.0 }
          : d
      )
    );
  };

  const handleSaveSchedule = async () => {
    setSavingSchedule(true);
    try {
      const res = await fetch("/api/hr/work-days", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE_WORK_DAYS",
          configs: workDays.map((d) => ({
            dayOfWeek: d.dayOfWeek,
            isWorkingDay: d.isWorkingDay,
            isHalfDay: d.isHalfDay,
            standardHours: d.standardHours,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.error?.message || "Failed to update work day schedule");
        return;
      }
      alert("Work schedule updated successfully!");
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setSavingSchedule(false);
    }
  };

  const handleCreateHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    setHolidayError(null);
    setHolidaySubmitting(true);
    try {
      const res = await fetch("/api/hr/work-days", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CREATE_HOLIDAY",
          name: newHolidayName,
          date: newHolidayDate,
          type: newHolidayType,
          description: newHolidayDesc,
          isRecurring: newHolidayRecurring,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setHolidayError(json.error?.message || "Failed to create holiday");
        setHolidaySubmitting(false);
        return;
      }
      setIsHolidayModalOpen(false);
      setNewHolidayName("");
      setNewHolidayDate("");
      setNewHolidayDesc("");
      setHolidaySubmitting(false);
      await fetchData();
    } catch (err: any) {
      setHolidayError(err.message || "Network error");
      setHolidaySubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Work Days & Holiday Schedules"
        description="Company-wide operational calendar rules. The Leave policy engine automatically excludes weekends and public holidays when calculating leave duration."
        actions={
          <Button
            onClick={() => {
              setHolidayError(null);
              setIsHolidayModalOpen(true);
            }}
            className="bg-blue-600 hover:bg-blue-500 text-white gap-1.5 shadow-sm"
          >
            <PlusCircle className="h-4 w-4" />
            Add Official Holiday
          </Button>
        }
      />

      <HrNav />

      {/* Main Grid: Working Weekdays on Left, Holidays on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (1 span): Working Days Config */}
        <div className="rounded-xl border border-slate-800 bg-[#0d1424] p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-blue-400" />
                Working Days Schedule
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Corporate business week structure</p>
            </div>
          </div>

          <div className="space-y-2">
            {workDays.map((day) => (
              <div
                key={day.id}
                className={`flex items-center justify-between p-2.5 rounded-lg border transition-colors ${
                  day.isWorkingDay
                    ? "border-slate-800/80 bg-slate-900/60"
                    : "border-slate-800/40 bg-slate-950/40 opacity-70"
                }`}
              >
                <div>
                  <span className="text-xs font-semibold text-slate-200">{day.dayName}</span>
                  <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                    {day.isWorkingDay ? `${day.standardHours}h standard shift` : "Non-Working Weekend"}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {day.isWorkingDay && (
                    <button
                      type="button"
                      onClick={() => handleToggleHalfDay(day.dayOfWeek)}
                      className={`text-[10px] font-mono px-2 py-0.5 rounded border transition-colors ${
                        day.isHalfDay
                          ? "bg-amber-950/60 border-amber-700 text-amber-300"
                          : "border-slate-700 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {day.isHalfDay ? "Half Day" : "Full"}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleToggleDay(day.dayOfWeek)}
                    className={`text-xs px-2.5 py-1 rounded font-medium transition-colors ${
                      day.isWorkingDay
                        ? "bg-emerald-950/60 border border-emerald-700 text-emerald-300"
                        : "bg-slate-800 border border-slate-700 text-slate-400"
                    }`}
                  >
                    {day.isWorkingDay ? "Active" : "Off"}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <Button
            onClick={handleSaveSchedule}
            disabled={savingSchedule}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold mt-2"
          >
            {savingSchedule ? "Saving..." : "Save Working Days Configuration"}
          </Button>
        </div>

        {/* Right Column (2 spans): 2026 Holidays Table */}
        <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-[#0d1424] overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
                <CalendarCheck className="h-4 w-4 text-indigo-400" />
                2026 Corporate Holidays Register
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Officially declared holidays automatically excluded from leave quotas.
              </p>
            </div>
            <Badge variant="outline" className="font-mono text-xs border-indigo-500/30 text-indigo-300">
              {holidays.length} Holidays Configured
            </Badge>
          </div>

          <Table>
            <TableHeader>
              <TableRow className="border-slate-800 hover:bg-transparent">
                <TableHead className="text-slate-400">Date</TableHead>
                <TableHead className="text-slate-400">Holiday Name</TableHead>
                <TableHead className="text-slate-400">Classification</TableHead>
                <TableHead className="text-slate-400">Type</TableHead>
                <TableHead className="text-slate-400">Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {holidays.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-slate-500 text-xs">
                    No holidays configured for 2026. Click "Add Official Holiday" above.
                  </TableCell>
                </TableRow>
              ) : (
                holidays.map((h) => (
                  <TableRow key={h.id} className="border-slate-800/70 hover:bg-slate-800/30">
                    <TableCell className="font-mono text-xs text-slate-200 whitespace-nowrap">
                      {new Date(h.date).toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                    </TableCell>
                    <TableCell className="font-medium text-xs text-slate-100">{h.name}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${
                          h.type === "NATIONAL"
                            ? "border-emerald-500/40 text-emerald-300 bg-emerald-950/20"
                            : h.type === "REGIONAL"
                            ? "border-blue-500/40 text-blue-300 bg-blue-950/20"
                            : "border-purple-500/40 text-purple-300 bg-purple-950/20"
                        }`}
                      >
                        {h.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-slate-400">
                      {h.isRecurring ? "Annual Recurring" : "One-Time"}
                    </TableCell>
                    <TableCell className="text-xs text-slate-400 max-w-[220px]">
                      {h.description || "Official holiday"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* CREATE HOLIDAY MODAL */}
      <Dialog open={isHolidayModalOpen} onOpenChange={setIsHolidayModalOpen}>
        <DialogContent className="sm:max-w-[460px] bg-[#0f172a] border-slate-800 text-slate-100">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <CalendarOff className="h-5 w-5 text-blue-400" />
              Add Official Company Holiday
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-xs">
              Employees taking leaves that span this date will not be charged leave balance days.
            </DialogDescription>
          </DialogHeader>

          {holidayError && (
            <div className="rounded-lg bg-rose-950/50 border border-rose-800/80 p-3 text-xs text-rose-300 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{holidayError}</span>
            </div>
          )}

          <form onSubmit={handleCreateHoliday} className="space-y-3.5 py-2">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Holiday Name</label>
              <Input
                type="text"
                required
                placeholder="e.g. Independence Day / Diwali / Christmas"
                value={newHolidayName}
                onChange={(e) => setNewHolidayName(e.target.value)}
                className="bg-slate-900 border-slate-700 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Date</label>
                <Input
                  type="date"
                  required
                  value={newHolidayDate}
                  onChange={(e) => setNewHolidayDate(e.target.value)}
                  className="bg-slate-900 border-slate-700 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Type</label>
                <select
                  value={newHolidayType}
                  onChange={(e: any) => setNewHolidayType(e.target.value)}
                  className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100 focus:border-blue-500 focus:outline-none"
                >
                  <option value="NATIONAL">National Holiday</option>
                  <option value="REGIONAL">Regional Holiday</option>
                  <option value="COMPANY">Company Holiday</option>
                  <option value="OPTIONAL">Optional / Floating</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Description (Optional)</label>
              <Input
                type="text"
                placeholder="Observance details..."
                value={newHolidayDesc}
                onChange={(e) => setNewHolidayDesc(e.target.value)}
                className="bg-slate-900 border-slate-700 text-xs"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="recurring"
                checked={newHolidayRecurring}
                onChange={(e) => setNewHolidayRecurring(e.target.checked)}
                className="rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500 h-4 w-4"
              />
              <label htmlFor="recurring" className="text-xs text-slate-300">
                Recurring annually on this date
              </label>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsHolidayModalOpen(false)}
                className="border-slate-700 text-slate-300 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={holidaySubmitting}
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs"
              >
                {holidaySubmitting ? "Adding..." : "Add Holiday"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
