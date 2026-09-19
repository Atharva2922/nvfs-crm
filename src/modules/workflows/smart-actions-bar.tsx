"use client";

import React, { useState } from "react";
import {
  Sparkles,
  Zap,
  CheckSquare,
  Bell,
  ArrowUpRight,
  ShieldAlert,
  Loader2,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface SmartActionOption {
  id: string;
  label: string;
  actionType: "CREATE_FOLLOWUP_TASK" | "NOTIFY_EXECUTIVE" | "ESCALATE_ITEM";
  icon?: React.ReactNode;
  targetRole?: string;
  defaultTitle?: string;
  priority?: "LOW" | "NORMAL" | "HIGH" | "URGENT";
}

interface SmartActionsBarProps {
  entityType: "Invoice" | "Operation" | "LegalContract" | "Lead" | "Client" | "Task";
  entityId: string;
  entityTitle: string;
  customActions?: SmartActionOption[];
  onActionComplete?: () => void;
}

export function SmartActionsBar({
  entityType,
  entityId,
  entityTitle,
  customActions,
  onActionComplete,
}: SmartActionsBarProps) {
  const [executingId, setExecutingId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Default smart action recommendations based on record entity type
  const getDefaultActions = (): SmartActionOption[] => {
    switch (entityType) {
      case "Invoice":
        return [
          {
            id: "task-followup",
            label: "Create Follow-up Task",
            actionType: "CREATE_FOLLOWUP_TASK",
            defaultTitle: `Payment Collection Follow-up: ${entityTitle}`,
          },
          {
            id: "notify-cfo",
            label: "Notify CFO",
            actionType: "NOTIFY_EXECUTIVE",
            targetRole: "CFO",
          },
          {
            id: "escalate",
            label: "Escalate Overdue",
            actionType: "ESCALATE_ITEM",
          },
        ];
      case "Operation":
        return [
          {
            id: "notify-cto",
            label: "Notify CTO",
            actionType: "NOTIFY_EXECUTIVE",
            targetRole: "CTO",
          },
          {
            id: "escalate-project",
            label: "Escalate Milestone Delay",
            actionType: "ESCALATE_ITEM",
          },
          {
            id: "task-recovery",
            label: "Assign Recovery Task",
            actionType: "CREATE_FOLLOWUP_TASK",
            defaultTitle: `Recovery Plan: ${entityTitle}`,
          },
        ];
      case "LegalContract":
        return [
          {
            id: "task-renewal",
            label: "Create Renewal Task",
            actionType: "CREATE_FOLLOWUP_TASK",
            defaultTitle: `Renegotiate Contract: ${entityTitle}`,
          },
          {
            id: "notify-legal",
            label: "Notify Executive Counsel",
            actionType: "NOTIFY_EXECUTIVE",
            targetRole: "CEO",
          },
        ];
      case "Lead":
        return [
          {
            id: "task-qualify",
            label: "Schedule Discovery Call",
            actionType: "CREATE_FOLLOWUP_TASK",
            defaultTitle: `Discovery Call: ${entityTitle}`,
          },
          {
            id: "notify-cmo",
            label: "Flag to CMO",
            actionType: "NOTIFY_EXECUTIVE",
            targetRole: "CMO",
          },
        ];
      default:
        return [
          {
            id: "task-generic",
            label: "Create Action Task",
            actionType: "CREATE_FOLLOWUP_TASK",
            defaultTitle: `Action required: ${entityTitle}`,
          },
        ];
    }
  };

  const actionList = customActions || getDefaultActions();

  const handleExecute = async (option: SmartActionOption) => {
    try {
      setExecutingId(option.id);
      setSuccessMessage(null);

      const res = await fetch("/api/smart-actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actionType: option.actionType,
          entityType,
          entityId,
          entityTitle,
          payload: {
            targetRole: option.targetRole,
            title: option.defaultTitle,
            priority: option.priority || "HIGH",
          },
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Action execution failed");
      }

      setSuccessMessage(`✓ Executed: ${option.label}`);
      setTimeout(() => setSuccessMessage(null), 3500);

      if (onActionComplete) onActionComplete();
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to trigger smart action");
    } finally {
      setExecutingId(null);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2 p-2.5 rounded-xl border border-slate-800 bg-[#0d1733]/50 text-xs">
      <div className="flex items-center gap-1.5 text-blue-400 font-semibold px-1">
        <Sparkles className="h-3.5 w-3.5" />
        <span className="text-[11px] uppercase tracking-wider">Smart Actions</span>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {actionList.map((opt) => (
          <button
            key={opt.id}
            disabled={executingId !== null}
            onClick={() => handleExecute(opt)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-700 bg-slate-800/80 text-slate-200 hover:border-blue-500 hover:bg-blue-600/10 hover:text-white transition disabled:opacity-50"
          >
            {executingId === opt.id ? (
              <Loader2 className="h-3 w-3 animate-spin text-blue-400" />
            ) : (
              <Zap className="h-3 w-3 text-amber-400" />
            )}
            <span>{opt.label}</span>
          </button>
        ))}
      </div>

      {successMessage && (
        <span className="ml-auto text-[11px] font-medium text-emerald-400 animate-fade-in">
          {successMessage}
        </span>
      )}
    </div>
  );
}
