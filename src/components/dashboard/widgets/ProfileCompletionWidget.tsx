"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { User, CheckCircle2, AlertCircle, ArrowRight, Sparkles, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface ProfileCompletionWidgetProps {
  initialScore?: number;
  employeeName?: string;
}

export function ProfileCompletionWidget({ initialScore, employeeName }: ProfileCompletionWidgetProps) {
  const [loading, setLoading] = useState(!initialScore && initialScore !== 0);
  const [score, setScore] = useState<number>(initialScore ?? 0);
  const [missingCount, setMissingCount] = useState<number>(0);
  const [missingSections, setMissingSections] = useState<string[]>([]);
  const [isComplete, setIsComplete] = useState<boolean>(false);

  useEffect(() => {
    async function fetchCompletion() {
      try {
        const res = await fetch("/api/profile");
        const json = await res.json();
        if (json.success && json.data) {
          const comp = json.data.completion;
          const emp = json.data.employee;
          const total = comp?.totalScore ?? emp?.profileCompletion ?? 20;
          setScore(total);
          setIsComplete(total >= 80);

          if (comp?.sections) {
            const missing = comp.sections
              .filter((s: any) => !s.completed)
              .map((s: any) => s.name);
            setMissingSections(missing);
            setMissingCount(missing.length);
          }
        }
      } catch (err) {
        console.error("Failed to load profile completion widget telemetry:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchCompletion();
  }, []);

  const progressColor =
    score >= 80
      ? "bg-emerald-500 text-emerald-400"
      : score >= 50
      ? "bg-amber-500 text-amber-400"
      : "bg-blue-600 text-blue-400";

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-gradient-to-r from-blue-50/50 via-white to-indigo-50/40 dark:from-slate-900/90 dark:via-[#0c121e] dark:to-blue-950/20 p-5 shadow-sm hover:shadow-md transition-all">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left Section: Info & Percentage Meter */}
        <div className="flex items-start sm:items-center gap-4">
          <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-600/10 dark:bg-blue-500/15 border border-blue-500/30 text-blue-600 dark:text-blue-400 font-extrabold text-base shadow-sm">
            <span className="font-mono">{score}%</span>
            <div className="absolute -bottom-1 -right-1">
              {score >= 80 ? (
                <div className="h-4 w-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                  <CheckCircle2 className="h-3 w-3" />
                </div>
              ) : (
                <div className="h-4 w-4 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-xs animate-pulse">
                  <AlertCircle className="h-3 w-3" />
                </div>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Employee Profile Completion
              </h3>
              <Badge
                variant={score >= 80 ? "success" : score >= 50 ? "gold" : "warning"}
                size="sm"
                className="font-mono text-[10px]"
              >
                {score >= 80 ? "Fully Verified" : `${score}% Complete`}
              </Badge>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400">
              {score >= 80
                ? "Your corporate dossier and identification credentials are fully updated."
                : `Complete your employee information (Bank, Govt IDs, Contact, Emergency) to reach 100%.`}
            </p>

            {/* Missing Sections Pills */}
            {missingSections.length > 0 && score < 100 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] text-slate-400 font-medium">Pending:</span>
                {missingSections.slice(0, 3).map((sec, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                  >
                    {sec}
                  </span>
                ))}
                {missingSections.length > 3 && (
                  <span className="text-[10px] text-slate-400 font-mono">
                    +{missingSections.length - 3} more
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Section: Progress Bar & Direct Action Button */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 shrink-0">
          <div className="w-full sm:w-36 space-y-1">
            <div className="flex justify-between text-[11px] font-mono text-slate-500">
              <span>Progress</span>
              <span className="font-bold">{score}/100</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  score >= 80 ? "bg-emerald-500" : score >= 50 ? "bg-amber-500" : "bg-blue-600"
                }`}
                style={{ width: `${Math.min(score, 100)}%` }}
              />
            </div>
          </div>

          <Link
            href="/app/profile"
            className="inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-sm transition-all hover:scale-[1.02] shrink-0"
          >
            <User className="h-3.5 w-3.5" />
            <span>{score >= 80 ? "View / Edit Profile" : "Fill Up Profile"}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
