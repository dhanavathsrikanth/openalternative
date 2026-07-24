# Design Tokens

> Derived from competitor analysis (`openalternative.co`). These are **our own token definitions** matching their computed values — not copied files.

**Files:**
- `src/app/globals.css` — CSS custom property definitions (light + dark)
- `tailwind.config.ts` — Tailwind theme extension mapping tokens to utilities

---

## Table of Contents

1. [Color System](#color-system)
2. [Typography](#typography)
3. [Spacing](#spacing)
4. [Border Radius](#border-radius)
5. [Shadow / Elevation](#shadow--elevation)
6. [Transitions & Animation](#transitions--animation)
7. [Layout & Containers](#layout--containers)
8. [Icon Guide](#icon-guide)
9. [Component Mapping](#component-mapping)

---

## Color System

### Surface Layers

Background layers for visual hierarchy. Cards sit on `raised`, modals/dropdowns on `overlay`, page on `sunken`.

| Token | Light | Dark | Tailwind | Usage |
|---|---|---|---|---|
| `--color-surface` | `#ffffff` | `#0d0d0d` | `bg-surface` | Page background |
| `--color-surface-raised` | `#fdfdfd` | `#141414` | `bg-surface-raised` | Cards, panels |
| `--color-surface-overlay` | `#ffffff` | `#111111` | `bg-surface-overlay` | Dropdowns, modals, popovers |
| `--color-surface-sunken` | `#f7f7f7` | `#090909` | `bg-surface-sunken` | Inset sections, code blocks |

### Brand Color (Terracotta)

Primary accent. Derived from competitor's `#a64626`.

| Token | Light HSL | Light Hex | Dark HSL | Dark Hex | Tailwind | Usage |
|---|---|---|---|---|---|---|
| `--color-brand` | `14 62% 40%` | `#a64626` | `14 58% 70%` | `#cc8060` | `bg-brand` | Primary CTA, active links |
| `--color-brand-foreground` | `0 0% 98%` | `#fafafa` | `14 20% 10%` | `#1f1512` | `text-brand-foreground` | Text on brand backgrounds |
| `--color-brand-hover` | `14 62% 35%` | `#8c3a1e` | `14 58% 75%` | `#d99680` | `bg-brand-hover` | Brand button hover |
| `--color-brand-active` | `14 62% 30%` | `#722e16` | `14 58% 65%` | `#bf6a50` | `bg-brand-active` | Brand button active/pressed |
| `--color-brand-subtle` | `14 48% 95%` | `#fcf3f0` | `14 40% 15%` | `#2a1712` | `bg-brand-subtle` | Brand tinted backgrounds |
| `--color-brand-subtle-foreground` | `14 55% 30%` | `#7a3018` | `14 50% 75%` | `#cc9080` | `text-brand-subtle-foreground` | Text on brand subtle bg |

### Text Hierarchy

| Token | Light HSL | Light Hex | Dark Hex | Tailwind | Usage |
|---|---|---|---|---|---|
| `--color-text-primary` | `0 0% 9%` | `#171717` | `#e8e8e8` | `text-text-primary` | Headings, body copy, primary content |
| `--color-text-secondary` | `0 0% 30%` | `#4c4c4c` | `#b2b2b2` | `text-text-secondary` | Descriptions, supporting text |
| `--color-text-tertiary` | `0 0% 45%` | `#737373` | `#8c8c8c` | `text-text-tertiary` | Timestamps, metadata, placeholders |
| `--color-text-inverse` | `0 0% 98%` | `#fafafa` | `#171717` | `text-text-inverse` | Text on dark/brand backgrounds |

### Border Colors

| Token | Light HSL | Light Hex | Dark Hex | Tailwind | Usage |
|---|---|---|---|---|---|
| `--color-border-default` | `0 0% 88%` | `#e0e0e0` | `#2e2e2e` | `border-border-default` | Card borders, dividers |
| `--color-border-strong` | `0 0% 80%` | `#cccccc` | `#474747` | `border-border-strong` | Focused inputs, active states |
| `--color-border-subtle` | `0 0% 93%` | `#ededed` | `#242424` | `border-border-subtle` | Subtle separators, table rules |

### Semantic Status Colors

| Token | Light HSL | Light Hex | Dark Hex | Tailwind | Usage |
|---|---|---|---|---|---|
| `--color-success` | `152 60% 38%` | `#179460` | `#2bb87a` | `bg-success` | Success badges, confirmations |
| `--color-success-foreground` | `0 0% 100%` | `#ffffff` | `#ffffff` | `text-success-foreground` | Text on success bg |
| `--color-warning` | `38 82% 50%` | `#f0a00c` | `#e8b330` | `bg-warning` | Warning badges, cautions |
| `--color-warning-foreground` | `0 0% 100%` | `#ffffff` | `#ffffff` | `text-warning-foreground` | Text on warning bg |
| `--color-info` | `213 80% 50%` | `#1480f5` | `#4da3f7` | `bg-info` | Info badges, links |
| `--color-info-foreground` | `0 0% 100%` | `#ffffff` | `#ffffff` | `text-info-foreground` | Text on info bg |
| `--destructive` | `0 84.2% 60.2%` | `#ef4444` | `#661d1d` | `bg-destructive` | Errors, destructive actions |

### Named Palette (Terracotta)

Direct access to the brand palette for cases where semantic tokens don't fit.

| Token | Light Hex | Tailwind |
|---|---|---|
| `--color-terracotta-300` | `#ffb96d` | `bg-terracotta-300` |
| `--color-terracotta-400` | `#ff8b1a` | `bg-terracotta-400` |
| `--color-terracotta-500` | `#a64626` | `bg-terracotta-500` |
| `--color-terracotta-600` | `#8c3a1e` | `bg-terracotta-600` |
| `--color-terracotta-700` | `#722e16` | `bg-terracotta-700` |

### Chart Colors

| Token | Light Hex | Tailwind |
|---|---|---|
| `--chart-1` | `#a64626` | `bg-chart-1` |
| `--chart-2` | `#26a064` | `bg-chart-2` |
| `--chart-3` | `#e07830` | `bg-chart-3` |
| `--chart-4` | `#d4a840` | `bg-chart-4` |
| `--chart-5` | `#c88060` | `bg-chart-5` |

---

## Typography

### Font Families

| Token | Value | Tailwind | Usage |
|---|---|---|---|
| `--font-sans` | `"Inter", ui-sans-serif, system-ui, sans-serif` | `font-sans` | Body text, UI elements |
| `--font-display` | `"Satoshi", ui-sans-serif, system-ui, sans-serif` | `font-display` | Headings, hero text, display type |
| `--font-mono` | `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace` | `font-mono` | Code blocks, technical values |

### Font Weights

| Token | Value | Tailwind | Usage |
|---|---|---|---|
| `--font-weight-normal` | `400` | `font-normal` | Body text |
| `--font-weight-medium` | `500` | `font-medium` | Labels, nav items, emphasis |
| `--font-weight-semibold` | `600` | `font-semibold` | Subheadings, strong emphasis |
| `--font-weight-bold` | `700` | `font-bold` | Headings, primary emphasis |

### Display Type Scale (Headings — use `font-display`)

| Token | Size | Line Height | Tailwind | Typical Usage |
|---|---|---|---|---|
| `--text-display-2xl` | `clamp(2.25rem, 1.875rem + 1.5vw, 3rem)` | `1.2` | `text-display-2xl` | Hero headlines |
| `--text-display-xl` | `clamp(1.875rem, 1.625rem + 1vw, 2.5rem)` | `1.25` | `text-display-xl` | Section headlines |
| `--text-display-lg` | `clamp(1.5rem, 1.375rem + 0.5vw, 1.875rem)` | `1.3` | `text-display-lg` | Page titles |
| `--text-display-md` | `1.5rem` (24px) | `1.35` | `text-display-md` | Section headings |
| `--text-display-sm` | `1.25rem` (20px) | `1.4` | `text-display-sm` | Card titles |
| `--text-display-xs` | `1.125rem` (18px) | `1.45` | `text-display-xs` | Small headings |

### Body Type Scale (use `font-sans`)

| Token | Size | Line Height | Tailwind | Typical Usage |
|---|---|---|---|---|
| `--text-body-xl` | `1.25rem` (20px) | `1.6` | `text-body-xl` | Lead paragraphs, intros |
| `--text-body-lg` | `1.125rem` (18px) | `1.6` | `text-body-lg` | Large body text |
| `--text-body-md` | `1rem` (16px) | `1.6` | `text-body-md` | Default body text |
| `--text-body-sm` | `0.875rem` (14px) | `1.5` | `text-body-sm` | Captions, secondary text |
| `--text-body-xs` | `0.75rem` (12px) | `1.5` | `text-body-xs` | Timestamps, metadata, labels |

### Letter Spacing

| Token | Value | Tailwind | Usage |
|---|---|---|---|
| `--tracking-tighter` | `-0.03em` | `tracking-tighter` | Large display text |
| `--tracking-tight` | `-0.015em` | `tracking-tight` | Headings |
| `--tracking-normal` | `0em` | `tracking-normal` | Body text |
| `--tracking-wide` | `0.025em` | `tracking-wide` | Overlines, labels |
| `--tracking-wider` | `0.05em` | `tracking-wider` | Small caps, all-caps labels |

### Line Height (Named Tokens)

| Token | Value | Tailwind | Usage |
|---|---|---|---|
| `--leading-none` | `1` | `leading-none` | Single-line display text |
| `--leading-tight` | `1.25` | `leading-tight` | Headings |
| `--leading-snug` | `1.375` | `leading-snug` | Short paragraphs |
| `--leading-normal` | `1.5` | `leading-normal` | Body text default |
| `--leading-relaxed` | `1.625` | `leading-relaxed` | Long-form reading |
| `--leading-loose` | `2` | `leading-loose` | Spacious layouts |

---

## Spacing

### Base Unit

The spacing scale is built on a **4px base unit** (`0.25rem`), matching the competitor's `--spacing: 0.25rem`.

### Static Scale

| Token | Value | Pixels | Tailwind | Common Usage |
|---|---|---|---|---|
| `--space-0` | `0` | 0px | `p-0` / `m-0` | Reset |
| `--space-px` | `1px` | 1px | `p-px` | Hairline borders |
| `--space-0-5` | `0.125rem` | 2px | `p-0.5` | Tight icon padding |
| `--space-1` | `0.25rem` | 4px | `p-1` | Inline element gaps |
| `--space-1-5` | `0.375rem` | 6px | `p-1.5` | Compact padding |
| `--space-2` | `0.5rem` | 8px | `p-2` | Small padding, icon gaps |
| `--space-2-5` | `0.625rem` | 10px | `p-2.5` | Button padding |
| `--space-3` | `0.75rem` | 12px | `p-3` | Card inset, form spacing |
| `--space-3-5` | `0.875rem` | 14px | `p-3.5` | Medium padding |
| `--space-4` | `1rem` | 16px | `p-4` | Standard padding, gaps |
| `--space-5` | `1.25rem` | 20px | `p-5` | Card content padding |
| `--space-6` | `1.5rem` | 24px | `p-6` | Section gaps |
| `--space-7` | `1.75rem` | 28px | `p-7` | Larger gaps |
| `--space-8` | `2rem` | 32px | `p-8` | Section padding |
| `--space-9` | `2.25rem` | 36px | `p-9` | Large gaps |
| `--space-10` | `2.5rem` | 40px | `p-10` | Large padding |
| `--space-12` | `3rem` | 48px | `p-12` | Section spacing |
| `--space-14` | `3.5rem` | 56px | `p-14` | Large section spacing |
| `--space-16` | `4rem` | 64px | `p-16` | Extra large spacing |
| `--space-20` | `5rem` | 80px | `p-20` | Hero section gaps |
| `--space-24` | `6rem` | 96px | `p-24` | Page section dividers |
| `--space-28` | `7rem` | 112px | `p-28` | Large page sections |
| `--space-32` | `8rem` | 128px | `p-32` | Maximum spacing |

### Semantic Spacing

| Token | Value | Tailwind | Usage |
|---|---|---|---|
| `--space-section` | `clamp(3rem, 5vw, 5rem)` | `py-section` | Vertical section gaps |
| `--space-section-lg` | `clamp(4rem, 8vw, 7rem)` | `py-section-lg` | Hero/large section gaps |
| `--space-gutter` | `clamp(1rem, 3vw, 1.5rem)` | `px-gutter` | Horizontal page gutter |
| `--space-gutter-lg` | `clamp(1.5rem, 4vw, 2.5rem)` | `px-gutter-lg` | Wide page gutter |
| `--space-inset-card` | `1.25rem` | `p-inset-card` | Card content padding |
| `--space-inset-button` | `0.625rem` | `p-inset-button` | Button padding |
| `--space-inset-badge` | `0.25rem` | `p-inset-badge` | Badge padding |
| `--space-inline-xs` | `0.25rem` | `gap-inline-xs` | Tight inline gaps (icon + text) |
| `--space-inline-sm` | `0.375rem` | `gap-inline-sm` | Small inline gaps |
| `--space-inline-md` | `0.5rem` | `gap-inline-md` | Standard inline gaps |

### Fluid Spacing (Responsive)

| Token | Value | Tailwind | Usage |
|---|---|---|---|
| `--spacing-fluid-xs` | `clamp(1rem, 2.5vw, 1.5rem)` | `gap-fluid-xs` | Small responsive gaps |
| `--spacing-fluid-sm` | `clamp(1.5rem, 3.75vw, 2rem)` | `gap-fluid-sm` | Medium responsive gaps |
| `--spacing-fluid-md` | `clamp(2rem, 5vw, 3rem)` | `gap-fluid-md` | Standard responsive gaps |
| `--spacing-fluid-lg` | `clamp(2.5rem, 6.25vw, 3.5rem)` | `gap-fluid-lg` | Large responsive gaps |
| `--spacing-fluid-xl` | `clamp(3rem, 7.5vw, 4rem)` | `gap-fluid-xl` | Extra large responsive gaps |

---

## Border Radius

### Scale

| Token | Value | Pixels | Tailwind | Usage |
|---|---|---|---|---|
| `--radius-xs` | `0.125rem` | 2px | `rounded-xs` | Subtle rounding, inline code |
| `--radius-sm` | `0.25rem` | 4px | `rounded-radius-sm` | Small elements, tags |
| `--radius-md` | `0.375rem` | 6px | `rounded-radius-md` | Buttons, inputs, badges |
| `--radius-lg` | `0.5rem` | 8px | `rounded-radius-lg` | Cards, modals |
| `--radius-xl` | `0.75rem` | 12px | `rounded-radius-xl` | Large panels, hero cards |

### Component-Specific Radius

| Token | Value | Tailwind | Component |
|---|---|---|---|
| `--radius-card` | `0.5rem` (8px) | `rounded-radius-card` | `Card`, `Sheet` |
| `--radius-button` | `0.375rem` (6px) | `rounded-radius-button` | `Button` |
| `--radius-badge` | `0.375rem` (6px) | `rounded-radius-badge` | `Badge` |
| `--radius-input` | `0.375rem` (6px) | `rounded-radius-input` | `Input`, `Textarea` |

---

## Shadow / Elevation

Four-level elevation system. Each level adds progressively more shadow depth.

| Token | Value | Tailwind | Usage |
|---|---|---|---|
| `--shadow-elevation-1` | `0 1px 2px 0 rgb(0 0 0 / 0.05)` | `shadow-elevation-1` | Subtle lift: cards at rest, buttons |
| `--shadow-elevation-2` | `0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)` | `shadow-elevation-2` | Interactive: cards on hover, dropdowns |
| `--shadow-elevation-3` | `0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)` | `shadow-elevation-3` | Floating: modals, popovers, tooltips |
| `--shadow-elevation-4` | `0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)` | `shadow-elevation-4` | Top layer: drag previews, command palette |

**Dark mode** shadows increase opacity (0.3–0.5) for visibility against dark backgrounds.

---

## Transitions & Animation

### Duration

| Token | Value | Tailwind | Usage |
|---|---|---|---|
| `--duration-fast` | `100ms` | `duration-fast` | Color changes, opacity |
| `--duration-normal` | `200ms` | `duration-normal` | Standard transitions |
| `--duration-slow` | `300ms` | `duration-slow` | Complex animations, layout |
| `--duration-slower` | `500ms` | `duration-slower` | Scroll reveal, page transitions |

### Easing

| Token | Value | Tailwind | Usage |
|---|---|---|---|
| `--ease-out` | `cubic-bezier(0, 0, 0.2, 1)` | `ease-out` | Elements entering view |
| `--ease-in-out` | `cubic-bezier(0.4, 0, 0.2, 1)` | `ease-in-out` | Standard transitions |
| `--ease-spring` | `cubic-bezier(0.22, 1, 0.36, 1)` | `ease-spring` | Bouncy, playful entrances |

### Semantic Transition Presets (D.1)

CSS custom properties for common transition patterns. Apply via `transition` or `style` attribute.

| Token | Properties | Duration | Easing | Usage |
|---|---|---|---|---|
| `--transition-hover` | background-color, border-color, color, box-shadow | `--duration-fast` | `--ease-out` | Button/link hover states |
| `--transition-card-lift` | transform, box-shadow | `--duration-normal` | `--ease-spring` | Card hover lift effect |
| `--transition-reveal` | opacity, transform | `--duration-slower` | `--ease-out` | Scroll-triggered section reveal |

### Tailwind Transition Utilities

| Utility | What it does |
|---|---|
| `transition-property-hover` | Transitions color, border, background, shadow on hover |
| `transition-property-card-lift` | Transforms + shadows for card lift |
| `transition-property-reveal` | Opacity + transform for scroll reveal |
| `card-lift` | Utility class: translateY(-2px) + elevation-3 on hover |
| `scroll-reveal` | Utility class: starts hidden, `.revealed` triggers animation |
| `skip-to-content` | Utility class: visually hidden until focused (a11y) |

### Named Animations

| Animation | Tailwind Class | Duration | Easing | Usage |
|---|---|---|---|---|
| Fade in | `animate-fade-in` | 200ms | ease-out | Content appearing |
| Slide up | `animate-slide-up` | 200ms | ease-out | Cards entering, toasts |
| Scale in | `animate-scale-in` | 200ms | ease-spring | Popovers, modals |
| Reveal up | `animate-reveal-up` | 500ms | ease-out | Scroll-triggered sections |
| Shimmer | `animate-shimmer` | 2s | ease-in-out | Skeleton loading overlay |
| Pulse skeleton | `animate-pulse-skeleton` | 2s | cubic-bezier(0.4, 0, 0.6, 1) | Skeleton base pulse |

---

## Icon Guide

### Library

**Lucide React** (`lucide-react`) — used for all standard UI icons. Inline SVGs are used only for domain-specific icons (GitHub octocat, star ratings, category illustrations) where Lucide has no equivalent.

### Standard Sizes

| Token | Size | Tailwind | Usage |
|---|---|---|---|
| `size-3` | 12px | `size-3` | License badges, tiny inline indicators |
| `size-3.5` | 14px | `size-3.5` | Stat/metric rows (stars, forks), admin sidebar nav, validation checkmarks |
| `size-4` | 16px | `size-4` | Inline text icons (next to labels), button icons, UI primitive indicators (chevrons, checkmarks, close) |
| `size-5` | 20px | `size-5` | Logo marks, category illustration icons, fallback product logos |
| `size-6` | 24px | `size-6` | Navigation controls (hamburger, close), upload/feature icons, mobile touch targets |
| `size-7` | 28px | `size-7` | Empty-state illustration icons |

### Rules

1. **Always use `size-*`** for square icons (equal height/width). Never use `h-* w-*` for icons — reserve that for Skeleton placeholders and non-square elements.
2. **Default stroke width is 2** — do not override unless intentionally thinning (empty-state icons use `strokeWidth="1.5"`).
3. **Stars are always filled** — use `fill="currentColor"` with the star path. Apply `text-yellow-500` only in ProductCard stat rows; other stat rows inherit `text-muted-foreground`.
4. **Icon color** — inherit from parent via `currentColor`. Override with `text-*` classes only when the icon needs a distinct color (e.g., `text-yellow-500` for stars, `text-green-600` for checkmarks).
5. **Dead imports** — remove any imported icon that is not rendered in JSX. ESLint will warn but not error; keep imports clean.

### Context → Size Map

| Context | Size | Notes |
|---|---|---|
| Stat/metric rows (stars, forks) | `size-3.5` | Always `shrink-0` |
| Admin sidebar nav items | `size-3.5` | Lucide icons via dynamic `<Icon>` |
| Dashboard sidebar nav | `size-3.5` | Same as admin sidebar |
| Validation checklist | `size-3.5` | Checkmark + circle icons |
| Inline text icons (labels) | `size-4` | Shield, search decorators, plus/alert |
| Button icons (inside `<Button>`) | `size-4` | XIcon, SearchIcon, trash |
| UI primitive indicators | `size-4` | Accordion chevron, select check, sheet close |
| Logo/brand mark | `size-5` | GitForkIcon in header/footer |
| Category illustrations | `size-5` | CategoryIcon component, stroke `2` |
| Fallback product logos | `size-5` | GitHub octocat SVG |
| Notification bell trigger | `size-5` | BellIcon in header |
| Navigation controls | `size-6` | MenuIcon, XIcon (hamburger/close) |
| Upload zone placeholder | `size-6` | UploadIcon in asset manager |
| Empty-state illustrations | `size-7` | Dollar, Folder, Clock on homepage |

---

## Component Mapping

How each shadcn/ui component maps to the new token system:

### Button

```tsx
// Uses: --color-brand, --color-brand-foreground, --color-brand-hover,
//       --radius-button, --shadow-elevation-1, --duration-fast
<Button>Primary</Button>        // bg-brand text-brand-foreground
<Button variant="outline">...</Button>  // border-border-default
<Button variant="secondary">...</Button> // bg-surface-raised
```

### Card

```tsx
// Uses: --color-surface-raised, --color-border-default, --radius-card,
//       --shadow-elevation-1 (rest), --shadow-elevation-3 (hover via card-lift),
//       --space-inset-card, --transition-card-lift
<Card>
  <CardHeader>...</CardHeader>   // space-inset-card padding
  <CardContent>...</CardContent>
</Card>

// Card lift-on-hover pattern:
<Link className="card-lift">    // translateY(-2px) + elevation-3 on hover
  <Card>...</Card>
</Link>
```

### Badge

```tsx
// Uses: --color-brand-subtle, --radius-badge, --space-inset-badge,
//       --font-weight-medium, --text-body-xs
<Badge variant="success">...</Badge>  // bg-success
<Badge variant="warning">...</Badge>  // bg-warning
```

### Input

```tsx
// Uses: --color-surface, --color-border-default, --color-border-strong (focus),
//       --radius-input, --text-body-md, --shadow-elevation-1 (focus ring)
<Input />
```

### Sheet (Modal/Drawer)

```tsx
// Uses: --color-surface-overlay, --shadow-elevation-4,
//       --space-gutter, --duration-normal
<Sheet>...</Sheet>
```

### Separator

```tsx
// Uses: --color-border-subtle
<Separator />
```

---

## Layout & Containers

### Container Widths

| Purpose | Max Width | Tailwind | Breakpoint Behavior |
|---|---|---|---|
| Page content (lists, grids) | `68rem` (1088px) | `max-w-[68rem]` | Full width below 1088px |
| Narrow content (hero, articles) | `48rem` (768px) | `max-w-3xl` | Full width below 768px |

### Padding (Gutter)

| Breakpoint | Padding | Tailwind |
|---|---|---|
| Mobile (< 640px) | 24px | `px-6` |
| sm+ (≥ 640px) | 24px | `px-6` |
| lg+ (≥ 1024px) | 32px | `lg:px-8` |

All page-level containers and header/footer use: `px-6 lg:px-8`

### Breakpoints (Tailwind v4 defaults)

| Prefix | Min Width | Value |
|---|---|---|
| `sm:` | 640px | 40rem |
| `md:` | 768px | 48rem |
| `lg:` | 1024px | 64rem |

### Grid Columns

| Component | Mobile | sm | md | lg |
|---|---|---|---|---|
| Product cards | 1 col | 2 cols | 2 cols | 3 cols |
| Category chips | 1 col | 3 cols | 4 cols | 5 cols |
| Footer columns | stacked | stacked | horizontal | horizontal |

---

## Quick Reference Card

```
Primary brand:   #a64626  (terracotta)
Body font:       Inter    (400, 500, 600)
Display font:    Satoshi  (600, 700)
Base unit:       4px (0.25rem)
Card radius:     8px (0.5rem)
Button radius:   6px (0.375rem)
Page gutter:     clamp(1rem, 3vw, 1.5rem)
Section gap:     clamp(3rem, 5vw, 5rem)
Elevation:       4 levels (subtle → floating)
Transition:      200ms ease-out (default)
```
