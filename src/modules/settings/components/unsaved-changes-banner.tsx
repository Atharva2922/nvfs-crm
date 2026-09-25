"use client";

import React from "react";
import { AlertCircle, Save, Undo2 } from "lucide-react";

interface UnsavedChangesBannerProps {
  dirtyCount: number;
  saving: boolean;
  onSave: () => void;
  onDiscard: () => void;
}

export function UnsavedChangesBanner({
  dirtyCount,
  saving,
  onSave,
  onDiscard,
}: UnsavedChangesBannerProps) {
  if (dirtyCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-xl px-4 animate-in slide-in-from-bottom-5 duration-200">
      <div className="flex items-center justify-between gap-4 rounded-2xl border border-blue-500/40 bg-slate-900/95 text-white p-4 shadow-2xl backdrop-blur-md ring-1 ring-blue-500/20">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600/30 text-blue-400 border border-blue-500/30">
            <AlertCircle className="h-4 w-4" />
          </span>
          <div>
            <div className="text-xs font-semibold text-white">
              You have {dirtyCount} unsaved change{dirtyCount > 1 ? "s" : ""}
            </div>
            <div className="text-[11px] text-slate-400">
              Save your modifications or discard to revert to previous values.
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={saving}
            onClick={onDiscard}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 transition-colors disabled:opacity-50"
          >
            <Undo2 className="h-3.5 w-3.5" />
            Discard
          </button>

          <button
            type="button"
            disabled={saving}
            onClick={onSave}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white shadow-lg transition-colors disabled:opacity-50"
          >
            <Save className="h-3.5 w-3.5" />
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
