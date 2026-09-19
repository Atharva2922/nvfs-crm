"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  ArrowRight,
  Loader2,
  RefreshCw,
  HelpCircle,
  BarChart3,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/providers/auth-provider";
import { AIActionPreviewModal } from "./ai-action-preview-modal";

export function ExecutiveAIAdvisor({ className = "" }: { className?: string }) {
  const { user, role } = useAuth();
  const [advice, setAdvice] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAction, setSelectedAction] = useState<any | null>(null);
  const [explainedMetric, setExplainedMetric] = useState<string | null>(null);

  const fetchAdvice = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/ai/advisor");
      if (res.ok) {
        const data = await res.json();
        setAdvice(data.data?.advice || null);
      }
    } catch (e) {
      console.error("Failed to load AI advice:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdvice();
  }, []);

  return (
    <div
      className={`rounded-2xl border border-indigo-200/90 bg-gradient-to-br from-indigo-50/50 via-white to-blue-50/40 p-5 shadow-xs dark:border-indigo-900/60 dark:from-[#0d162a] dark:via-[#090d16] dark:to-[#0c1424] ${className}`}
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-indigo-100 pb-3.5 dark:border-indigo-950">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-sm">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>Executive AI Strategic Advisor</span>
              <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[9px] font-bold text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
                {role} PURVIEW
              </span>
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Grounded observations, anomaly detection, and actionable risk horizons
            </p>
          </div>
        </div>

        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={fetchAdvice}
          disabled={isLoading}
          className="h-8 text-xs gap-1.5 border-indigo-200 hover:border-indigo-400 dark:border-indigo-800"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Analyzing telemetry...</span>
            </>
          ) : (
            <>
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Re-Analyze</span>
            </>
          )}
        </Button>
      </div>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
        </div>
      ) : advice ? (
        <div className="mt-4 space-y-4">
          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
            {advice.headline}
          </p>

          {/* Observations Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {advice.observations?.map((obs: any, idx: number) => (
              <div
                key={idx}
                className={`rounded-xl border p-3.5 text-xs transition-all ${
                  obs.severity === "CRITICAL"
                    ? "border-red-200 bg-red-50/50 dark:border-red-900/40 dark:bg-red-950/20"
                    : obs.severity === "WARNING"
                    ? "border-amber-200 bg-amber-50/50 dark:border-amber-900/40 dark:bg-amber-950/20"
                    : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/80"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                      obs.severity === "CRITICAL"
                        ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400"
                        : obs.severity === "WARNING"
                        ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"
                        : "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400"
                    }`}
                  >
                    {obs.category}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setExplainedMetric(
                        explainedMetric === obs.title ? null : `Metric Analysis: ${obs.description}`
                      )
                    }
                    className="text-[10px] text-indigo-600 hover:underline dark:text-indigo-400"
                  >
                    Explain Metric
                  </button>
                </div>

                <h4 className="mt-2 text-xs font-bold text-slate-900 dark:text-slate-100">
                  {obs.title}
                </h4>
                <p className="mt-1 text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  {obs.description}
                </p>
              </div>
            ))}
          </div>

          {/* Metric Explanation Drill-down Drawer */}
          {explainedMetric && (
            <div className="rounded-xl border border-indigo-200 bg-indigo-50/70 p-3.5 text-xs text-indigo-900 dark:border-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-200 flex items-start justify-between">
              <div className="flex items-start gap-2">
                <HelpCircle className="h-4 w-4 shrink-0 text-indigo-600 mt-0.5" />
                <div>
                  <p className="font-bold">Metric Grounding & Root-Cause Calculation</p>
                  <p className="text-[11px] mt-0.5">{explainedMetric}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setExplainedMetric(null)}
                className="text-xs font-bold text-indigo-500 hover:text-indigo-700"
              >
                ✕
              </button>
            </div>
          )}

          {/* Action Recommendations with Explicit Confirmation */}
          {advice.actionRecommendations?.length > 0 && (
            <div className="pt-2 border-t border-indigo-100 dark:border-indigo-950/80">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Recommended Strategic Actions (Requires Confirmation)
              </span>

              <div className="mt-2 flex flex-wrap gap-2">
                {advice.actionRecommendations.map((act: any, idx: number) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedAction(act)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-white px-3 py-1.5 text-xs font-semibold text-indigo-700 shadow-2xs hover:border-indigo-400 hover:bg-indigo-50 dark:border-indigo-900 dark:bg-slate-900 dark:text-indigo-300 dark:hover:bg-indigo-950/50"
                  >
                    <ArrowRight className="h-3.5 w-3.5 text-indigo-500" />
                    <span>{act.title}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <p className="mt-4 text-xs text-slate-400">
          Click "Re-Analyze" to generate a real-time executive briefing.
        </p>
      )}

      {/* Confirmation Modal */}
      {selectedAction && (
        <AIActionPreviewModal
          isOpen={Boolean(selectedAction)}
          onClose={() => setSelectedAction(null)}
          action={selectedAction}
          onSuccess={() => fetchAdvice()}
        />
      )}
    </div>
  );
}
