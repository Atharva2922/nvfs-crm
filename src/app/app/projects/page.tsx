"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { FolderKanban, Layers, User, Calendar, CheckCircle2, Clock } from "lucide-react";

interface ProjectItem {
  id: string;
  operationCode: string;
  name: string;
  progress: number;
  status: string;
  role: string;
  departmentName?: string;
  startDate: string;
  expectedCompletionDate: string;
}

export default function MyProjectsPage() {
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
            setProjects(json.data);
          }
        }
      } catch (err) {
        console.error("Failed to fetch projects:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchProjects();
  }, []);

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="My Projects"
        description="Active operations and project initiatives assigned to you."
        badge={
          <Badge variant="gold" size="sm" className="gap-1">
            <FolderKanban className="h-3 w-3 text-amber-500" />
            <span>Assigned Projects</span>
          </Badge>
        }
      />

      {loading ? (
        <div className="py-12 text-center text-sm text-slate-400">Loading assigned projects...</div>
      ) : projects.length === 0 ? (
        <div className="py-16 text-center rounded-xl border border-dashed border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 p-8">
          <Layers className="h-10 w-10 text-slate-400 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">No Projects Assigned</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            You are currently not assigned to any active enterprise operations or project teams.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {projects.map((proj) => (
            <div
              key={proj.id}
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 shadow-xs transition-all hover:shadow-md space-y-4"
            >
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider">
                    {proj.operationCode}
                  </span>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white mt-0.5">
                    {proj.name}
                  </h3>
                </div>
                <span className="px-2.5 py-1 text-[10px] font-semibold rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  {proj.status}
                </span>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Completion Progress</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    {proj.progress}%
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-300"
                    style={{ width: `${Math.max(proj.progress, 5)}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-slate-400" />
                  <span>Role: <strong className="text-slate-800 dark:text-slate-200">{proj.role}</strong></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  <span>
                    Due:{" "}
                    <strong className="text-slate-800 dark:text-slate-200 font-mono">
                      {new Date(proj.expectedCompletionDate).toLocaleDateString([], {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </strong>
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
