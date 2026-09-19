"use client";

import React, { createContext, useContext, useEffect, useState, useRef } from "react";

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
 * Applies theme to <html> with a silky smooth transition.
 * Uses View Transitions API (document.startViewTransition) when available,
 * and falls back to a temporary .theme-transitioning CSS class.
 */
function applyTheme(effective: "light" | "dark", animate = true) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;

  const updateDOM = () => {
    root.classList.remove("light", "dark");
    root.classList.add(effective);
    root.style.colorScheme = effective;
  };

  if (!animate) {
    updateDOM();
    return;
  }

  // Modern View Transitions API for browsers that support it (Chrome, Edge, Safari 18+)
  if ("startViewTransition" in document) {
    root.classList.add("theme-transitioning");
    const transition = (document as any).startViewTransition(() => {
      updateDOM();
    });

    transition.finished
      .catch(() => {})
      .finally(() => {
        root.classList.remove("theme-transitioning");
      });
  } else {
    // Graceful CSS class transition fallback
    root.classList.add("theme-transitioning");
    updateDOM();
    setTimeout(() => {
      root.classList.remove("theme-transitioning");
    }, 450);
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("dark");
  const [mounted, setMounted] = useState(false);
  const isInitialMount = useRef(true);

  // Read stored preference on mount (without animating, to avoid initial flash)
  useEffect(() => {
    let initial: Theme = "dark";
    try {
      const stored = localStorage.getItem(THEME_KEY) as Theme | null;
      if (stored && ["light", "dark", "system"].includes(stored)) {
        initial = stored;
      }
    } catch {}

    setThemeState(initial);

    let effective: "light" | "dark" = "dark";
    if (initial === "system") {
      effective = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    } else {
      effective = initial;
    }

    setResolvedTheme(effective);
    // Silent apply on initial mount — NO animation flash
    applyTheme(effective, false);
    setMounted(true);
    isInitialMount.current = false;
  }, []);

  // Handler for user-initiated theme change (with smooth animation)
  const changeTheme = (newTheme: Theme) => {
    setThemeState(newTheme);

    let effective: "light" | "dark" = "dark";
    if (newTheme === "system") {
      effective = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    } else {
      effective = newTheme;
    }

    setResolvedTheme(effective);
    applyTheme(effective, true);

    try {
      localStorage.setItem(THEME_KEY, newTheme);
    } catch {}
  };

  const toggleTheme = () => {
    const next = resolvedTheme === "dark" ? "light" : "dark";
    changeTheme(next);
  };

  // Track system preference changes when theme === "system"
  useEffect(() => {
    if (!mounted || theme !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => {
      const effective = e.matches ? "dark" : "light";
      setResolvedTheme(effective);
      applyTheme(effective, true);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [mounted, theme]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        resolvedTheme,
        setTheme: changeTheme,
        toggleTheme,
      }}
    >
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
