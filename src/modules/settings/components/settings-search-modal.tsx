"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, X, ChevronRight, Sliders, Command } from "lucide-react";
import { SEARCHABLE_SETTINGS, SETTINGS_CATEGORIES } from "../constants";
import { SearchableSettingItem, SettingsCategoryKey } from "../types";

interface SettingsSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCategory: (category: SettingsCategoryKey) => void;
}

export function SettingsSearchModal({
  isOpen,
  onClose,
  onSelectCategory,
}: SettingsSearchModalProps) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        if (isOpen) onClose();
      } else if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const normalizedQuery = query.toLowerCase().trim();

  // Search across specific settings and categories
  const matchedSettings: SearchableSettingItem[] = normalizedQuery
    ? SEARCHABLE_SETTINGS.filter((s) => {
        return (
          s.label.toLowerCase().includes(normalizedQuery) ||
          s.description.toLowerCase().includes(normalizedQuery) ||
          s.categoryLabel.toLowerCase().includes(normalizedQuery) ||
          s.keywords.some((k) => k.toLowerCase().includes(normalizedQuery))
        );
      })
    : SEARCHABLE_SETTINGS.slice(0, 8);

  const matchedCategories = normalizedQuery
    ? SETTINGS_CATEGORIES.filter((c) => {
        return (
          c.label.toLowerCase().includes(normalizedQuery) ||
          c.description.toLowerCase().includes(normalizedQuery) ||
          c.keywords.some((k) => k.toLowerCase().includes(normalizedQuery))
        );
      })
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-200 dark:border-slate-800 gap-3">
          <Search className="h-5 w-5 text-slate-400 dark:text-slate-500 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search enterprise settings, policies, currencies, 2FA, APIs, payroll..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-mono text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800/80 rounded border border-slate-200 dark:border-slate-700">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {/* Matched Categories */}
          {matchedCategories.length > 0 && (
            <div className="space-y-1">
              <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Settings Sections ({matchedCategories.length})
              </div>
              <div className="space-y-1">
                {matchedCategories.map((c) => (
                  <button
                    key={c.key}
                    onClick={() => {
                      onSelectCategory(c.key);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/60">
                        <Sliders className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                          {c.label}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                          {c.description}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-400 dark:text-slate-600 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Matched Individual Parameters */}
          <div className="space-y-1">
            <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              {normalizedQuery ? `Matching Parameters (${matchedSettings.length})` : "Frequently Accessed Parameters"}
            </div>

            {matchedSettings.length === 0 && matchedCategories.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-500">
                No matching settings found for &ldquo;{query}&rdquo;.
              </div>
            ) : (
              <div className="space-y-1">
                {matchedSettings.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      onSelectCategory(s.category);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors text-left group"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                          {s.label}
                        </span>
                        <span className="rounded bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 text-[9px] font-mono text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                          {s.categoryLabel}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                        {s.description}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-400 dark:text-slate-600 group-hover:translate-x-0.5 transition-transform shrink-0 ml-2" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
          <span>Enterprise Settings Registry (31 Categories, 100+ Parameters)</span>
          <span className="flex items-center gap-1 font-mono text-[10px]">
            Press <kbd className="px-1 py-0.5 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">Esc</kbd> to exit
          </span>
        </div>
      </div>
    </div>
  );
}
