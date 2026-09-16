"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Layers, ArrowRight, CheckCircle2 } from "lucide-react";

interface ProjectItem {
  id: string;
  operationCode: string;
  name: string;
  progress: number;
  status: string;
  role?: string;
  departmentName?: string;
}

export function ProjectProgressWidget() {
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProjects() {
      try {
        setLoading(true);
        const res = await fetch("/api/projects/my-projects");
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            setProjects(Array.isArray(json.data) ? json.data : []);
          }
        }
      } catch (err) {
        console.error("Failed to fetch my projects:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchProjects();
  }, []);

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 shadow-xs transition-all hover:shadow-md">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">My Active Projects</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Projects you participate in</p>
          </div>
        </div>
        <Link
          href="/app/projects"
          className="flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-amber-400 hover:underline"
        >
          View All <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {loading ? (
        <div className="py-6 text-center text-xs text-slate-400">Loading project status...</div>
      ) : !Array.isArray(projects) || projects.length === 0 ? (
        <div className="py-6 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-lg">
          No active projects assigned
        </div>
      ) : (
        <div className="space-y-3.5">
          {projects.slice(0, 3).map((project) => (
            <div key={project.id} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[180px]">
                  {project.name}
                </span>
                <span className="font-mono text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                  {project.progress}%
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-300"
                  style={{ width: `${Math.max(project.progress, 5)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
