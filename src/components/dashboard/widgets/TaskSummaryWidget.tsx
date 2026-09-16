"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { CheckSquare, AlertCircle, Clock, CheckCircle2, ArrowRight } from "lucide-react";

interface TaskSummaryWidgetProps {
  employeeId?: string;
  scope?: "SELF" | "TEAM" | "DEPARTMENT";
}

interface TaskSummary {
  total: number;
  pending: number;
  dueToday: number;
  overdue: number;
  completed: number;
  recentTasks: Array<{
    id: string;
    title: string;
    priority: string;
    status: string;
    dueDate: string | null;
  }>;
}

export function TaskSummaryWidget({ employeeId, scope = "SELF" }: TaskSummaryWidgetProps) {
  const [data, setData] = useState<TaskSummary>({
    total: 0,
    pending: 0,
    dueToday: 0,
    overdue: 0,
    completed: 0,
    recentTasks: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTasks() {
      try {
        setLoading(true);
        const res = await fetch(`/api/tasks/summary?scope=${scope}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            setData(json.data);
          }
        }
      } catch (err) {
        console.error("Failed to fetch task summary:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchTasks();
  }, [employeeId, scope]);

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 shadow-xs transition-all hover:shadow-md">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/60">
            <CheckSquare className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              {scope === "TEAM" ? "Team Tasks" : scope === "DEPARTMENT" ? "Department Tasks" : "My Tasks"}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Assigned workload overview</p>
          </div>
        </div>
        <Link
          href="/app/tasks"
          className="flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-amber-400 hover:underline"
        >
          View All <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="rounded-lg bg-slate-50 dark:bg-slate-800/60 p-2.5 text-center border border-slate-100 dark:border-slate-800">
          <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Pending</span>
          <p className="text-lg font-bold text-slate-900 dark:text-white">{loading ? "-" : data.pending}</p>
        </div>
        <div className="rounded-lg bg-amber-50 dark:bg-amber-950/40 p-2.5 text-center border border-amber-200/50 dark:border-amber-800/50">
          <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider">Due Today</span>
          <p className="text-lg font-bold text-amber-800 dark:text-amber-300">{loading ? "-" : data.dueToday}</p>
        </div>
        <div className="rounded-lg bg-rose-50 dark:bg-rose-950/40 p-2.5 text-center border border-rose-200/50 dark:border-rose-800/50">
          <span className="text-[10px] font-semibold text-rose-700 dark:text-rose-400 uppercase tracking-wider">Overdue</span>
          <p className="text-lg font-bold text-rose-800 dark:text-rose-300">{loading ? "-" : data.overdue}</p>
        </div>
      </div>

      {loading ? (
        <div className="py-4 text-center text-xs text-slate-400">Loading tasks...</div>
      ) : data.recentTasks.length === 0 ? (
        <div className="py-4 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-lg">
          No pending tasks assigned
        </div>
      ) : (
        <div className="space-y-2">
          {data.recentTasks.slice(0, 3).map((task) => (
            <div
              key={task.id}
              className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs"
            >
              <div className="flex items-center gap-2 truncate pr-2">
                <span
                  className={`h-2 w-2 rounded-full shrink-0 ${
                    task.priority === "HIGH" || task.priority === "URGENT"
                      ? "bg-rose-500"
                      : task.priority === "MEDIUM"
                      ? "bg-amber-500"
                      : "bg-slate-400"
                  }`}
                />
                <span className="truncate font-medium text-slate-800 dark:text-slate-200">{task.title}</span>
              </div>
              <span className="shrink-0 text-[10px] text-slate-400 font-mono">
                {task.dueDate ? new Date(task.dueDate).toLocaleDateString([], { month: "short", day: "numeric" }) : "No due date"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
