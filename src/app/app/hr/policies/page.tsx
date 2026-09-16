"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { HrNav } from "@/modules/hr/components/hr-nav";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  BookOpen,
  PlusCircle,
  FileText,
  ChevronDown,
  ChevronUp,
  Calendar,
  AlertTriangle,
  Search,
  Filter,
} from "lucide-react";

interface HrPolicyItem {
  id: string;
  title: string;
  category: "LEAVE" | "CODE_OF_CONDUCT" | "ATTENDANCE" | "SAFETY" | "REMOTE_WORK" | "ETHICS" | "GENERAL";
  version: string;
  summary: string;
  content: string;
  effectiveDate: string;
  status: "ACTIVE" | "DRAFT" | "ARCHIVED";
}

export default function HrPoliciesPage() {
  const [policies, setPolicies] = useState<HrPolicyItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // New Policy Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState<any>("LEAVE");
  const [newVersion, setNewVersion] = useState("1.0");
  const [newSummary, setNewSummary] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newEffectiveDate, setNewEffectiveDate] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchPolicies = async () => {
    setLoading(true);
    try {
      const url = selectedCategory === "ALL"
        ? "/api/hr/policies"
        : `/api/hr/policies?category=${selectedCategory}`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.success) {
        setPolicies(json.data.policies || []);
      }
    } catch (err) {
      console.error("Failed to load HR policies:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicies();
  }, [selectedCategory]);

  const handleCreatePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/hr/policies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle,
          category: newCategory,
          version: newVersion,
          summary: newSummary,
          content: newContent,
          effectiveDate: newEffectiveDate,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setCreateError(json.error?.message || "Failed to publish policy");
        setSubmitting(false);
        return;
      }
      setIsCreateOpen(false);
      setNewTitle("");
      setNewSummary("");
      setNewContent("");
      setSubmitting(false);
      await fetchPolicies();
    } catch (err: any) {
      setCreateError(err.message || "Network error");
      setSubmitting(false);
    }
  };

  const filtered = policies.filter((p) =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.summary.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="HR Governance & Corporate Policies"
        description="Official company policies, employment rules, leave guidelines, ethics code, and workplace regulations."
        actions={
          <Button
            onClick={() => {
              setCreateError(null);
              setIsCreateOpen(true);
            }}
            className="bg-blue-600 hover:bg-blue-500 text-white gap-1.5 shadow-sm"
          >
            <PlusCircle className="h-4 w-4" />
            Publish New Policy
          </Button>
        }
      />

      <HrNav />

      {/* Filter Bar & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#0d1424] p-3 rounded-xl border border-slate-800">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full sm:w-auto">
          {["ALL", "LEAVE", "CODE_OF_CONDUCT", "ATTENDANCE", "SAFETY", "REMOTE_WORK", "ETHICS"].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 text-xs rounded-md whitespace-nowrap font-medium transition-colors ${
                selectedCategory === cat
                  ? "bg-blue-600 text-white"
                  : "bg-slate-800/60 text-slate-400 hover:text-slate-200"
              }`}
            >
              {cat.replace(/_/g, " ")}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <Input
            placeholder="Search policies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-xs bg-slate-900 border-slate-700"
          />
        </div>
      </div>

      {/* Policies List */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-[#0d1424] p-8 text-center text-slate-500 text-xs">
            No policies matching your filter criteria.
          </div>
        ) : (
          filtered.map((policy) => {
            const isExpanded = expandedId === policy.id;
            return (
              <div
                key={policy.id}
                className="rounded-xl border border-slate-800 bg-[#0d1424] overflow-hidden shadow-sm transition-all"
              >
                <div
                  onClick={() => setExpandedId(isExpanded ? null : policy.id)}
                  className="p-5 flex items-start justify-between cursor-pointer hover:bg-slate-800/20 transition-colors"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-600/10 text-blue-400 border border-blue-500/20 mt-0.5">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-semibold text-white">{policy.title}</h3>
                        <span className="font-mono text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded border border-slate-700">
                          v{policy.version}
                        </span>
                        <Badge variant="outline" className="text-[10px] border-slate-700 text-slate-300">
                          {policy.category.replace(/_/g, " ")}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{policy.summary}</p>
                      <div className="flex items-center gap-4 mt-3 text-[11px] text-slate-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          Effective: {new Date(policy.effectiveDate).toLocaleDateString()}
                        </span>
                        <span className="text-emerald-400 font-medium">Active Policy</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800/80 text-slate-300 hover:bg-slate-700 transition-colors shrink-0 ml-2"
                  >
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                </div>

                {/* Expanded Policy Document Body */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-2 border-t border-slate-800/80 bg-slate-900/30">
                    <div className="rounded-lg border border-slate-800 bg-[#090d16] p-4 text-xs text-slate-300 leading-relaxed font-sans whitespace-pre-line">
                      {policy.content}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* CREATE POLICY MODAL */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[550px] bg-[#0f172a] border-slate-800 text-slate-100">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-400" />
              Publish Corporate HR Policy
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-xs">
              Published policies are immediately accessible to all active employees under company governance.
            </DialogDescription>
          </DialogHeader>

          {createError && (
            <div className="rounded-lg bg-rose-950/50 border border-rose-800/80 p-3 text-xs text-rose-300 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{createError}</span>
            </div>
          )}

          <form onSubmit={handleCreatePolicy} className="space-y-3.5 py-2">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Policy Title</label>
              <Input
                type="text"
                required
                placeholder="e.g. Remote Work and Data Protection Policy"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="bg-slate-900 border-slate-700 text-xs"
              />
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Category</label>
                <select
                  value={newCategory}
                  onChange={(e: any) => setNewCategory(e.target.value)}
                  className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-2 text-xs text-slate-100 focus:border-blue-500 focus:outline-none"
                >
                  <option value="LEAVE">Leave</option>
                  <option value="CODE_OF_CONDUCT">Code of Conduct</option>
                  <option value="ATTENDANCE">Attendance</option>
                  <option value="SAFETY">Safety</option>
                  <option value="REMOTE_WORK">Remote Work</option>
                  <option value="ETHICS">Ethics</option>
                  <option value="GENERAL">General</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Version</label>
                <Input
                  type="text"
                  required
                  value={newVersion}
                  onChange={(e) => setNewVersion(e.target.value)}
                  className="bg-slate-900 border-slate-700 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Effective Date</label>
                <Input
                  type="date"
                  required
                  value={newEffectiveDate}
                  onChange={(e) => setNewEffectiveDate(e.target.value)}
                  className="bg-slate-900 border-slate-700 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Executive Summary</label>
              <textarea
                rows={2}
                required
                placeholder="Short 2-3 sentence overview..."
                value={newSummary}
                onChange={(e) => setNewSummary(e.target.value)}
                className="w-full rounded-md border border-slate-700 bg-slate-900 p-2 text-xs text-slate-100 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Full Policy Content</label>
              <textarea
                rows={5}
                required
                placeholder="Detail the complete policy clauses, standards, obligations, and enforcement..."
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                className="w-full rounded-md border border-slate-700 bg-slate-900 p-2 text-xs text-slate-100 focus:border-blue-500 focus:outline-none font-mono"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
                className="border-slate-700 text-slate-300 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs"
              >
                {submitting ? "Publishing..." : "Publish Policy"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
