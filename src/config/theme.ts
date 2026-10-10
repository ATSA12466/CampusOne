import type { ThemePreference } from "@/types/theme";

export const theme = {
  colors: {
    background: "var(--background)",
    surface: "var(--surface)",
    raised: "var(--surface-raised)",
    muted: "var(--surface-muted)",
    overlay: "var(--overlay)",
    brand: "var(--brand)",
    brandSoft: "var(--brand-soft)",
    accent: "var(--accent)",
    success: "var(--success)",
    warning: "var(--warning)",
    danger: "var(--danger)",
    text: "var(--foreground)",
    textMuted: "var(--muted-foreground)",
    border: "var(--border)",
    controlBorder: "var(--control-border)",
    focus: "var(--focus)",
  },
  spacing: {
    xs: "var(--space-1)",
    sm: "var(--space-2)",
    md: "var(--space-4)",
    lg: "var(--space-6)",
    xl: "var(--space-8)",
    section: "var(--space-12)",
    page: "var(--space-16)",
  },
  radius: { control: "var(--r-control)", card: "var(--r-card)", media: "var(--r-media)" },
  elevation: {
    low: "var(--elevation-low)",
    raised: "var(--elevation-raised)",
    overlay: "var(--elevation-overlay)",
  },
  motion: {
    fast: "var(--motion-fast)",
    normal: "var(--motion-normal)",
    slow: "var(--motion-slow)",
    ease: "var(--ease-out)",
  },
  fonts: { display: "var(--font-editorial)", text: "var(--font-text)" },
  storageKey: "campusone-theme",
} as const;

export function isThemePreference(value: unknown): value is ThemePreference {
  return value === "light" || value === "dark" || value === "system";
}

// Static, trusted code only. Runs before paint to prevent a light flash in dark mode.
export const themeInitScript = `(function(){var p='system';try{var s=localStorage.getItem('${theme.storageKey}');if(s==='light'||s==='dark'||s==='system')p=s;}catch(e){}var d=p==='dark'||(p==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);var r=document.documentElement;r.dataset.theme=d?'dark':'light';r.dataset.themePreference=p;r.style.colorScheme=d?'dark':'light';})();`;
