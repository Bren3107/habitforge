"use client";

import { useEffect } from "react";

export function applyTheme(theme: string) {
  const html = document.documentElement;
  const isDark =
    theme === "dark" ||
    (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  html.classList.toggle("dark", isDark);
  // Force body background in case Tailwind resolved the utility statically
  document.body.style.backgroundColor = isDark ? "#0a0a0a" : "";
  document.body.style.color = isDark ? "#fafafa" : "";
  localStorage.setItem("habitforge_theme", theme);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const stored = localStorage.getItem("habitforge_theme") ?? "light";
    applyTheme(stored);

    if (stored === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = (e: MediaQueryListEvent) =>
        document.documentElement.classList.toggle("dark", e.matches);
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    }
  }, []);

  return <>{children}</>;
}
