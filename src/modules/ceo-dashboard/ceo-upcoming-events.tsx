"use client";

import React from "react";
import Link from "next/link";
import {
  Calendar,
  Clock,
  ExternalLink,
  Scale,
  FileCheck,
  Video,
  ArrowRight,
} from "lucide-react";

interface UpcomingEvent {
  id: string;
  title: string;
  date: Date | string;
  type: "MEETING" | "CONTRACT_EXPIRY" | "COMPLIANCE_DEADLINE" | "OPERATION_DUE";
  href: string;
}

interface CeoUpcomingEventsProps {
  events: UpcomingEvent[];
}

export function CeoUpcomingEvents({ events }: CeoUpcomingEventsProps) {
  const getTypeBadge = (type: UpcomingEvent["type"]) => {
    switch (type) {
      case "CONTRACT_EXPIRY":
        return { label: "Contract Expiry", color: "bg-purple-500/15 text-purple-400 border-purple-500/30" };
      case "COMPLIANCE_DEADLINE":
        return { label: "Compliance Due", color: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30" };
      case "OPERATION_DUE":
        return { label: "Operation Due", color: "bg-amber-500/15 text-amber-400 border-amber-500/30" };
      default:
        return { label: "Executive Event", color: "bg-blue-500/15 text-blue-400 border-blue-500/30" };
    }
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-[#0c121e] p-6 shadow-xl space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Calendar className="h-5 w-5 text-indigo-400" />
            Upcoming Corporate Milestones & Deadlines
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Chronological executive horizon across legal, audit, and operational due dates.</p>
        </div>
        <Link
          href="/app/calendar"
          className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-medium"
        >
          Corporate Calendar <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {events.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-400">No scheduled upcoming events or deadlines.</div>
      ) : (
        <div className="space-y-2.5">
          {events.slice(0, 6).map((ev) => {
            const badge = getTypeBadge(ev.type);
            const dateObj = new Date(ev.date);

            return (
              <div
                key={ev.id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-colors text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="flex flex-col items-center justify-center h-10 w-10 rounded-lg bg-slate-800 border border-slate-700/80 shrink-0">
                    <span className="text-[9px] uppercase font-bold text-slate-400">
                      {dateObj.toLocaleDateString("en-IN", { month: "short" })}
                    </span>
                    <span className="text-xs font-black text-white">{dateObj.getDate()}</span>
                  </div>

                  <div>
                    <h4 className="font-semibold text-white truncate max-w-[240px]">{ev.title}</h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`rounded px-1.5 py-0.2 text-[9px] font-bold uppercase border ${badge.color}`}>
                        {badge.label}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {dateObj.toLocaleDateString("en-IN", { weekday: "short" })}
                      </span>
                    </div>
                  </div>
                </div>

                <Link
                  href={ev.href}
                  className="rounded bg-slate-800 p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
