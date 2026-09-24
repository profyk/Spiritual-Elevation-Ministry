"use client";

import { Moon, Sun } from "lucide-react";

/**
 * No React state — which icon shows is driven purely by the `dark:`
 * variant reacting to the `.dark` class the blocking script in layout.tsx
 * already set on <html> before first paint. Reading that class into local
 * state instead would mean a setState-in-effect (flagged by
 * react-hooks/set-state-in-effect) just to re-derive what CSS already knows.
 */
export function ThemeToggle({ className = "" }: { className?: string }) {
  function toggle() {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      // Private browsing / storage disabled — theme just won't persist across visits.
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle color theme"
      className={`rounded-md p-2 text-ink-muted hover:bg-surface-2 ${className}`}
    >
      <Sun className="h-4 w-4 dark:hidden" />
      <Moon className="hidden h-4 w-4 dark:block" />
    </button>
  );
}
