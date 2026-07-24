import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      /* ── Functional color tokens (shadcn/ui base) ────────────────────── */
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
          border: "hsl(var(--card-border))",
        },

        /* ── Semantic surface tokens ────────────────────────────────────── */
        surface: {
          DEFAULT: "hsl(var(--color-surface))",
          raised: "hsl(var(--color-surface-raised))",
          overlay: "hsl(var(--color-surface-overlay))",
          sunken: "hsl(var(--color-surface-sunken))",
        },

        /* ── Brand color scale ─────────────────────────────────────────── */
        brand: {
          DEFAULT: "hsl(var(--color-brand))",
          foreground: "hsl(var(--color-brand-foreground))",
          hover: "hsl(var(--color-brand-hover))",
          active: "hsl(var(--color-brand-active))",
          subtle: "hsl(var(--color-brand-subtle))",
          "subtle-foreground": "hsl(var(--color-brand-subtle-foreground))",
        },

        /* ── Text hierarchy tokens ─────────────────────────────────────── */
        "text-primary": "hsl(var(--color-text-primary))",
        "text-secondary": "hsl(var(--color-text-secondary))",
        "text-tertiary": "hsl(var(--color-text-tertiary))",
        "text-inverse": "hsl(var(--color-text-inverse))",

        /* ── Border tokens ─────────────────────────────────────────────── */
        "border-default": "hsl(var(--color-border-default))",
        "border-strong": "hsl(var(--color-border-strong))",
        "border-subtle": "hsl(var(--color-border-subtle))",

        /* ── Semantic status tokens ────────────────────────────────────── */
        success: {
          DEFAULT: "hsl(var(--color-success))",
          foreground: "hsl(var(--color-success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--color-warning))",
          foreground: "hsl(var(--color-warning-foreground))",
        },
        info: {
          DEFAULT: "hsl(var(--color-info))",
          foreground: "hsl(var(--color-info-foreground))",
        },

        /* ── Named palette (for direct use where semantic tokens don't fit) */
        terracotta: {
          300: "#ffb96d",
          400: "#ff8b1a",
          500: "#a64626",
          600: "#8c3a1e",
          700: "#722e16",
        },
      },

      /* ── Border radius scale ─────────────────────────────────────────── */
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xs: "var(--radius-xs)",
        "radius-sm": "var(--radius-sm)",
        "radius-md": "var(--radius-md)",
        "radius-lg": "var(--radius-lg)",
        "radius-xl": "var(--radius-xl)",
        "radius-card": "var(--radius-card)",
        "radius-button": "var(--radius-button)",
        "radius-badge": "var(--radius-badge)",
        "radius-input": "var(--radius-input)",
      },

      /* ── Shadow / elevation scale ────────────────────────────────────── */
      boxShadow: {
        "elevation-0": "none",
        "elevation-1": "var(--shadow-elevation-1)",
        "elevation-2": "var(--shadow-elevation-2)",
        "elevation-3": "var(--shadow-elevation-3)",
        "elevation-4": "var(--shadow-elevation-4)",
      },

      /* ── Typography ──────────────────────────────────────────────────── */
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: [
          "var(--font-display)",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
        mono: [
          "var(--font-mono)",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "monospace",
        ],
      },

      fontSize: {
        "display-2xl": [
          "var(--text-display-2xl)",
          { lineHeight: "var(--text-display-2xl--line-height)", fontWeight: "700" },
        ],
        "display-xl": [
          "var(--text-display-xl)",
          { lineHeight: "var(--text-display-xl--line-height)", fontWeight: "700" },
        ],
        "display-lg": [
          "var(--text-display-lg)",
          { lineHeight: "var(--text-display-lg--line-height)", fontWeight: "600" },
        ],
        "display-md": [
          "var(--text-display-md)",
          { lineHeight: "var(--text-display-md--line-height)", fontWeight: "600" },
        ],
        "display-sm": [
          "var(--text-display-sm)",
          { lineHeight: "var(--text-display-sm--line-height)", fontWeight: "600" },
        ],
        "display-xs": [
          "var(--text-display-xs)",
          { lineHeight: "var(--text-display-xs--line-height)", fontWeight: "600" },
        ],
        "body-xl": [
          "var(--text-body-xl)",
          { lineHeight: "var(--text-body-xl--line-height)" },
        ],
        "body-lg": [
          "var(--text-body-lg)",
          { lineHeight: "var(--text-body-lg--line-height)" },
        ],
        "body-md": [
          "var(--text-body-md)",
          { lineHeight: "var(--text-body-md--line-height)" },
        ],
        "body-sm": [
          "var(--text-body-sm)",
          { lineHeight: "var(--text-body-sm--line-height)" },
        ],
        "body-xs": [
          "var(--text-body-xs)",
          { lineHeight: "var(--text-body-xs--line-height)" },
        ],
      },

      fontWeight: {
        normal: "var(--font-weight-normal)",
        medium: "var(--font-weight-medium)",
        semibold: "var(--font-weight-semibold)",
        bold: "var(--font-weight-bold)",
      },

      letterSpacing: {
        tighter: "var(--tracking-tighter)",
        tight: "var(--tracking-tight)",
        normal: "var(--tracking-normal)",
        wide: "var(--tracking-wide)",
        wider: "var(--tracking-wider)",
      },

      lineHeight: {
        none: "var(--leading-none)",
        tight: "var(--leading-tight)",
        snug: "var(--leading-snug)",
        normal: "var(--leading-normal)",
        relaxed: "var(--leading-relaxed)",
        loose: "var(--leading-loose)",
      },

      /* ── Spacing scale ───────────────────────────────────────────────── */
      spacing: {
        "0.5xs": "var(--space-0-5xs)",
        "0.25xs": "var(--space-0-25xs)",
        "fluid-xs": "var(--spacing-fluid-xs)",
        "fluid-sm": "var(--spacing-fluid-sm)",
        "fluid-md": "var(--spacing-fluid-md)",
        "fluid-lg": "var(--spacing-fluid-lg)",
        "fluid-xl": "var(--spacing-fluid-xl)",
        section: "var(--space-section)",
        "section-lg": "var(--space-section-lg)",
        gutter: "var(--space-gutter)",
        "gutter-lg": "var(--space-gutter-lg)",
        "inset-card": "var(--space-inset-card)",
        "inset-button": "var(--space-inset-button)",
        "inset-badge": "var(--space-inset-badge)",
        "inline-xs": "var(--space-inline-xs)",
        "inline-sm": "var(--space-inline-sm)",
        "inline-md": "var(--space-inline-md)",
      },

      /* ── Transitions ─────────────────────────────────────────────────── */
      transitionDuration: {
        fast: "var(--duration-fast)",
        normal: "var(--duration-normal)",
        slow: "var(--duration-slow)",
        slower: "var(--duration-slower)",
      },
      transitionTimingFunction: {
        "ease-out": "var(--ease-out)",
        "ease-in-out": "var(--ease-in-out)",
        "ease-spring": "var(--ease-spring)",
      },
      transitionProperty: {
        hover: "background-color, border-color, color, box-shadow",
        "card-lift": "transform, box-shadow",
        reveal: "opacity, transform",
      },

      /* ── Animations ──────────────────────────────────────────────────── */
      keyframes: {
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.95)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--accordion-panel-height)" },
        },
        "accordion-up": {
          from: { height: "var(--accordion-panel-height)" },
          to: { height: "0" },
        },
        shimmer: {
          from: { backgroundPosition: "200% 0" },
          to: { backgroundPosition: "-200% 0" },
        },
        "pulse-skeleton": {
          "0%, 100%": { opacity: "0.6" },
          "50%": { opacity: "0.3" },
        },
        "reveal-up": {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in var(--duration-normal) var(--ease-out) forwards",
        "slide-up": "slide-up var(--duration-normal) var(--ease-out) forwards",
        "scale-in": "scale-in var(--duration-normal) var(--ease-spring) forwards",
        "accordion-down": "accordion-down 0.3s cubic-bezier(0.87, 0, 0.13, 1)",
        "accordion-up": "accordion-up 0.3s cubic-bezier(0.87, 0, 0.13, 1)",
        shimmer: "shimmer 2s ease-in-out infinite",
        "pulse-skeleton": "pulse-skeleton 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "reveal-up": "reveal-up var(--duration-slower) var(--ease-out) forwards",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
