"use client";

import React from "react";
import { useTheme } from "next-themes";
import { uiTheme } from "@/lib/design-system";

// Keep the public palette API for journey extensions while inheriting the site's theme.
const palette = {
  ...uiTheme,
  orbPrimary: "hsl(var(--primary) / .08)",
  orbSecondary: "hsl(var(--primary) / .04)",
  orbTertiary: "hsl(var(--foreground) / .02)",
  scrollbar: "hsl(var(--border))",
  scrollbarTrack: "hsl(var(--muted))",
};

export const darkPalette = palette;
export const lightPalette = palette;

export function JourneyTheme({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useTheme();
  return (
    <div
      className="min-h-screen bg-background text-foreground antialiased"
      data-journey-theme={resolvedTheme || "light"}
    >
      {children}
    </div>
  );
}

export function useJourneyTheme() {
  const { resolvedTheme } = useTheme();
  return { isDark: resolvedTheme === "dark", palette };
}
