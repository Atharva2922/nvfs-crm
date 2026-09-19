"use client";

import React, { useState, useEffect } from "react";
import {
  Zap,
  Plus,
  Play,
  Pause,
  Trash2,
  Edit2,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Layers,
  Sparkles,
  BookOpen,
  ArrowUpRight,
  Loader2,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { WorkflowBuilderDialog } from "./workflow-builder-dialog";
import { WorkflowExecutionHistory } from "./workflow-execution-history";

export function WorkflowList() {
  const [activeTab, setActiveTab] = useState<"ALL" | "ACTIVE" | "PAUSED" | "TEMPLATES" | "LOGS">("ALL");
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>({ total: 0, active: 0, paused: 0, draft: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedModule, setSelectedModule] = useState("ALL");
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<any | null>(null);
  const [runningId, setRunningId] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const fetchWorkflows = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (activeTab === "ACTIVE" || activeTab === "PAUSED") params.set("status", activeTab);
      if (selectedModule !== "ALL") params.set("module", selectedModule);
      if (search.trim()) params.set("search", search.trim());

      const res = await fetch(`/api/workflows?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setWorkflows(json.data.workflows || []);
        setMetrics(json.data.metrics || {});
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const res = await fetch("/api/workflows/templates");
      const json = await res.json();
      if (json.success) {
        setTemplates(json.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (activeTab === "TEMPLATES") {
      fetchTemplates();
    } else if (activeTab !== "LOGS") {
      fetchWorkflows();
    }
  }, [activeTab, selectedModule, search]);

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === "ACTIVE" ? "PAUSED" : "ACTIVE";
      const res = await fetch(`/api/workflows/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json();
      if (json.success) {
        setWorkflows((prev) =>
          prev.map((w) => (w.id === id ? { ...w, status: newStatus } : w))
        );
        setActionFeedback(`Workflow ${newStatus === "ACTIVE" ? "activated" : "paused"}`);
        setTimeout(() => setActionFeedback(null), 3000);
      }
    } catch {}
  };

  const handleRunNow = async (id: string) => {
    try {
      setRunningId(id);
      const res = await fetch(`/api/workflows/${id}/run`, { method: "POST" });
      const json = await res.json();
      if (json.success) {
        setActionFeedback(`✓ Execution completed (${json.data.status}) in ${json.data.durationMs}ms`);
        setTimeout(() => setActionFeedback(null), 4000);
        fetchWorkflows();
      } else {
        alert(json.error?.message || "Execution failed");
      }
    } catch (err: any) {
      alert(err.message || "Failed to trigger workflow");
    } finally {
      setRunningId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this workflow?")) return;
    try {
      const res = await fetch(`/api/workflows/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        setWorkflows((prev) => prev.filter((w) => w.id !== id));
      }
    } catch {}
  };

  const handleDeployTemplate = async (templateId: string) => {
    try {
      setLoading(true);
      const res = await fetch("/api/workflows/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId }),
      });
      const json = await res.json();
      if (json.success) {
        setActionFeedback(`✓ Template successfully deployed as active workflow!`);
        setTimeout(() => setActionFeedback(null), 4000);
        setActiveTab("ALL");
        fetchWorkflows();
      } else {
        alert(json.error?.message || "Failed to deploy template");
      }
    } catch (err: any) {
      alert(err.message || "Deployment failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Telemetry KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-4">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Workflows</div>
          <div className="text-2xl font-bold text-white mt-1">{metrics.total || 0}</div>
          <div className="text-[11px] text-slate-500 mt-1">Configured in organization</div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-4">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Live & Active</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">{metrics.active || 0}</div>
          <div className="text-[11px] text-emerald-500/80 mt-1">Listening to real-time events</div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-4">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Paused</div>
          <div className="text-2xl font-bold text-amber-400 mt-1">{metrics.paused || 0}</div>
          <div className="text-[11px] text-slate-500 mt-1">Temporarily suspended</div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-4">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Enterprise Templates</div>
          <div className="text-2xl font-bold text-blue-400 mt-1">10</div>
          <div className="text-[11px] text-blue-400/80 mt-1">Ready for 1-click install</div>
        </div>
      </div>

      {/* Tabs and Actions Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs">
          {[
            { key: "ALL", label: "All Workflows" },
            { key: "ACTIVE", label: "Active" },
            { key: "PAUSED", label: "Paused" },
            { key: "TEMPLATES", label: "Template Library" },
            { key: "LOGS", label: "Execution Audit Log" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={cn(
                "px-3 py-1.5 rounded-lg font-medium transition",
                activeTab === tab.key
                  ? "bg-blue-600 text-white font-semibold shadow-sm"
                  : "text-slate-400 hover:text-white"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {actionFeedback && (
            <span className="text-xs font-medium text-emerald-400 animate-fade-in">
              {actionFeedback}
            </span>
          )}

          <button
            onClick={() => {
              setEditingWorkflow(null);
              setIsBuilderOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white shadow-md shadow-blue-900/30 transition"
          >
            <Plus className="h-4 w-4" /> Create Workflow
          </button>
        </div>
      </div>

      {/* Execution Audit Log View */}
      {activeTab === "LOGS" && <WorkflowExecutionHistory />}

      {/* Templates Library View */}
      {activeTab === "TEMPLATES" && (
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-white">Enterprise Automation Templates</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Production-ready blueprints mapped to CRM, Finance, Operations, Inventory, and Legal events.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map((tpl) => (
              <div
                key={tpl.id}
                className="rounded-2xl border border-slate-800 bg-[#0f172a] p-5 space-y-3 hover:border-slate-700 transition"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="rounded-md border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 text-[10px] font-mono font-bold text-blue-400">
                      {tpl.code}
                    </span>
                    <h4 className="text-sm font-bold text-white mt-1.5">{tpl.name}</h4>
                  </div>
                  <span className="rounded border border-slate-700 bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-300">
                    {tpl.module}
                  </span>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">{tpl.description}</p>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                  <div className="text-[11px] text-slate-500">
                    Trigger: <span className="font-mono text-slate-400">{tpl.triggerType}</span>
                  </div>
                  <button
                    onClick={() => handleDeployTemplate(tpl.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-blue-600 border border-slate-700 hover:border-blue-500 text-xs font-semibold text-white transition"
                  >
                    <Zap className="h-3.5 w-3.5 text-amber-400" /> Deploy Template
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Workflows Table View (ALL, ACTIVE, PAUSED) */}
      {activeTab !== "LOGS" && activeTab !== "TEMPLATES" && (
        <div className="space-y-4">
          {/* Search & Module Filters */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search workflows by name or code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-[#0f172a] pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Module:</span>
              <select
                value={selectedModule}
                onChange={(e) => setSelectedModule(e.target.value)}
                className="rounded-xl border border-slate-800 bg-[#0f172a] px-3 py-2 text-xs text-white"
              >
                <option value="ALL">All Domains</option>
                <option value="CRM">CRM</option>
                <option value="FINANCE">Finance</option>
                <option value="PROJECTS">Projects</option>
                <option value="INVENTORY">Inventory</option>
                <option value="CONTRACTS">Contracts</option>
                <option value="COMPLIANCE">Compliance</option>
                <option value="HR">HR</option>
                <option value="TASKS">Tasks</option>
              </select>
            </div>
          </div>

          {/* Workflow Cards */}
          {loading && workflows.length === 0 ? (
            <div className="py-20 text-center text-xs text-slate-500">Loading automation workflows...</div>
          ) : workflows.length === 0 ? (
            <div className="py-20 text-center border border-dashed border-slate-800 rounded-2xl">
              <Zap className="h-10 w-10 text-slate-600 mx-auto mb-2" />
              <h4 className="text-sm font-semibold text-slate-300">No Workflows Configured</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                Create a custom automation or deploy an enterprise template to start reacting to live events.
              </p>
              <button
                onClick={() => setActiveTab("TEMPLATES")}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-xs font-semibold text-white"
              >
                Browse Templates Library
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {workflows.map((wf) => {
                const actionsCount = typeof wf.actions === "string"
                  ? JSON.parse(wf.actions || "[]").length
                  : wf.actions?.length || 0;

                return (
                  <div
                    key={wf.id}
                    className="rounded-2xl border border-slate-800 bg-[#0f172a] p-4.5 transition hover:border-slate-700 space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <span
                          className={cn(
                            "flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold",
                            wf.status === "ACTIVE"
                              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                              : "bg-slate-800 text-slate-400 border border-slate-700"
                          )}
                        >
                          <Zap className="h-4 w-4" />
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-white">{wf.name}</span>
                            <span className="text-[10px] font-mono text-slate-500">{wf.code}</span>
                            <span
                              className={cn(
                                "rounded px-1.5 py-0.5 text-[9px] font-bold uppercase",
                                wf.status === "ACTIVE"
                                  ? "bg-emerald-500/20 text-emerald-400"
                                  : "bg-amber-500/20 text-amber-400"
                              )}
                            >
                              {wf.status}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">{wf.description || "No description set"}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <button
                          onClick={() => handleRunNow(wf.id)}
                          disabled={runningId === wf.id}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-xs font-medium text-slate-200 transition"
                          title="Trigger test execution"
                        >
                          {runningId === wf.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-400" />
                          ) : (
                            <Play className="h-3.5 w-3.5 text-emerald-400" />
                          )}
                          <span>Run Now</span>
                        </button>

                        <button
                          onClick={() => handleToggleStatus(wf.id, wf.status)}
                          className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:text-white transition"
                          title={wf.status === "ACTIVE" ? "Pause Workflow" : "Activate Workflow"}
                        >
                          {wf.status === "ACTIVE" ? (
                            <Pause className="h-3.5 w-3.5 text-amber-400" />
                          ) : (
                            <Play className="h-3.5 w-3.5 text-emerald-400" />
                          )}
                        </button>

                        <button
                          onClick={() => {
                            setEditingWorkflow(wf);
                            setIsBuilderOpen(true);
                          }}
                          className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:text-white transition"
                          title="Edit Workflow"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>

                        <button
                          onClick={() => handleDelete(wf.id)}
                          className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-400 hover:text-rose-400 transition"
                          title="Delete Workflow"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 pt-2.5 border-t border-slate-800/80 gap-2">
                      <div className="flex items-center gap-3">
                        <span>Domain: <strong className="text-slate-200">{wf.module}</strong></span>
                        <span>•</span>
                        <span>Trigger: <code className="text-blue-400">{wf.triggerType}</code></span>
                        <span>•</span>
                        <span>{actionsCount} action(s)</span>
                      </div>

                      <div className="flex items-center gap-3 font-mono text-slate-400">
                        <span>Executed: <strong className="text-white">{wf.executionCount || 0}</strong> times</span>
                        {wf.lastExecutedAt && (
                          <span>Last: {new Date(wf.lastExecutedAt).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Builder Modal */}
      <WorkflowBuilderDialog
        isOpen={isBuilderOpen}
        onClose={() => {
          setIsBuilderOpen(false);
          setEditingWorkflow(null);
        }}
        onSuccess={() => {
          fetchWorkflows();
          setActionFeedback("✓ Workflow successfully saved!");
          setTimeout(() => setActionFeedback(null), 3000);
        }}
        initialWorkflow={editingWorkflow}
      />
    </div>
  );
}
