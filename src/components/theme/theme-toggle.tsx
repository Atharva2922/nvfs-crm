"use client";

import React, { useState } from "react";
import { Sun, Moon, Laptop, Check } from "lucide-react";
import { useTheme } from "./theme-provider";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  variant?: "icon" | "dropdown";
  className?: string;
}

export function ThemeToggle({ variant = "icon", className }: ThemeToggleProps) {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className={cn(
          "relative flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-900/80 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white shadow-xs focus:outline-none focus:ring-1 focus:ring-blue-500 overflow-hidden",
          className
        )}
        title={`Switch to ${resolvedTheme === "dark" ? "Light" : "Dark"} Mode`}
        aria-label="Toggle theme"
      >
        <span
          key={resolvedTheme}
          className="flex items-center justify-center animate-in fade-in zoom-in-50 duration-300"
        >
          {resolvedTheme === "dark" ? (
            <Moon className="h-4 w-4 text-blue-400" />
          ) : (
            <Sun className="h-4 w-4 text-amber-500" />
          )}
        </span>
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className={cn(
          "flex items-center gap-1.5 rounded-md border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-900/80 px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-all shadow-xs",
          className
        )}
      >
        {resolvedTheme === "dark" ? (
          <Moon className="h-3.5 w-3.5 text-blue-400" />
        ) : (
          <Sun className="h-3.5 w-3.5 text-amber-500" />
        )}
        <span className="capitalize">{theme}</span>
      </button>

      {dropdownOpen && (
        <div className="absolute right-0 mt-1.5 w-32 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] p-1 shadow-2xl z-50 animate-in fade-in zoom-in-95">
          <button
            type="button"
            onClick={() => {
              setTheme("light");
              setDropdownOpen(false);
            }}
            className={cn(
              "flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-xs transition-colors",
              theme === "light"
                ? "bg-blue-50 dark:bg-blue-600/20 text-blue-600 dark:text-blue-300 font-medium"
                : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
            )}
          >
            <span className="flex items-center gap-2">
              <Sun className="h-3.5 w-3.5 text-amber-500" /> Light
            </span>
            {theme === "light" && <Check className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />}
          </button>

          <button
            type="button"
            onClick={() => {
              setTheme("dark");
              setDropdownOpen(false);
            }}
            className={cn(
              "flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-xs transition-colors",
              theme === "dark"
                ? "bg-blue-50 dark:bg-blue-600/20 text-blue-600 dark:text-blue-300 font-medium"
                : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
            )}
          >
            <span className="flex items-center gap-2">
              <Moon className="h-3.5 w-3.5 text-blue-400" /> Dark
            </span>
            {theme === "dark" && <Check className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />}
          </button>

          <button
            type="button"
            onClick={() => {
              setTheme("system");
              setDropdownOpen(false);
            }}
            className={cn(
              "flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-xs transition-colors",
              theme === "system"
                ? "bg-blue-50 dark:bg-blue-600/20 text-blue-600 dark:text-blue-300 font-medium"
                : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
            )}
          >
            <span className="flex items-center gap-2">
              <Laptop className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" /> System
            </span>
            {theme === "system" && <Check className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />}
          </button>
        </div>
      )}
    </div>
  );
}
