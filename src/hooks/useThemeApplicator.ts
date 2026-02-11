import { useEffect } from "react";
import { useUserPreferences } from "@/hooks/useUserPreferences";

/**
 * Converts a hex color string to HSL values string (e.g. "258 89% 66%")
 */
function hexToHsl(hex: string): string {
  hex = hex.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

/**
 * Generates a lighter foreground-friendly version for accent backgrounds
 */
function generateAccentHsl(hsl: string): string {
  const parts = hsl.split(" ");
  const hue = parts[0];
  return `${hue} 89% 93%`;
}

function generateAccentForegroundHsl(hsl: string): string {
  const parts = hsl.split(" ");
  const hue = parts[0];
  return `${hue} 70% 50%`;
}

const FONT_SIZE_MAP: Record<string, string> = {
  small: "13px",
  medium: "14px",
  large: "16px",
};

const DENSITY_MAP: Record<string, string> = {
  compact: "0.2rem",
  comfortable: "0.25rem",
  spacious: "0.35rem",
};

export function useThemeApplicator() {
  const { data: prefs } = useUserPreferences();

  useEffect(() => {
    if (!prefs) return;
    const root = document.documentElement;

    // Apply accent/primary color
    if (prefs.theme_color) {
      const hsl = hexToHsl(prefs.theme_color);
      root.style.setProperty("--primary", hsl);
      root.style.setProperty("--ring", hsl);
      root.style.setProperty("--sidebar-primary", hsl);
      root.style.setProperty("--sidebar-ring", hsl);
      root.style.setProperty("--accent", generateAccentHsl(hsl));
      root.style.setProperty("--accent-foreground", generateAccentForegroundHsl(hsl));
      root.style.setProperty("--sidebar-accent", generateAccentHsl(hsl));
      root.style.setProperty("--sidebar-accent-foreground", generateAccentForegroundHsl(hsl));
      root.style.setProperty("--chart-1", hsl);
    }

    // Apply font family (stored in accent_colors JSON)
    const accentData = prefs.accent_colors as Record<string, string> | null;
    if (accentData?.font_family) {
      root.style.setProperty("--font-sans", accentData.font_family);
      document.body.style.fontFamily = `${accentData.font_family}, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
    }

    // Apply font size
    if (prefs.font_size && FONT_SIZE_MAP[prefs.font_size]) {
      document.body.style.fontSize = FONT_SIZE_MAP[prefs.font_size];
    }

    // Apply density / spacing
    if (prefs.density && DENSITY_MAP[prefs.density]) {
      root.style.setProperty("--spacing", DENSITY_MAP[prefs.density]);
    }

    // Apply dark mode
    if (prefs.sidebar_theme === "dark") {
      root.classList.add("dark");
    } else if (prefs.sidebar_theme === "light") {
      root.classList.remove("dark");
    }
  }, [prefs]);
}
