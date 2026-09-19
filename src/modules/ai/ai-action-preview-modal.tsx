"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckSquare, AlertTriangle, Check, Loader2, Sparkles, User, Calendar, ShieldCheck } from "lucide-react";
import { AIActionPreview } from "@/services/ai/ai-provider.interface";

interface AIActionPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  action: AIActionPreview;
  onSuccess?: (result: any) => void;
}

export function AIActionPreviewModal({
  isOpen,
  onClose,
  action,
  onSuccess,
}: AIActionPreviewModalProps) {
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDone, setIsDone] = useState(false);
  const [resultMessage, setResultMessage] = useState("");

  const handleConfirm = async () => {
    setIsExecuting(true);
    setError(null);

    try {
      const res = await fetch("/api/ai/actions/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...action,
          confirmed: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || "Failed to execute action");
      }

      setIsDone(true);
      setResultMessage(data.data.message || "Action executed successfully");
      if (onSuccess) onSuccess(data.data.result);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Failed to execute confirmed action");
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
            <Sparkles className="h-4 w-4 text-blue-600" />
            AI Consequential Action Verification
          </DialogTitle>
        </DialogHeader>

        {isDone ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50">
              <Check className="h-6 w-6" />
            </div>
            <h4 className="mt-3 text-sm font-semibold text-slate-800 dark:text-slate-100">
              Action Confirmed & Executed
            </h4>
            <p className="mt-1 text-xs text-slate-500">{resultMessage}</p>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-3 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-300 flex items-start gap-2">
              <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
              <div>
                <p className="font-semibold">Two-Step Safety Verification</p>
                <p className="text-[11px] text-amber-700/90 dark:text-amber-400">
                  The AI assistant will not make modifications to your CRM without explicit confirmation.
                </p>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-md bg-red-50 p-2.5 text-xs text-red-600 dark:bg-red-950/40 dark:text-red-400">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Action Details Card */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 dark:border-slate-800 dark:bg-slate-900 space-y-2.5 text-xs">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Action Type
                </span>
                <p className="font-bold text-slate-800 dark:text-slate-200">{action.title}</p>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Description
                </span>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  {action.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-800">
                <div>
                  <span className="text-[10px] font-semibold text-slate-400">Priority</span>
                  <p className="font-medium text-slate-700 dark:text-slate-300">
                    {action.priority || "MEDIUM"}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-slate-400">Due Date</span>
                  <p className="font-medium text-slate-700 dark:text-slate-300">
                    {action.dueDate || "Next Business Day"}
                  </p>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isExecuting}>
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleConfirm}
                disabled={isExecuting}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isExecuting ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    Executing...
                  </>
                ) : (
                  <>
                    <Check className="mr-1.5 h-3.5 w-3.5" />
                    Confirm & Execute
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
