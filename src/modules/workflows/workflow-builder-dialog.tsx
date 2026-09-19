"use client";

import React, { useState } from "react";
import {
  X,
  ChevronRight,
  ChevronLeft,
  Check,
  Sparkles,
  Zap,
  Filter,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Trash2,
  Bell,
  CheckSquare,
  ShieldCheck,
  ArrowUpRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface WorkflowBuilderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialWorkflow?: any;
}

const MODULES = [
  { id: "CRM", label: "CRM & Leads", icon: "Briefcase", desc: "Leads, clients, proposals & pipelines" },
  { id: "FINANCE", label: "Finance & Treasury", icon: "DollarSign", desc: "Invoices, payments & operating expenses" },
  { id: "PROJECTS", label: "Operations & Projects", icon: "Layers", desc: "Project milestones, tasks & incidents" },
  { id: "INVENTORY", label: "Products & Stock", icon: "Package", desc: "Stock thresholds, purchase requests & vendors" },
  { id: "CONTRACTS", label: "Legal & Contracts", icon: "Scale", desc: "Contract renewals, expirations & legal risks" },
  { id: "COMPLIANCE", label: "Statutory Compliance", icon: "ShieldAlert", desc: "Filing deadlines & audit certifications" },
  { id: "HR", label: "HR & Employees", icon: "Users", desc: "Onboarding, attendance & employee requests" },
  { id: "TASKS", label: "Task Governance", icon: "CheckSquare", desc: "Deadlines, assignments & approval queues" },
];

const TRIGGERS: Record<string, Array<{ id: string; label: string; desc: string }>> = {
  CRM: [
    { id: "RECORD_CREATED", label: "New Lead Created", desc: "Fires immediately when a lead is captured or imported" },
    { id: "STATUS_CHANGED", label: "Lead Stage Changed", desc: "Fires when lead moves between sales pipeline stages" },
    { id: "DUE_DATE_PASSED", label: "Inactive Client Watchdog", desc: "Fires when enterprise client has no touchpoints for X days" },
  ],
  FINANCE: [
    { id: "DUE_DATE_PASSED", label: "Invoice Due Date Passed", desc: "Fires when an invoice becomes overdue with outstanding balance" },
    { id: "AMOUNT_EXCEEDS_THRESHOLD", label: "High-Value Spend Requisition", desc: "Fires when expense or PO exceeds threshold" },
    { id: "PAYMENT_RECEIVED", label: "Payment Realized", desc: "Fires when customer settles invoice balance" },
    { id: "DUE_DATE_APPROACHING", label: "Upcoming Vendor Obligation", desc: "Fires N days before accounts payable due date" },
  ],
  PROJECTS: [
    { id: "DUE_DATE_PASSED", label: "Project Milestone Delayed", desc: "Fires when expected project completion date is exceeded" },
    { id: "STATUS_CHANGED", label: "Project Completed", desc: "Fires when project is marked finished" },
    { id: "TASK_OVERDUE", label: "Critical Task Overdue", desc: "Fires when an operation task passes due date" },
  ],
  INVENTORY: [
    { id: "INVENTORY_BELOW_THRESHOLD", label: "Stock Reorder Minimum Reached", desc: "Fires when stock drops below safety reorder level" },
    { id: "RECORD_CREATED", label: "Purchase Request Submitted", desc: "Fires when low-stock reorder is created" },
  ],
  CONTRACTS: [
    { id: "DUE_DATE_APPROACHING", label: "Contract Expiring (30/15/7 Days)", desc: "Fires prior to statutory agreement expiration" },
    { id: "STATUS_CHANGED", label: "Contract Renewal Initiated", desc: "Fires when renewal negotiation begins" },
  ],
  COMPLIANCE: [
    { id: "DUE_DATE_APPROACHING", label: "Compliance Deadline Approaching", desc: "Fires before statutory filing deadline" },
    { id: "DUE_DATE_PASSED", label: "Compliance Deadline Overdue", desc: "Fires when statutory filing date is missed" },
  ],
  HR: [
    { id: "RECORD_CREATED", label: "New Employee Onboarded", desc: "Fires when a new employee profile is activated" },
    { id: "APPROVAL_PENDING", label: "Leave / Claim Pending Approval", desc: "Fires when an HR request sits unanswered" },
  ],
  TASKS: [
    { id: "APPROVAL_PENDING", label: "Approval Request Unanswered", desc: "Fires when approval request exceeds 24/48 hours" },
    { id: "TASK_OVERDUE", label: "Task Deadline Overdue", desc: "Fires when assignee misses target deadline" },
  ],
};

const OPERATORS = [
  { id: "equals", label: "Equals (=)" },
  { id: "not_equals", label: "Does Not Equal (!=)" },
  { id: "greater_than", label: "Greater Than (>)" },
  { id: "less_than", label: "Less Than (<)" },
  { id: "greater_than_or_equal", label: "Greater Than or Equal (>=)" },
  { id: "less_than_or_equal", label: "Less Than or Equal (<=)" },
  { id: "contains", label: "Contains" },
  { id: "status_is", label: "Status Is" },
  { id: "date_before", label: "Date is Before" },
  { id: "date_after", label: "Date is After" },
];

const ACTION_TYPES = [
  { id: "SEND_NOTIFICATION", label: "Send In-App Notification", desc: "Alert specific executive, manager, or record owner" },
  { id: "CREATE_TASK", label: "Create Action Task", desc: "Generate follow-up task assigned to user or department" },
  { id: "CREATE_ALERT", label: "Broadcast Executive Alert", desc: "Post priority alert to Executive Dashboards" },
  { id: "CREATE_APPROVAL_REQUEST", label: "Require Executive Approval", desc: "Route to CFO/CEO for official sign-off" },
  { id: "ESCALATE", label: "Trigger Escalation Ladder", desc: "Escalate to manager -> dept head -> C-suite" },
  { id: "ADD_ACTIVITY", label: "Record Audit Activity", desc: "Log system entry into entity timeline" },
];

export function WorkflowBuilderDialog({
  isOpen,
  onClose,
  onSuccess,
  initialWorkflow,
}: WorkflowBuilderDialogProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [module, setModule] = useState(initialWorkflow?.module || "FINANCE");
  const [triggerType, setTriggerType] = useState(initialWorkflow?.triggerType || "DUE_DATE_PASSED");
  const [conditions, setConditions] = useState<any[]>(
    initialWorkflow?.conditions
      ? typeof initialWorkflow.conditions === "string"
        ? JSON.parse(initialWorkflow.conditions)
        : initialWorkflow.conditions
      : [{ field: "balance", operator: "greater_than", value: 0 }]
  );
  const [actions, setActions] = useState<any[]>(
    initialWorkflow?.actions
      ? typeof initialWorkflow.actions === "string"
        ? JSON.parse(initialWorkflow.actions)
        : initialWorkflow.actions
      : [
          {
            type: "SEND_NOTIFICATION",
            targetRole: "CFO",
            payload: { title: "Overdue Invoice Notice", message: "Invoice requires attention" },
          },
        ]
  );
  const [name, setName] = useState(initialWorkflow?.name || "");
  const [description, setDescription] = useState(initialWorkflow?.description || "");
  const [priority, setPriority] = useState(initialWorkflow?.priority || "HIGH");
  const [status, setStatus] = useState(initialWorkflow?.status || "ACTIVE");

  if (!isOpen) return null;

  const handleAddCondition = () => {
    setConditions((prev) => [...prev, { field: "status", operator: "equals", value: "ACTIVE" }]);
  };

  const handleRemoveCondition = (index: number) => {
    setConditions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateCondition = (index: number, key: string, val: any) => {
    setConditions((prev) =>
      prev.map((c, i) => (i === index ? { ...c, [key]: val } : c))
    );
  };

  const handleAddAction = () => {
    setActions((prev) => [
      ...prev,
      {
        type: "CREATE_TASK",
        payload: { title: "Follow-up Task", description: "Generated by workflow automation" },
      },
    ]);
  };

  const handleRemoveAction = (index: number) => {
    setActions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateAction = (index: number, key: string, val: any) => {
    setActions((prev) =>
      prev.map((a, i) => (i === index ? { ...a, [key]: val } : a))
    );
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!name.trim()) {
        setError("Please provide a name for this workflow.");
        setStep(5);
        return;
      }

      const payload = {
        name,
        description,
        module,
        triggerType,
        conditions,
        actions,
        priority,
        status,
      };

      const url = initialWorkflow?.id ? `/api/workflows/${initialWorkflow.id}` : "/api/workflows";
      const method = initialWorkflow?.id ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to save workflow");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to save workflow");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-2xl border border-slate-800 bg-[#0b1329] text-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-[#0d1733]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <Zap className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">
                {initialWorkflow ? "Edit Automation Workflow" : "Visual Workflow Builder"}
              </h2>
              <p className="text-xs text-slate-400">Step {step} of 5 — Event-driven smart action engine</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Wizard Stepper Pills */}
        <div className="flex items-center justify-between border-b border-slate-800/80 px-6 py-2.5 bg-slate-950/40 text-[11px] font-medium text-slate-400">
          {[
            { s: 1, label: "1. Module" },
            { s: 2, label: "2. Trigger" },
            { s: 3, label: "3. Conditions" },
            { s: 4, label: "4. Actions" },
            { s: 5, label: "5. Activate" },
          ].map((item) => (
            <button
              key={item.s}
              onClick={() => setStep(item.s)}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-md transition",
                step === item.s
                  ? "bg-blue-600 text-white font-semibold shadow-sm"
                  : step > item.s
                  ? "text-blue-400 hover:text-blue-300"
                  : "text-slate-500 hover:text-slate-300"
              )}
            >
              {step > item.s && <Check className="h-3 w-3 text-emerald-400" />}
              {item.label}
            </button>
          ))}
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 text-xs">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: SELECT MODULE */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-white">Select Target Enterprise Domain</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Choose the business domain where events will be captured and evaluated.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {MODULES.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setModule(m.id);
                      setTriggerType(TRIGGERS[m.id]?.[0]?.id || "RECORD_CREATED");
                    }}
                    className={cn(
                      "flex flex-col text-left p-3.5 rounded-xl border transition",
                      module === m.id
                        ? "border-blue-500 bg-blue-600/10 ring-1 ring-blue-500"
                        : "border-slate-800 bg-[#0d1733]/60 hover:border-slate-700 hover:bg-[#0d1733]"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{m.label}</span>
                      {module === m.id && <CheckCircle2 className="h-4 w-4 text-blue-400" />}
                    </div>
                    <span className="text-[11px] text-slate-400 mt-1">{m.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2: SELECT TRIGGER */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-white">Select Event Trigger for {module}</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  The workflow engine listens for this event before evaluating conditional logic.
                </p>
              </div>
              <div className="space-y-2.5">
                {(TRIGGERS[module] || TRIGGERS.CRM).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTriggerType(t.id)}
                    className={cn(
                      "w-full flex items-center justify-between p-3.5 rounded-xl border text-left transition",
                      triggerType === t.id
                        ? "border-blue-500 bg-blue-600/10 ring-1 ring-blue-500"
                        : "border-slate-800 bg-[#0d1733]/60 hover:border-slate-700 hover:bg-[#0d1733]"
                    )}
                  >
                    <div>
                      <div className="text-xs font-bold text-white">{t.label}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{t.desc}</div>
                    </div>
                    {triggerType === t.id && <CheckCircle2 className="h-4 w-4 text-blue-400 shrink-0" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: CONDITIONS */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white">Rule Conditions</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    All conditions must match (AND) for automated actions to execute.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddCondition}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Condition
                </button>
              </div>

              {conditions.length === 0 ? (
                <div className="p-8 border border-dashed border-slate-800 rounded-xl text-center text-xs text-slate-500">
                  No conditions set. This workflow will fire unconditionally on every trigger event.
                </div>
              ) : (
                <div className="space-y-3">
                  {conditions.map((cond, idx) => (
                    <div
                      key={idx}
                      className="flex flex-wrap items-center gap-2 p-3 rounded-xl border border-slate-800 bg-[#0d1733]/70"
                    >
                      <input
                        type="text"
                        placeholder="Field (e.g. balance)"
                        value={cond.field}
                        onChange={(e) => handleUpdateCondition(idx, "field", e.target.value)}
                        className="w-32 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <select
                        value={cond.operator}
                        onChange={(e) => handleUpdateCondition(idx, "operator", e.target.value)}
                        className="rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        {OPERATORS.map((op) => (
                          <option key={op.id} value={op.id}>
                            {op.label}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        placeholder="Value (e.g. 50000)"
                        value={cond.value}
                        onChange={(e) => handleUpdateCondition(idx, "value", e.target.value)}
                        className="flex-1 min-w-[120px] rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveCondition(idx)}
                        className="rounded-lg p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STEP 4: ACTIONS */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white">Action Execution Sequence</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Define what the system should automatically do when conditions are satisfied.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddAction}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Action
                </button>
              </div>

              <div className="space-y-3">
                {actions.map((act, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl border border-slate-800 bg-[#0d1733]/70 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono text-blue-400 font-semibold">
                        Action #{idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveAction(idx)}
                        className="text-slate-400 hover:text-rose-400 text-xs"
                      >
                        Remove
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="text-[10px] text-slate-400 uppercase font-semibold">Action Type</label>
                        <select
                          value={act.type}
                          onChange={(e) => handleUpdateAction(idx, "type", e.target.value)}
                          className="w-full mt-1 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-white"
                        >
                          {ACTION_TYPES.map((at) => (
                            <option key={at.id} value={at.id}>
                              {at.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-400 uppercase font-semibold">Target Role</label>
                        <select
                          value={act.targetRole || ""}
                          onChange={(e) => handleUpdateAction(idx, "targetRole", e.target.value || undefined)}
                          className="w-full mt-1 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-white"
                        >
                          <option value="">(Assignee / Record Owner)</option>
                          <option value="CEO">CEO</option>
                          <option value="CFO">CFO</option>
                          <option value="CTO">CTO</option>
                          <option value="CMO">CMO</option>
                          <option value="DEPARTMENT_HEAD">Department Head</option>
                          <option value="ADMIN">Administrator</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 uppercase font-semibold">Action Title</label>
                      <input
                        type="text"
                        placeholder="e.g. Overdue Invoice Notice for {{clientName}}"
                        value={act.payload?.title || ""}
                        onChange={(e) =>
                          handleUpdateAction(idx, "payload", { ...act.payload, title: e.target.value })
                        }
                        className="w-full mt-1 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-white placeholder-slate-500"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 5: SAVE & ACTIVATE */}
          {step === 5 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-white">Final Review & Activation</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Set workflow metadata, priority, and operational state.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300">Workflow Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Overdue Invoice CFO Alert & Task"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full mt-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300">Description</label>
                  <textarea
                    rows={2}
                    placeholder="Brief description of when this workflow executes and what it accomplishes..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full mt-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-300">Priority</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                      className="w-full mt-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="CRITICAL">Critical</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300">Initial Status</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full mt-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white"
                    >
                      <option value="ACTIVE">Active (Live Engine)</option>
                      <option value="PAUSED">Paused</option>
                      <option value="DRAFT">Draft</option>
                    </select>
                  </div>
                </div>

                {/* Summary Card */}
                <div className="rounded-xl border border-slate-800 bg-[#0d1733]/50 p-3.5 text-xs space-y-1.5 text-slate-400">
                  <div className="flex justify-between">
                    <span>Module Scope:</span>
                    <span className="font-semibold text-white">{module}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Trigger Event:</span>
                    <span className="font-mono text-blue-400">{triggerType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Conditions:</span>
                    <span className="text-white">{conditions.length} rule(s)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Action Sequence:</span>
                    <span className="text-emerald-400 font-semibold">{actions.length} action(s)</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between border-t border-slate-800 px-6 py-4 bg-[#0d1733]">
          <button
            type="button"
            disabled={step === 1}
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            className="inline-flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition"
          >
            <ChevronLeft className="h-4 w-4" /> Back
          </button>

          <div className="flex items-center gap-2">
            {step < 5 ? (
              <button
                type="button"
                onClick={() => setStep((s) => Math.min(5, s + 1))}
                className="inline-flex items-center gap-1 px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition"
              >
                Next <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                disabled={loading}
                onClick={handleSubmit}
                className="inline-flex items-center gap-1 px-5 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition disabled:opacity-50"
              >
                {loading ? "Saving..." : initialWorkflow ? "Update Workflow" : "Deploy & Activate"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
