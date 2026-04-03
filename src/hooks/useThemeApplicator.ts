import { useEffect } from "react";
import { useUserPreferences, useUpsertPreferences } from "@/hooks/useUserPreferences";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

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
  const { user, signOut } = useAuth();
  const upsertPrefs = useUpsertPreferences();

  // Apply stored theme from localStorage on mount (before prefs load)
  useEffect(() => {
    const accent = localStorage.getItem("dh_accent_color");
    if (accent) {
      const hsl = hexToHsl(accent);
      const root = document.documentElement;
      root.style.setProperty("--primary", hsl);
      root.style.setProperty("--ring", hsl);
      root.style.setProperty("--sidebar-primary", hsl);
      root.style.setProperty("--chart-1", hsl);
    }
    const darkMode = localStorage.getItem("dh_dark_mode");
    if (darkMode === "true") {
      document.documentElement.classList.add("dark");
      document.body.classList.add("dark");
    }
  }, []);

  // Session security: update last_active_at and check for inactivity
  useEffect(() => {
    if (!user || !prefs) return;
    
    // Update last_active_at
    supabase.from("user_preferences").update({ last_active_at: new Date().toISOString() } as any).eq("user_id", user.id).then(() => {});
    
    // Check for 30-day inactivity
    const lastActive = (prefs as any)?.last_active_at;
    if (lastActive) {
      const daysSinceActive = (Date.now() - new Date(lastActive).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceActive > 30) {
        signOut();
      }
    }
  }, [user?.id]);
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

    // Apply font family (stored in accent_colors JSON as "font" or "font_family")
    const accentData = prefs.accent_colors as Record<string, string> | null;
    const fontKey = accentData?.font_family || accentData?.font;
    if (fontKey) {
      const fontMap: Record<string, string> = {
        "Inter": "Inter, sans-serif",
        "Georgia": "Georgia, serif",
        "Mono": "monospace",
        "System": "-apple-system, BlinkMacSystemFont, system-ui, sans-serif",
      };
      const resolvedFont = fontMap[fontKey] || fontKey;
      root.style.setProperty("--font-sans", resolvedFont);
      document.body.style.fontFamily = `${resolvedFont}`;
    }

    // Apply font size (normalize case)
    const fontSize = prefs.font_size?.toLowerCase();
    if (fontSize && FONT_SIZE_MAP[fontSize]) {
      document.body.style.fontSize = FONT_SIZE_MAP[fontSize];
    }

    // Apply density / spacing (normalize case)
    const density = prefs.density?.toLowerCase();
    if (density && DENSITY_MAP[density]) {
      root.style.setProperty("--spacing", DENSITY_MAP[density]);
    }

    // Apply dark mode
    if (prefs.sidebar_theme === "dark") {
      root.classList.add("dark");
      document.body.classList.add("dark");
    } else if (prefs.sidebar_theme === "light") {
      root.classList.remove("dark");
      document.body.classList.remove("dark");
    }
  }, [prefs]);
}
