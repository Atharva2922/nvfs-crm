"use client";

import React from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";

export function GlobalAIButton() {
  return (
    <Link
      href="/app/ai"
      className="relative flex items-center gap-1.5 rounded-md border border-indigo-200 dark:border-indigo-900/60 bg-gradient-to-r from-indigo-500/10 to-blue-500/10 px-2.5 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:border-indigo-400 hover:from-indigo-500/20 hover:to-blue-500/20 transition-all shadow-2xs group"
      title="AI Intelligence Assistant"
    >
      <Sparkles className="h-3.5 w-3.5 text-indigo-500 group-hover:rotate-12 transition-transform" />
      <span className="hidden sm:inline">AI Intelligence</span>
    </Link>
  );
}
