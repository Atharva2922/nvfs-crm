"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type Theme = "light" | "dark" | "system";

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: "light" | "dark";
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_KEY = "nfvs_theme_preference";

/**
 * Applies a theme class to <html> with a smooth transition.
 *
 * Technique:
 * 1. Add .no-theme-transition  → disables all CSS transitions for one frame.
 * 2. Swap the dark/light class  → elements jump to new colors instantly.
 * 3. Remove .no-theme-transition on next rAF → transitions re-enable and
 *    any subsequent color changes (hover, focus, etc.) animate smoothly.
 *
 * This avoids the "wrong-direction" flash where the page briefly shows the
 * old theme before animating, which happens when you swap the class while
 * transitions are already active.
 */
function applyTheme(effective: "light" | "dark") {
  const root = document.documentElement;

  // 1. Block transitions while we swap palettes
  root.classList.add("no-theme-transition");

  // 2. Swap theme class
  root.classList.remove("light", "dark");
  root.classList.add(effective);
  root.style.colorScheme = effective;

  // 3. Re-enable transitions on the very next paint
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      root.classList.remove("no-theme-transition");
    });
  });
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("dark");
  const [mounted, setMounted] = useState(false);

  // Read stored preference on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(THEME_KEY) as Theme | null;
      if (stored && ["light", "dark", "system"].includes(stored)) {
        setThemeState(stored);
      }
    } catch {}
    setMounted(true);
  }, []);

  // Apply theme whenever it changes (after mount)
  useEffect(() => {
    if (!mounted) return;

    let effective: "light" | "dark" = "dark";

    if (theme === "system") {
      effective = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    } else {
      effective = theme;
    }

    setResolvedTheme(effective);
    applyTheme(effective);

    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {}
  }, [theme, mounted]);

  // Track system preference changes when theme === "system"
  useEffect(() => {
    if (!mounted || theme !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => {
      const effective = e.matches ? "dark" : "light";
      setResolvedTheme(effective);
      applyTheme(effective);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme, mounted]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const toggleTheme = () => {
    const next = resolvedTheme === "dark" ? "light" : "dark";
    setThemeState(next);
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
