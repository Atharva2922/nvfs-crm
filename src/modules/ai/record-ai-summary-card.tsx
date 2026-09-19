"use client";

import React, { useState } from "react";
import { Sparkles, AlertCircle, CheckCircle2, ShieldAlert, ArrowRight, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RecordAISummaryCardProps {
  recordType: "CLIENT" | "OPERATION" | "INVOICE" | "CONTRACT";
  recordId: string;
  recordTitle?: string;
  className?: string;
}

export function RecordAISummaryCard({
  recordType,
  recordId,
  recordTitle,
  className = "",
}: RecordAISummaryCardProps) {
  const [summary, setSummary] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recordType, recordId }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || "Failed to generate summary");
      }
      setSummary(data.data.summary);
    } catch (err: any) {
      setError(err.message || "Could not generate AI summary");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={`rounded-xl border border-indigo-200/80 bg-gradient-to-br from-indigo-50/40 via-white to-blue-50/30 p-4 shadow-xs dark:border-indigo-900/50 dark:from-[#0d1527] dark:via-[#090d16] dark:to-[#0c1424] ${className}`}
    >
      <div className="flex items-center justify-between border-b border-indigo-100/60 pb-3 dark:border-indigo-950/60">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600/10 text-indigo-600 dark:bg-indigo-500/20">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
              AI Executive Summary
            </h4>
            <p className="text-[10px] text-slate-400">
              Grounded intelligence for {recordTitle || recordType}
            </p>
          </div>
        </div>

        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={fetchSummary}
          disabled={isLoading}
          className="h-7 text-xs gap-1 border-indigo-200 hover:border-indigo-400 dark:border-indigo-800"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Analyzing...</span>
            </>
          ) : summary ? (
            <>
              <RefreshCw className="h-3 w-3" />
              <span>Refresh</span>
            </>
          ) : (
            <>
              <Sparkles className="h-3 w-3 text-indigo-500" />
              <span>Generate Summary</span>
            </>
          )}
        </Button>
      </div>

      {error && (
        <div className="mt-3 flex items-center gap-2 rounded-md bg-red-50 p-2.5 text-xs text-red-600 dark:bg-red-950/40 dark:text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {summary ? (
        <div className="mt-3 space-y-3 text-xs">
          <div>
            <p className="font-semibold text-slate-800 dark:text-slate-200">
              {summary.headline}
            </p>
          </div>

          {/* Highlights */}
          {summary.highlights?.length > 0 && (
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Key Observations
              </span>
              <ul className="space-y-1">
                {summary.highlights.map((h: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-1.5 text-slate-600 dark:text-slate-300 text-[11px]">
                    <span className="text-indigo-500 font-bold">•</span>
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Risks */}
          {summary.risks?.length > 0 && (
            <div className="rounded-lg bg-amber-50/60 p-2.5 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1">
                <ShieldAlert className="h-3 w-3" /> Attention Required
              </span>
              <ul className="mt-1 space-y-1">
                {summary.risks.map((r: string, idx: number) => (
                  <li key={idx} className="text-[11px] text-amber-800 dark:text-amber-300">
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendations */}
          {summary.recommendedActions?.length > 0 && (
            <div className="space-y-1 pt-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Recommended Actions
              </span>
              <ul className="space-y-1">
                {summary.recommendedActions.map((act: string, idx: number) => (
                  <li key={idx} className="flex items-center gap-1.5 text-[11px] text-slate-700 dark:text-slate-300">
                    <ArrowRight className="h-3 w-3 text-blue-500 shrink-0" />
                    <span>{act}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        !isLoading && (
          <p className="mt-3 text-[11px] text-slate-500 dark:text-slate-400">
            Click "Generate Summary" above to perform grounded AI analysis of this {recordType.toLowerCase()}'s active touchpoints, risk factors, and next steps.
          </p>
        )
      )}
    </div>
  );
}
