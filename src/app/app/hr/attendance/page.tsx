"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { HrNav } from "@/modules/hr/components/hr-nav";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { KPICard } from "@/components/ui/kpi-card";
import {
  Clock,
  CheckCircle2,
  CalendarDays,
  UserCheck,
  Building2,
  Home,
  Laptop,
  AlertCircle,
  LogIn,
  LogOut,
  RefreshCw,
} from "lucide-react";

interface AttendanceItem {
  id: string;
  date: string;
  status: "PRESENT" | "ABSENT" | "ON_LEAVE" | "HALF_DAY" | "LATE";
  workMode: "ON_SITE" | "REMOTE" | "HYBRID";
  checkInTime?: string | null;
  checkOutTime?: string | null;
  workingHours?: number | null;
  remarks?: string | null;
  employee?: {
    firstName: string;
    lastName: string;
    employeeNumber: string;
    designation: string;
    department?: { name: string; code: string };
  };
}

export default function AttendancePage() {
  const [scope, setScope] = useState<"my" | "all">("my");
  const [records, setRecords] = useState<AttendanceItem[]>([]);
  const [myToday, setMyToday] = useState<AttendanceItem | null>(null);
  const [overview, setOverview] = useState({
    totalEmployees: 0,
    presentCount: 0,
    onLeaveCount: 0,
    notCheckedInCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [punchLoading, setPunchLoading] = useState(false);
  const [workMode, setWorkMode] = useState<"ON_SITE" | "REMOTE" | "HYBRID">("ON_SITE");
  const [currentTime, setCurrentTime] = useState<string>("");

  useEffect(() => {
    setCurrentTime(new Date().toLocaleTimeString());
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch overview
      const ovRes = await fetch("/api/hr/attendance?overview=true");
      const ovData = await ovRes.json();
      if (ovData.success) {
        setOverview({
          totalEmployees: ovData.data.totalEmployees,
          presentCount: ovData.data.presentCount,
          onLeaveCount: ovData.data.onLeaveCount,
          notCheckedInCount: ovData.data.notCheckedInCount,
        });
        setMyToday(ovData.data.myTodayRecord || null);
      }

      // 2. Fetch logs based on scope
      const logsRes = await fetch(`/api/hr/attendance?scope=${scope}`);
      const logsData = await logsRes.json();
      if (logsData.success) {
        setRecords(logsData.data.records || []);
      }
    } catch (err) {
      console.error("Error fetching attendance data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [scope]);

  // Check In Handler
  const handleCheckIn = async () => {
    setPunchLoading(true);
    try {
      const res = await fetch("/api/hr/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "CHECK_IN", workMode }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.error?.message || "Check-in failed");
        setPunchLoading(false);
        return;
      }
      await fetchData();
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setPunchLoading(false);
    }
  };

  // Check Out Handler
  const handleCheckOut = async () => {
    setPunchLoading(true);
    try {
      const res = await fetch("/api/hr/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "CHECK_OUT" }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.error?.message || "Check-out failed");
        setPunchLoading(false);
        return;
      }
      await fetchData();
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setPunchLoading(false);
    }
  };

  const getStatusBadge = (status: AttendanceItem["status"]) => {
    switch (status) {
      case "PRESENT":
        return <Badge variant="success">Present</Badge>;
      case "ON_LEAVE":
        return <Badge variant="warning">On Leave</Badge>;
      case "HALF_DAY":
        return <Badge variant="default">Half Day</Badge>;
      case "LATE":
        return <Badge variant="danger">Late</Badge>;
      case "ABSENT":
        return <Badge variant="danger">Absent</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Corporate Attendance & Shift Tracking"
        description="Real-time daily punch cards, synchronized leave logs, work mode declarations, and workforce presence oversight."
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchData()}
            className="border-slate-700 hover:bg-slate-800 text-slate-200 gap-1.5"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh Log
          </Button>
        }
      />

      <HrNav />

      {/* Top Banner: Today's Punch Widget + Attendance Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Interactive Live Punch Card */}
        <div className="rounded-xl border border-slate-800 bg-[#0d1424] p-5 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-blue-400" />
                Live Punch Terminal
              </span>
              <span className="font-mono text-sm font-bold text-blue-400">
                {currentTime || "--:--:--"}
              </span>
            </div>

            <div className="mt-4">
              <p className="text-xs text-slate-400">
                {new Date().toLocaleDateString("en-IN", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
              </p>

              {/* Status Display */}
              {myToday?.status === "ON_LEAVE" ? (
                <div className="mt-4 rounded-lg bg-amber-950/40 border border-amber-800/60 p-3 text-xs text-amber-300 flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-amber-400 shrink-0" />
                  <div>
                    <div className="font-semibold">On Approved Leave Today</div>
                    <div className="text-[11px] text-amber-400/80">{myToday.remarks || "Regular approved leave"}</div>
                  </div>
                </div>
              ) : myToday?.checkInTime && myToday?.checkOutTime ? (
                <div className="mt-4 rounded-lg bg-emerald-950/40 border border-emerald-800/60 p-3 text-xs text-emerald-300">
                  <div className="font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    Workday Completed
                  </div>
                  <div className="text-[11px] text-emerald-400/80 mt-1 font-mono">
                    In: {new Date(myToday.checkInTime).toLocaleTimeString()} • Out: {new Date(myToday.checkOutTime).toLocaleTimeString()}
                  </div>
                </div>
              ) : myToday?.checkInTime ? (
                <div className="mt-4 rounded-lg bg-blue-950/40 border border-blue-800/60 p-3 text-xs text-blue-300">
                  <div className="font-semibold flex items-center gap-1.5">
                    <UserCheck className="h-4 w-4 text-blue-400" />
                    Currently Checked In
                  </div>
                  <div className="text-[11px] text-blue-400/80 mt-1 font-mono">
                    Since {new Date(myToday.checkInTime).toLocaleTimeString()} ({myToday.workMode})
                  </div>
                </div>
              ) : (
                <div className="mt-4 rounded-lg bg-slate-900/60 border border-slate-800 p-3 text-xs text-slate-400">
                  You have not punched in for today's shift yet.
                </div>
              )}
            </div>

            {/* Work Mode Toggle (Only if not checked in) */}
            {!myToday?.checkInTime && (
              <div className="mt-4">
                <label className="block text-[11px] font-medium text-slate-400 mb-1.5">Select Work Location</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setWorkMode("ON_SITE")}
                    className={`flex items-center justify-center gap-1 px-2 py-1.5 rounded text-xs font-medium transition-colors ${
                      workMode === "ON_SITE"
                        ? "bg-blue-600 text-white"
                        : "bg-slate-800/60 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <Building2 className="h-3.5 w-3.5" /> Office
                  </button>
                  <button
                    type="button"
                    onClick={() => setWorkMode("REMOTE")}
                    className={`flex items-center justify-center gap-1 px-2 py-1.5 rounded text-xs font-medium transition-colors ${
                      workMode === "REMOTE"
                        ? "bg-blue-600 text-white"
                        : "bg-slate-800/60 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <Home className="h-3.5 w-3.5" /> Remote
                  </button>
                  <button
                    type="button"
                    onClick={() => setWorkMode("HYBRID")}
                    className={`flex items-center justify-center gap-1 px-2 py-1.5 rounded text-xs font-medium transition-colors ${
                      workMode === "HYBRID"
                        ? "bg-blue-600 text-white"
                        : "bg-slate-800/60 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <Laptop className="h-3.5 w-3.5" /> Hybrid
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Punch Button Actions */}
          <div className="mt-5 pt-4 border-t border-slate-800/80">
            {!myToday?.checkInTime ? (
              <Button
                onClick={handleCheckIn}
                disabled={punchLoading || myToday?.status === "ON_LEAVE"}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white gap-2 font-semibold"
              >
                <LogIn className="h-4 w-4" />
                {punchLoading ? "Recording Check-In..." : "Check In Now"}
              </Button>
            ) : !myToday.checkOutTime ? (
              <Button
                onClick={handleCheckOut}
                disabled={punchLoading}
                className="w-full bg-amber-600 hover:bg-amber-500 text-white gap-2 font-semibold"
              >
                <LogOut className="h-4 w-4" />
                {punchLoading ? "Recording Check-Out..." : "Check Out (End Shift)"}
              </Button>
            ) : (
              <Button disabled variant="outline" className="w-full border-slate-700 text-slate-400 text-xs">
                Shift Concluded
              </Button>
            )}
          </div>
        </div>

        {/* Right 2 Columns: KPIs */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <KPICard
            title="Total Active Workforce"
            value={overview.totalEmployees}
            icon={UserCheck}
            subtitle="Company Directory"
          />
          <KPICard
            title="Present In-Office / Remote"
            value={overview.presentCount}
            icon={CheckCircle2}
            subtitle="Punched In Today"
            trend={{
              value: `${overview.totalEmployees > 0 ? Math.round((overview.presentCount / overview.totalEmployees) * 100) : 0}%`,
              positive: true,
            }}
          />
          <KPICard
            title="On Approved Leave"
            value={overview.onLeaveCount}
            icon={CalendarDays}
            subtitle="Synchronized from Leaves Hub"
          />
          <KPICard
            title="Pending Check-Ins"
            value={overview.notCheckedInCount}
            icon={AlertCircle}
            subtitle="Expected for Today's Shift"
          />
        </div>
      </div>

      {/* Scope Filter & Comprehensive Attendance Table */}
      <div className="rounded-xl border border-slate-800 bg-[#0d1424] overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-white">Attendance Logs</h3>
            <p className="text-xs text-slate-400 mt-0.5">Chronological timestamps, hours rendered, and work modes.</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setScope("my")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                scope === "my"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-800/60 text-slate-400 hover:text-slate-200"
              }`}
            >
              My Attendance
            </button>
            <button
              onClick={() => setScope("all")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                scope === "all"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-800/60 text-slate-400 hover:text-slate-200"
              }`}
            >
              All Company Records
            </button>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="border-slate-800 hover:bg-transparent">
              <TableHead className="text-slate-400">Date</TableHead>
              {scope === "all" && <TableHead className="text-slate-400">Employee</TableHead>}
              <TableHead className="text-slate-400">Status</TableHead>
              <TableHead className="text-slate-400">Work Mode</TableHead>
              <TableHead className="text-slate-400">Check In</TableHead>
              <TableHead className="text-slate-400">Check Out</TableHead>
              <TableHead className="text-slate-400">Remarks / Sync Source</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.length === 0 ? (
              <TableRow>
                <TableCell colSpan={scope === "all" ? 7 : 6} className="text-center py-8 text-slate-500 text-xs">
                  No attendance records found for this scope.
                </TableCell>
              </TableRow>
            ) : (
              records.map((rec) => (
                <TableRow key={rec.id} className="border-slate-800/70 hover:bg-slate-800/30">
                  <TableCell className="font-mono text-xs text-slate-300">
                    {new Date(rec.date).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                  </TableCell>
                  {scope === "all" && (
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-slate-200">
                          {rec.employee?.firstName} {rec.employee?.lastName}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {rec.employee?.employeeNumber} • {rec.employee?.department?.name || "General"}
                        </span>
                      </div>
                    </TableCell>
                  )}
                  <TableCell>{getStatusBadge(rec.status)}</TableCell>
                  <TableCell className="text-xs text-slate-400 font-mono">
                    {rec.workMode}
                  </TableCell>
                  <TableCell className="text-xs font-mono text-slate-300">
                    {rec.checkInTime ? new Date(rec.checkInTime).toLocaleTimeString() : "--:--"}
                  </TableCell>
                  <TableCell className="text-xs font-mono text-slate-300">
                    {rec.checkOutTime ? new Date(rec.checkOutTime).toLocaleTimeString() : "--:--"}
                  </TableCell>
                  <TableCell className="text-xs text-slate-400">
                    {rec.remarks || "Regular shift"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
