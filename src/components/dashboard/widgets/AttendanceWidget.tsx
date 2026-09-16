"use client";

import React, { useState, useEffect } from "react";
import { Clock, CheckCircle2, AlertCircle, Play, LogOut, RefreshCw } from "lucide-react";

interface AttendanceWidgetProps {
  employeeId?: string;
}

export function AttendanceWidget({ employeeId }: AttendanceWidgetProps) {
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [todayRecord, setTodayRecord] = useState<{
    id?: string;
    checkInTime?: string | null;
    checkOutTime?: string | null;
    status: string;
    workMode: string;
  } | null>(null);

  const fetchTodayAttendance = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/hr/attendance/today");
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setTodayRecord(json.data);
        }
      }
    } catch (err) {
      console.error("Failed to fetch today attendance:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodayAttendance();
  }, [employeeId]);

  const handleClockIn = async () => {
    try {
      setActionLoading(true);
      const res = await fetch("/api/hr/attendance/clock-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workMode: "ON_SITE" }),
      });
      if (res.ok) {
        await fetchTodayAttendance();
      }
    } catch (err) {
      console.error("Clock in failed:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleClockOut = async () => {
    try {
      setActionLoading(true);
      const res = await fetch("/api/hr/attendance/clock-out", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        await fetchTodayAttendance();
      }
    } catch (err) {
      console.error("Clock out failed:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const isCheckedIn = !!todayRecord?.checkInTime;
  const isCheckedOut = !!todayRecord?.checkOutTime;

  const formatTime = (timeStr?: string | null) => {
    if (!timeStr) return "--:--";
    return new Date(timeStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 shadow-xs transition-all hover:shadow-md">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Today's Attendance</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Track check-in and check-out</p>
          </div>
        </div>
        <span
          className={`px-2.5 py-1 text-[11px] font-semibold rounded-full border ${
            isCheckedOut
              ? "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300"
              : isCheckedIn
              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800"
              : "bg-amber-50 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300 border-amber-300 dark:border-amber-800"
          }`}
        >
          {isCheckedOut ? "Checked Out" : isCheckedIn ? "Present (Checked In)" : "Not Checked In"}
        </span>
      </div>

      {loading ? (
        <div className="flex h-20 items-center justify-center text-slate-400">
          <RefreshCw className="h-5 w-5 animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 p-3 border border-slate-100 dark:border-slate-800">
            <div>
              <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">Check-In</span>
              <p className="text-sm font-semibold font-mono text-slate-800 dark:text-slate-200 mt-0.5">
                {formatTime(todayRecord?.checkInTime)}
              </p>
            </div>
            <div>
              <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">Check-Out</span>
              <p className="text-sm font-semibold font-mono text-slate-800 dark:text-slate-200 mt-0.5">
                {formatTime(todayRecord?.checkOutTime)}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            {!isCheckedIn ? (
              <button
                onClick={handleClockIn}
                disabled={actionLoading}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                {actionLoading ? "Processing..." : "Check In Now"}
              </button>
            ) : !isCheckedOut ? (
              <button
                onClick={handleClockOut}
                disabled={actionLoading}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
              >
                <LogOut className="h-3.5 w-3.5" />
                {actionLoading ? "Processing..." : "Check Out"}
              </button>
            ) : (
              <div className="w-full text-center py-2 text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-lg">
                Completed shift for today
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
