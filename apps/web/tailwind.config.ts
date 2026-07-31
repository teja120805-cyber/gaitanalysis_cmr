import type { Config } from "tailwindcss";

/**
 * Colors are driven by CSS custom properties (globals.css) so the whole app is
 * themed in one place and flips cleanly between light and dark. Tailwind consumes
 * them by role, never raw hex.
 */
const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        plane: "var(--plane)",
        surface: "var(--surface-1)",
        "surface-2": "var(--surface-2)",
        "surface-3": "var(--surface-3)",
        elevated: "var(--surface-elevated)",
        line: "var(--line)",
        "line-strong": "var(--line-strong)",
        grid: "var(--grid)",

        ink: "var(--ink)",
        "ink-secondary": "var(--ink-secondary)",
        muted: "var(--muted)",

        primary: "var(--primary)",
        "primary-ink": "var(--primary-ink)",
        "primary-soft": "var(--primary-soft)",
        accent: "var(--accent)",
        "accent-soft": "var(--accent-soft)",
        teal: "var(--brand-teal)",
        vital: "var(--vital)",

        good: "var(--status-good)",
        "good-ink": "var(--status-good-ink)",
        warning: "var(--status-warning)",
        "warning-ink": "var(--status-warning-ink)",
        serious: "var(--status-serious)",
        critical: "var(--status-critical)",
        "critical-ink": "var(--status-critical-ink)",

        "s-1": "var(--s-1)",
        "s-2": "var(--s-2)",
        "s-3": "var(--s-3)",
        "s-4": "var(--s-4)",
        "s-5": "var(--s-5)",
      },
      fontFamily: {
        sans: ["system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Consolas", "monospace"],
      },
      borderRadius: {
        clinical: "1rem",
        xl2: "1.25rem",
      },
      boxShadow: {
        card: "var(--shadow-card)",
        pop: "var(--shadow-pop)",
        glow: "var(--shadow-glow)",
      },
      keyframes: {
        "pulse-ring": {
          "0%": { boxShadow: "0 0 0 0 var(--pulse-color)" },
          "70%": { boxShadow: "0 0 0 7px transparent" },
          "100%": { boxShadow: "0 0 0 0 transparent" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "pulse-ring": "pulse-ring 1.8s ease-out infinite",
        shimmer: "shimmer 1.6s infinite",
      },
    },
  },
  plugins: [],
};

export default config;
