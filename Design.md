# Design System Inspired by Coursera

> Auto-extracted from `https://www.coursera.org/` on 2026-06-04

## 1. Visual Theme & Atmosphere

Friendly, approachable design with rounded shapes and generous whitespace.

The hero section leads with "Learn without limits".

**Key Characteristics:**
- Source Sans Pro as the heading font (custom web font loaded via @font-face)
- Source Sans Pro as the body font for all running text
- Heading weight 600, letter-spacing -0.48px
- Light/white background (#ffffff) as the primary canvas
- Primary accent `#0056d2` used for CTAs and brand highlights
- 5 shadow level(s) detected — standard shadows
- Rounded corners (8px+) creating a friendly, approachable feel
- Tags: light, rounded, accented, sans-serif

## 2. Color Palette & Roles

### Primary
- **Primary Accent** (`#0056d2`) · `--color-primary`: Brand color, CTA backgrounds, link text, interactive highlights.
- **Secondary Accent** (`#3860be`) · `--color-secondary`: Secondary brand, hover states, complementary highlights.
- **Background** (`#ffffff`) · `--color-bg`: Page background, primary canvas.
- **Background Secondary** (`#0056d2`) · `--color-bg-secondary`: Cards, surfaces, alternating sections.

### Text
- **Text Primary** (`#0f1114`) · `--color-text`: Headings and body text.
- **Text Secondary** (`#5b6780`) · `--color-text-secondary`: Muted text, captions, placeholders.

### Borders & Surfaces
- **Border** (`#f0f6ff`) · `--color-border`: Dividers, outlines, input borders.

### Full Extracted Palette

| # | Hex | CSS Variable | Role | Area | Contrast |
|---|---|---|---|---|---|
| 1 | `#ffffff` | `--palette-1` | block | large | text-dark |
| 2 | `#0056d2` | `--palette-2` | text-accent | large | text-light |
| 3 | `#f0f6ff` | `--palette-3` | block | large | text-dark |
| 4 | `#002761` | `--palette-4` | block | large | text-light |
| 5 | `#e8eef7` | `--palette-5` | block | large | text-dark |
| 6 | `#fff4e8` | `--palette-6` | block | large | text-dark |
| 7 | `#0f1114` | `--palette-7` | block | medium | text-light |
| 8 | `#363f52` | `--palette-8` | button | small | text-light |
| 9 | `#5b6780` | `--palette-9` | text-accent | small | text-light |
| 10 | `#3860be` | `--palette-10` | text-accent | small | text-light |

## 3. Typography Rules

- **Heading Font:** `Source Sans Pro` (web font)
- **Body Font:** `Source Sans Pro` (web font)

### Type Hierarchy

| Role | Font | Size | Weight | Line Height | Letter Spacing |
|---|---|---|---|---|---|
| H1 | Source Sans Pro | 48px | 600 | 56px | -0.48px |
| H2 | Source Sans Pro | 28px | 600 | 32px | -0.28px |
| H3 | Source Sans Pro | 16px | 600 | 20px | -0.048px |
| H4 | Source Sans Pro | 14px | 700 | 21px | normal |
| Body | Source Sans Pro | 14px | 400 | 20px | normal |

### Type Scale

| Token | Size | Suggested Usage |
|---|---|---|
| Display | `48px` | headings |
| H1 | `30px` | headings |
| H2 | `28px` | headings |
| H3 | `24px` | headings |
| H4 | `20px` | headings |
| Body L | `16px` | body / supporting text |
| Body | `14.4px` | body / supporting text |
| Small | `14px` | body / supporting text |
| XS | `13.6px` | body / supporting text |
| Caption | `13.008px` | body / supporting text |

## 4. Component Stylings

### Primary Button

```css
.btn-primary {
  background: transparent;
  color: #5b6780;
  border-radius: 8px;
  padding: 8px 8px;
  font-size: 14px;
  font-weight: 400;
  border: none;
  cursor: pointer;
}
```

### Filled Button

```css
.btn-filled {
  background: #0056d2;
  color: #ffffff;
  border-radius: 24px;
  padding: 0px 0px;
  font-size: 14px;
  font-weight: 400;
  border: none;
  cursor: pointer;
}
```

### Ghost Button

```css
.btn-ghost {
  background: transparent;
  color: #0056d2;
  border-radius: 8px;
  padding: 12px 12px;
  font-size: 14px;
  font-weight: 400;
  border: none;
  cursor: pointer;
}
```

### Filled Button 2

```css
.btn-filled-2 {
  background: #ffffff;
  color: #0056d2;
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 14px;
  font-weight: 700;
  border: none;
  cursor: pointer;
}
```

### Filled Button 3

```css
.btn-filled-3 {
  background: #0056d2;
  color: #ffffff;
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 600;
  border: none;
  cursor: pointer;
}
```

### Filled Button 4

```css
.btn-filled-4 {
  background: #363f52;
  color: #ffffff;
  border-radius: 32px;
  padding: 4px 12px;
  font-size: 14px;
  font-weight: 600;
  border: 0.666667px solid rgb(54, 63, 82);
  cursor: pointer;
}
```

## 5. Layout Principles

- **Base spacing unit:** `8px` — use multiples (16px, 24px, 32px, etc.)

### Spacing Scale (extracted from real elements)

| Token | Value | Role |
|---|---|---|
| spacing-1 | `8px` | element |
| spacing-2 | `16px` | element |
| spacing-3 | `2px` | element |
| spacing-4 | `4px` | element |
| spacing-5 | `12px` | element |
| spacing-6 | `32px` | card |
| spacing-7 | `1px` | element |
| spacing-8 | `11.2px` | element |

### Border Radius Scale

| Token | Value | Element |
|---|---|---|
| radius-button | `8px` | button |
| radius-subtle | `2px` | subtle |
| radius-card | `16px` | card |
| radius-pill | `100px` | pill |
| radius-subtle | `4px` | subtle |
| radius-card | `24px` | card |

## 6. Depth & Elevation

| Level | Shadow | Usage |
|---|---|---|
| Low | `rgb(0, 86, 210) 0px 0px 0px 1px inset` | Cards, subtle elevation |
| Low | `rgba(0, 0, 0, 0) 0px 0px 0px 1px inset` | Cards, subtle elevation |
| Mid | `rgb(153, 153, 153) 0px 2px 10px -3px` | Dropdowns, popovers |
| Low | `rgb(199, 197, 199) -3px -3px 5px -2px` | Cards, subtle elevation |
| Mid | `rgb(199, 197, 199) 0px 0px 12px 2px` | Dropdowns, popovers |


## 7. Do's and Don'ts

### Do
- Use `#ffffff` as the primary background color
- Use `Source Sans Pro` for all headings and `Source Sans Pro` for body text
- Use `#0056d2` as the single dominant accent/CTA color
- Maintain `8px` as the base spacing unit — all gaps should be multiples
- Use rounded corners (`8px`+) consistently for all interactive elements
- Apply the shadow system for elevation — use the extracted shadow values
- Use weight 600 for headings to match the brand's typographic voice

### Don't
- Don't use colors outside the extracted palette without justification
- Don't substitute Source Sans Pro/Source Sans Pro with generic alternatives
- Don't use irregular spacing — stick to 8px grid
- Don't use dark/black backgrounds — this is a light-themed design
- Don't use sharp corners — they feel hostile in this rounded design language
- Don't use pure black (#000000) for text — use `#0f1114` instead
- Don't add decorative elements not present in the original design — no badges, ribbons, banners, or ornaments unless the source site uses them
- Don't invent UI patterns the source site doesn't have — if the original has no NEW badge, don't add one just because a red is in the palette

## 8. Responsive Behavior

| Breakpoint | Width | Notes |
|---|---|---|
| Mobile | < 640px | Single column, stack sections, reduce font sizes ~80% |
| Tablet | 640–1024px | 2-column where appropriate, maintain spacing ratios |
| Desktop | 1024–1440px | Full layout as designed |
| Wide | > 1440px | Max-width container, center content |

- Touch targets: minimum 44×44px on mobile
- Maintain 8px base unit across breakpoints — only scale multipliers

## 9. Agent Prompt Guide

### Quick Color Reference

```
Background:  #ffffff
Text:        #0f1114
Accent:      #0056d2
Secondary:   #3860be
Border:      #f0f6ff
```

### Example Prompts

1. "Build a hero section with a `#ffffff` background, `Source Sans Pro` heading in `#0f1114`, and a `#0056d2` CTA button with 24px radius."
2. "Create a pricing card using background `#0056d2`, border `#f0f6ff`, `Source Sans Pro` for text, and 24px padding."
3. "Design a navigation bar — `#ffffff` background, `#0f1114` links, `#0056d2` for active state."
4. "Build a feature grid with 3 columns, 24px gap, each card using the card component style."
5. "Create a footer with `#0f1114` background, `#ffffff` text, and 16px padding."

### Iteration Guide

1. Start with layout structure (sections, grid, spacing)
2. Apply colors from the palette — background first, then text, then accents
3. Set typography — font families, sizes from the type scale, weights
4. Add components — buttons, cards, inputs using the specs above
5. Apply border-radius consistently across all elements
6. Add shadows for depth — use the extracted shadow values, not defaults
7. Check responsive behavior — test mobile and tablet layouts
8. Final pass — verify all colors match, spacing is consistent, fonts are correct

## 10. CSS Custom Properties

> 370 custom properties extracted from `:root` / `html` stylesheets.

### Color Variables

| Variable | Value |
|---|---|
| `--cds-color-darken-975` | `rgba(15, 17, 20, 0.98)` |
| `--cds-color-darken-950` | `rgba(15, 17, 20, 0.95)` |
| `--cds-color-darken-900` | `rgba(15, 17, 20, 0.9)` |
| `--cds-color-darken-800` | `rgba(15, 17, 20, 0.8)` |
| `--cds-color-darken-700` | `rgba(15, 17, 20, 0.7)` |
| `--cds-color-darken-600` | `rgba(15, 17, 20, 0.6)` |
| `--cds-color-darken-500` | `rgba(15, 17, 20, 0.5)` |
| `--cds-color-darken-400` | `rgba(15, 17, 20, 0.4)` |
| `--cds-color-darken-300` | `rgba(15, 17, 20, 0.3)` |
| `--cds-color-darken-200` | `rgba(15, 17, 20, 0.2)` |
| `--cds-color-darken-100` | `rgba(15, 17, 20, 0.1)` |
| `--cds-color-darken-50` | `rgba(15, 17, 20, 0.05)` |
| `--cds-color-darken-25` | `rgba(15, 17, 20, 0.03)` |
| `--cds-color-darken-0` | `rgba(15, 17, 20, 0)` |
| `--cds-color-lighten-975` | `rgba(255, 255, 255, 0.98)` |
| `--cds-color-lighten-950` | `rgba(255, 255, 255, 0.95)` |
| `--cds-color-lighten-900` | `rgba(255, 255, 255, 0.9)` |
| `--cds-color-lighten-800` | `rgba(255, 255, 255, 0.8)` |
| `--cds-color-lighten-700` | `rgba(255, 255, 255, 0.7)` |
| `--cds-color-lighten-600` | `rgba(255, 255, 255, 0.6)` |
| `--cds-color-lighten-500` | `rgba(255, 255, 255, 0.5)` |
| `--cds-color-lighten-400` | `rgba(255, 255, 255, 0.4)` |
| `--cds-color-lighten-300` | `rgba(255, 255, 255, 0.3)` |
| `--cds-color-lighten-200` | `rgba(255, 255, 255, 0.2)` |
| `--cds-color-lighten-100` | `rgba(255, 255, 255, 0.1)` |
| `--cds-color-lighten-50` | `rgba(255, 255, 255, 0.05)` |
| `--cds-color-lighten-25` | `rgba(255, 255, 255, 0.03)` |
| `--cds-color-lighten-0` | `rgba(255, 255, 255, 0)` |
| `--cds-color-pink-975` | `#1e051a` |
| `--cds-color-pink-950` | `#45093a` |
| ... | *(94 more)* |

### Spacing Variables

| Variable | Value |
|---|---|
| `--cds-base` | `8` |
| `--cds-border-radius-max` | `50px` |
| `--cds-border-radius-400` | `32px` |
| `--cds-border-radius-300` | `24px` |
| `--cds-border-radius-200` | `16px` |
| `--cds-border-radius-100` | `8px` |
| `--cds-border-radius-50` | `4px` |
| `--cds-border-radius-25` | `2px` |
| `--cds-spacing-1400` | `112px` |
| `--cds-spacing-1000` | `80px` |
| `--cds-spacing-800` | `64px` |
| `--cds-spacing-600` | `48px` |
| `--cds-spacing-400` | `32px` |
| `--cds-spacing-300` | `24px` |
| `--cds-spacing-200` | `16px` |
| `--cds-spacing-150` | `12px` |
| `--cds-spacing-100` | `8px` |
| `--cds-spacing-50` | `4px` |
| `--cds-spacing-25` | `2px` |

### Typography Variables

| Variable | Value |
|---|---|
| `--cds-text-decoration-link` | `underline` |
| `--cds-font-family-boutros-coursera` | `Boutros Coursera,Tahoma,sans-serif` |
| `--cds-font-family-source-sans-pro` | `Source Sans Pro,Arial,sans-serif` |
| `--cds-font-size-1100` | `5.5rem` |
| `--cds-font-size-1050` | `5.25rem` |
| `--cds-font-size-1000` | `5rem` |
| `--cds-font-size-950` | `4.75rem` |
| `--cds-font-size-900` | `4.5rem` |
| `--cds-font-size-850` | `4.25rem` |
| `--cds-font-size-800` | `4rem` |
| `--cds-font-size-750` | `3.75rem` |
| `--cds-font-size-700` | `3.5rem` |
| `--cds-font-size-650` | `3.25rem` |
| `--cds-font-size-600` | `3rem` |
| `--cds-font-size-550` | `2.75rem` |
| `--cds-font-size-500` | `2.5rem` |
| `--cds-font-size-450` | `2.25rem` |
| `--cds-font-size-400` | `2rem` |
| `--cds-font-size-375` | `1.875rem` |
| `--cds-font-size-350` | `1.75rem` |
| ... | *(78 more)* |

### Other Variables

| Variable | Value |
|---|---|
| `--cds-color-emphasis-quaternary-content-default` | `var(--cds-color-purple-950)` |
| `--cds-color-emphasis-quaternary-stroke-default` | `var(--cds-color-purple-700)` |
| `--cds-color-emphasis-quaternary-background-xweak` | `var(--cds-color-purple-25)` |
| `--cds-color-emphasis-quaternary-background-weak` | `var(--cds-color-purple-50)` |
| `--cds-color-emphasis-quaternary-background-default` | `var(--cds-color-purple-600)` |
| `--cds-color-emphasis-quaternary-background-strong` | `var(--cds-color-purple-700)` |
| `--cds-color-emphasis-quaternary-background-xstrong` | `var(--cds-color-purple-900)` |
| `--cds-color-emphasis-tertiary-content-default` | `var(--cds-color-yellow-800)` |
| `--cds-color-emphasis-tertiary-stroke-default` | `var(--cds-color-yellow-300)` |
| `--cds-color-emphasis-tertiary-background-xweak` | `var(--cds-color-yellow-25)` |
| `--cds-color-emphasis-tertiary-background-weak` | `var(--cds-color-yellow-50)` |
| `--cds-color-emphasis-tertiary-background-default` | `var(--cds-color-yellow-300)` |
| `--cds-color-emphasis-tertiary-background-strong` | `var(--cds-color-yellow-500)` |
| `--cds-color-emphasis-tertiary-background-xstrong` | `var(--cds-color-yellow-600)` |
| `--cds-color-emphasis-secondary-stroke-default` | `var(--cds-color-pink-500)` |
| ... | *(114 more)* |
