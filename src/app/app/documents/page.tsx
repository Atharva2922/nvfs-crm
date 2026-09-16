"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Lock, FileCheck, BookOpen, Layers } from "lucide-react";

interface DocItem {
  id: string;
  title: string;
  category: "EMPLOYMENT" | "PAYSLIP" | "POLICY" | "PROJECT_DELIVERABLE";
  fileUrl?: string;
  updatedAt: string;
}

export default function MyDocumentsPage() {
  const [documents, setDocuments] = useState<DocItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDocs() {
      try {
        setLoading(true);
        const res = await fetch("/api/policies");
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            const policyDocs = json.data.map((p: any) => ({
              id: p.id,
              title: p.title,
              category: "POLICY" as const,
              updatedAt: p.effectiveDate,
            }));
            setDocuments([
              {
                id: "emp-agreement",
                title: "Employment Contract & Offer Letter",
                category: "EMPLOYMENT",
                updatedAt: new Date().toISOString(),
              },
              {
                id: "code-of-conduct",
                title: "Enterprise Code of Conduct & Ethics",
                category: "POLICY",
                updatedAt: new Date().toISOString(),
              },
              ...policyDocs,
            ]);
          }
        }
      } catch (err) {
        console.error("Failed to fetch documents:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchDocs();
  }, []);

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="My Documents"
        description="Access authorized employment records, payslips, policies, and deliverables."
        badge={
          <Badge variant="gold" size="sm" className="gap-1">
            <Lock className="h-3 w-3 text-amber-500" />
            <span>Authorized Storage</span>
          </Badge>
        }
      />

      {loading ? (
        <div className="py-12 text-center text-sm text-slate-400">Loading document vault...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-4 shadow-xs transition-all hover:shadow-md flex flex-col justify-between space-y-3"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                  {doc.category === "PAYSLIP" ? (
                    <FileCheck className="h-5 w-5" />
                  ) : doc.category === "POLICY" ? (
                    <BookOpen className="h-5 w-5" />
                  ) : (
                    <FileText className="h-5 w-5" />
                  )}
                </div>
                <div className="truncate">
                  <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">
                    {doc.category}
                  </span>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white truncate mt-0.5">
                    {doc.title}
                  </h4>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                <span className="text-[10px] text-slate-400 font-mono">
                  Updated: {new Date(doc.updatedAt).toLocaleDateString()}
                </span>
                <button
                  onClick={() => alert(`Accessing document: ${doc.title}`)}
                  className="flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-amber-400 hover:underline"
                >
                  <Download className="h-3 w-3" /> View / Download
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
