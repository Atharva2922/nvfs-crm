"use client";

import React from "react";
import Link from "next/link";
import { Activity, Clock, ShieldCheck, ArrowRight, ShieldAlert } from "lucide-react";

interface ActivityItem {
  id: string;
  action: string;
  entity: string;
  entityId?: string | null;
  actorName: string;
  actorRole: string;
  createdAt: Date | string;
}

interface CeoActivityTimelineProps {
  timeline: ActivityItem[];
}

export function CeoActivityTimeline({ timeline }: CeoActivityTimelineProps) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-[#0c121e] p-6 shadow-xl space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-400" />
            Company-Level Audit & Activity Stream
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Live mutation trail recorded by enterprise security infrastructure.</p>
        </div>
        <Link
          href="/app/audit"
          className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-medium"
        >
          Audit Logs <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {timeline.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-400">No system audit activities recorded yet.</div>
      ) : (
        <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
          {timeline.slice(0, 8).map((log) => (
            <div key={log.id} className="relative group text-xs">
              {/* Bullet icon */}
              <div className="absolute -left-6 top-0.5 h-3.5 w-3.5 rounded-full border-2 border-[#0c121e] bg-blue-500 group-hover:scale-110 transition-transform" />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <div>
                  <span className="font-semibold text-white capitalize">{log.action.toLowerCase()}</span>
                  <span className="text-slate-400 ml-1.5 font-mono text-[11px]">
                    on <span className="text-slate-300">{log.entity}</span>
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">
                  {new Date(log.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>

              <div className="text-[11px] text-slate-400 mt-0.5">
                Executed by <span className="text-slate-200 font-medium">{log.actorName}</span> (
                <span className="text-slate-400">{log.actorRole}</span>)
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
