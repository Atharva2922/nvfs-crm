"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { BookOpen, ShieldCheck, FileText, ChevronRight } from "lucide-react";

interface PolicyItem {
  id: string;
  title: string;
  category: string;
  content: string;
  effectiveDate: string;
  version: string;
  isMandatory: boolean;
}

export default function PoliciesPage() {
  const [policies, setPolicies] = useState<PolicyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPolicy, setSelectedPolicy] = useState<PolicyItem | null>(null);

  useEffect(() => {
    async function fetchPolicies() {
      try {
        setLoading(true);
        const res = await fetch("/api/policies");
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            setPolicies(json.data);
            if (json.data.length > 0) setSelectedPolicy(json.data[0]);
          }
        }
      } catch (err) {
        console.error("Failed to fetch policies:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchPolicies();
  }, []);

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Company Policies & Compliance"
        description="Official handbook, conduct guidelines, work policies, and legal attestations."
        badge={
          <Badge variant="gold" size="sm" className="gap-1">
            <BookOpen className="h-3 w-3 text-amber-500" />
            <span>Policy Governance</span>
          </Badge>
        }
      />

      {loading ? (
        <div className="py-12 text-center text-sm text-slate-400">Loading policy repository...</div>
      ) : policies.length === 0 ? (
        <div className="py-16 text-center rounded-xl border border-dashed border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 p-8">
          <BookOpen className="h-10 w-10 text-slate-400 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">No Policies Published</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            Your department currently has no published HR policy documents.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Policy List Sidebar */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Available Policies</h3>
            {policies.map((pol) => (
              <button
                key={pol.id}
                onClick={() => setSelectedPolicy(pol)}
                className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center justify-between ${
                  selectedPolicy?.id === pol.id
                    ? "bg-blue-50/90 dark:bg-blue-950/60 border-blue-400 dark:border-blue-600 shadow-xs"
                    : "bg-white dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 hover:border-slate-300"
                }`}
              >
                <div className="truncate pr-2">
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold block w-fit mb-1">
                    {pol.category}
                  </span>
                  <h4 className="font-semibold text-xs text-slate-900 dark:text-white truncate">{pol.title}</h4>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
              </button>
            ))}
          </div>

          {/* Policy Detail Viewer */}
          {selectedPolicy && (
            <div className="lg:col-span-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-6 shadow-xs space-y-4">
              <div className="flex justify-between items-start pb-4 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider">
                    POLICY STATEMENT (v{selectedPolicy.version})
                  </span>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                    {selectedPolicy.title}
                  </h2>
                </div>
                <span className="text-[10px] font-mono text-slate-400">
                  Effective: {new Date(selectedPolicy.effectiveDate).toLocaleDateString()}
                </span>
              </div>

              <div className="prose dark:prose-invert max-w-none text-xs text-slate-700 dark:text-slate-300 space-y-3 leading-relaxed">
                {selectedPolicy.content.split("\n\n").map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
