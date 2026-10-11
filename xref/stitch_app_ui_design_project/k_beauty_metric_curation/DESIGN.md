---
name: K-Beauty Metric Curation
colors:
  surface: '#f8f9ff'
  surface-dim: '#d5dae7'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e9eefb'
  surface-container-high: '#e3e8f5'
  surface-container-highest: '#dde3ef'
  on-surface: '#161c25'
  on-surface-variant: '#5a4043'
  inverse-surface: '#2b313a'
  inverse-on-surface: '#ebf1fe'
  outline: '#8e6f72'
  outline-variant: '#e2bec0'
  surface-tint: '#ba0f44'
  primary: '#b70942'
  on-primary: '#ffffff'
  primary-container: '#da2e59'
  on-primary-container: '#fffbff'
  inverse-primary: '#ffb2ba'
  secondary: '#665c5e'
  on-secondary: '#ffffff'
  secondary-container: '#ebdcdf'
  on-secondary-container: '#6a6063'
  tertiary: '#525d6c'
  on-tertiary: '#ffffff'
  tertiary-container: '#6a7585'
  on-tertiary-container: '#fdfcff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffd9dc'
  primary-fixed-dim: '#ffb2ba'
  on-primary-fixed: '#400011'
  on-primary-fixed-variant: '#910031'
  secondary-fixed: '#eddfe2'
  secondary-fixed-dim: '#d1c3c6'
  on-secondary-fixed: '#211a1c'
  on-secondary-fixed-variant: '#4e4447'
  tertiary-fixed: '#d8e3f5'
  tertiary-fixed-dim: '#bcc7d9'
  on-tertiary-fixed: '#111c29'
  on-tertiary-fixed-variant: '#3d4856'
  background: '#f8f9ff'
  on-background: '#161c25'
  surface-variant: '#dde3ef'
  background-canvas: '#F8F9FA'
  background-surface: '#FFFFFF'
  border-subtle: '#E5E8EB'
  text-muted: '#8B95A1'
  metric-positive: '#F04452'
  metric-positive-subtle: '#FEECEE'
  metric-negative: '#3182F6'
  metric-negative-subtle: '#EBF4FF'
  tag-skincare: '#3182F6'
  tag-skincare-bg: '#EBF4FF'
  tag-makeup: '#FF4B72'
  tag-makeup-bg: '#FFF0F3'
  tag-brand: '#8B95A1'
  tag-brand-bg: '#F2F4F6'
  ad-compliance-border: '#D1D6DB'
  ad-compliance-bg: '#F9FAFB'
typography:
  headline-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 42px
    letterSpacing: -0.02em
  headline-xl-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.015em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 34px
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 26px
    letterSpacing: -0.01em
  title-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.01em
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 22px
    letterSpacing: -0.005em
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0em
  metric-display:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '700'
    lineHeight: 20px
    letterSpacing: -0.01em
  metric-subtle:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0em
  badge-label:
    fontFamily: Plus Jakarta Sans
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.02em
  caption:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: 0em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-desktop: 1.5rem
  margin: 1rem
  margin-desktop: 2rem
  space-2xs: 0.25rem
  space-xs: 0.5rem
  space-sm: 0.75rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
  space-2xl: 3rem
---

## Brand & Style

This design system establishes a high-precision, editorial data environment tailored for K-beauty YouTube ranking, analytics, and talent discovery. The visual philosophy reconciles two opposing worlds: the crisp, refined editorial elegance of modern Korean beauty commerce (evoking Olive Young’s clean, trend-forward clarity) and the disciplined, high-density metric hierarchy of professional analytics dashboards (reminiscent of PlayBoard).

The UI evokes professionalism, aesthetic poise, and uncompromising statistical reliability. Rather than indulging in kitschy cosmetic tropes, the interface uses soft cosmetic rose and blush nuances strictly as deliberate focal accents, balanced against deep Korean typographic slates and calm, expansive neutral surfaces.

The visual style blends **Contemporary Editorial Minimalism** with **Structured Data Architecture**:
- **Typographic Precision:** High-contrast typographic hierarchy using crisp grotesque letterforms and tabular numerals that handle compact Korean metric scales (`12.3만`, `1.8억`) effortlessly.
- **Low-Noise Surfaces:** Pristine white and subtle off-white backgrounds structured by delicate hairline dividers, avoiding gratuitous shadows.
- **Functional Tagging:** Category identification (Skincare, Makeup, Cleansing, Brand Review) and platform regulatory notices are framed using pill-shaped badges, ensuring immediate scannability without visual clutter.

## Colors

The palette establishes an authentic K-beauty editorial signature grounded in rigorous data usability and WCAG AA accessibility standards (4.5:1 minimum text contrast).

### Color Philosophy & Usage
- **Primary Rose (`#FF4B72`) & Rose Wash (`#FFF0F3`):** The primary color serves as the core brand accent. It is reserved for high-signal interactive states, active filter selections, primary ranking badges (Top 1–3 highlights), and primary CTAs. It must never overwhelm large content backgrounds.
- **Deep Slate Hierarchy:**
  - Primary Content (`#191F28`): Delivers sharp contrast for channel titles, metric numbers, and table headers.
  - Secondary Context (`#4E5968`): Applied to table headers, subheadings, and contextual labels.
  - Muted Annotations (`#8B95A1`): Used for timestamps, rank deltas, and disclaimers.
- **Canvas & Elevation Tokens:** Surfaces utilize pure white (`#FFFFFF`) cards mounted over a neutral canvas (`#F8F9FA`), delimited by crisp borders (`#E5E8EB`).
- **Trend Indicators:** Metric deltas follow Korean financial and analytics conventions:
  - Metric Increase: Soft vivid crimson (`#F04452`) paired with Unicode `▲` and explicit `"증가"` textual labels.
  - Metric Decrease: Cool slate-blue (`#3182F6`) paired with Unicode `▼` and explicit `"감소"` textual labels.
  - Color is never used as the sole conveyor of metric trajectory.
- **Categorical & Regulatory Badges:** Content tags utilize low-saturation tinted surfaces with legible text counterparts (`#FFF0F3` with `#FF4B72` for Makeup; `#EBF4FF` with `#3182F6` for Skincare). Legal disclosure badges (`"광고"`, `"유료 등록"`) employ neutral tinted backgrounds (`#F9FAFB`) with structured hairline borders (`#D1D6DB`).

## Typography

Typography centers on pure readability across dense numeric figures and Hangul characters. In implementation environments, the font stack falls back to `Pretendard`, `-apple-system`, `BlinkMacSystemFont`, and system sans-serif.

### Implementation Principles
- **Localized Numeric Formatting:** Korean compact notation (`12.3만`, `1.5억`) is enforced for rapid table scanning. Every abbreviated figure must expose its full, unrounded value (`123,456명`) via semantic HTML `title` attributes and hidden `<span class="sr-only">` elements.
- **Tabular Numerics:** All numeric figures in ranking positions, subscriber counts, total views, and historical deltas require `font-variant-numeric: tabular-nums` to maintain aligned vertical scans across stacked table rows.
- **Semantic Structure:** Exactly one primary `<h1>` element is rendered per page view (`headline-xl`). Tables require a visible or screen-reader-accessible `<caption>` detailing date scope and filter parameters.
- **Scale Compression for Mobile:** Display headlines compress from 32px down to 24px (`headline-xl-mobile`) on screens below 640px to eliminate awkward line breaks in Korean phrasing.

## Layout & Spacing

The layout model is anchored in an 8px architectural cadence (subdivided by 4px for fine typographic and badge alignment). 

### Layout Model & Grid Hierarchy
- **Desktop (>= 1024px):** A 12-column responsive layout within a maximum container width of `1280px`. The primary ranking table occupies 8–9 columns, while side modules (`board_side`, `channel_side` sponsored slots, and category summaries) reserve a fixed 300px or 3–4 column complementary rail. Outer canvas margin is `2rem` (32px), with `1.5rem` (24px) gutters.
- **Tablet (768px - 1023px):** A fluid 8-column layout with `1.25rem` (20px) gutters and margins. The side rail wraps cleanly below the primary table.
- **Mobile (< 768px, with 375px baseline minimum):** A single-column fluid layout with `1rem` (16px) canvas margins. Dense desktop table structures collapse into vertical cards.

### Layout Stability & Zero Cumulative Layout Shift (CLS)
- All banner slots (`home_top`, `board_side`, `channel_side`) are constrained by strict, fixed aspect-ratio container tokens (e.g., `min-height: 90px` on mobile, `250px` on desktop side rails) loaded with skeleton placeholders to guarantee 0.0 CLS during server-side hydration and local asset streaming.

## Elevation & Depth

This design system avoids heavy skeuomorphic drop shadows, relying instead on **low-contrast outline separation and clean surface layering**:

- **Ground Level (Canvas):** `#F8F9FA` serves as the canvas substrate, establishing separation from pure-white data cards.
- **Container Level (Surface):** `#FFFFFF` surfaces elevate table wrappers, data cards, and search filters. Separation is achieved through hairline borders (`1px solid #E5E8EB`) rather than heavy blurred drop shadows.
- **Hover & Active Elevation:** Interactive table rows and selectable cards employ a hairline tint shift (`#F9FAFB`) combined with an ultra-diffused, ambient shadow (`0 2px 8px rgba(25, 31, 40, 0.04)`).
- **Sticky Column & Header Anchors:** Sticky table headers use solid `#FFFFFF` with a bottom border (`1px solid #E5E8EB`), providing clean visual anchoring during long ranking scrolls.
- **Focus Rings:** Accessibility-mandated focus indicators use a crisp 2px offset ring in primary rose (`outline: 2px solid #FF4B72; outline-offset: 2px;`) to ensure full keyboard navigation compliance.

## Shapes

The geometric signature balances structured institutional tables with soft, friendly beauty-editorial curves.

- **Base Radius (8px / `rounded`):** Standard interactive elements, filter input wrappers, card containers, and YouTube thumbnail images.
- **Large Radius (16px / `rounded-lg`):** Dedicated promotion slots, summary stat cards, and modal dialogs.
- **Pill Form (9999px / `rounded-full`):** Category chips, ranking tier badges (`TOP 10`), trend change indicators (`▲ 12%`), and legal disclosure flags (`"광고"`).
- **Table Integrity:** Tables feature 8px outer border radii with `overflow: hidden` on containing blocks to prevent jagged border corners.

## Components

### Ranking Table (Desktop)
- **Structure:** Standard HTML5 semantic `<table>` wrapped in a border-enclosed surface container.
- **Header Row:** Sticky `<th>` elements set in `metric-subtle` uppercase styling (`#4E5968`), with a solid bottom border (`#E5E8EB`) and clear sorting indicators.
- **Data Rows:** Minimum height 64px. Includes ranking position, channel avatar (44px circular thumbnail with 1px border), verified badge, Korean channel name, primary category pill, compact subscriber count, 30-day view trends, and historical delta.
- **Top 3 Highlighting:** Ranks 1, 2, and 3 display customized rank badges: Rank 1 (#FF4B72 fill, white text), Ranks 2–3 (#191F28 fill, white text).

### Mobile Ranking Cards
- Table rows collapse into stacked cards below 768px.
- Each card highlights: Rank position badge, 40px channel thumbnail, channel name, category tag, and 2 primary metrics (Subscribers and Trend direction). Secondary columns (such as aggregate upload counts) are hidden behind a detail tap.

### Pill Badges & Chips
- **Category Chips:** Light background fill (`#FFF0F3` for Makeup, `#EBF4FF` for Skincare) with high-contrast text (`#FF4B72` / `#3182F6`), 6px horizontal padding, 2px vertical padding, font size 11px, weight 600.
- **Filter Chips (Interactive):** Rendered as static HTML `<a>` tags for JavaScript-free, SEO-optimal filtering. Default: `#FFFFFF` background, `1px solid #E5E8EB`, `#4E5968` text. Selected: `#FF4B72` background, white text.

### Buttons & Interactive Controls
- **Primary Action:** `#FF4B72` background, `#FFFFFF` text, 8px border radius, 10px 18px padding, bold weight. Hover: `#E03E62`.
- **Secondary Action:** `#FFFFFF` background, `1px solid #E5E8EB`, `#191F28` text. Hover: `#F8F9FA`.

### Input Fields & Search Bars
- Search inputs feature an 8px radius, height 44px, hairline border (`#E5E8EB`), and left-aligned search glyph.
- Active focus state: `border-color: #FF4B72` with an ambient glow (`box-shadow: 0 0 0 3px rgba(255, 75, 114, 0.12)`).

### Metric Trajectory Indicators
- **Positive Delta:** Pill badge or inline text using `#F04452` accompanied by `▲` and localized text (`"증가"`).
- **Negative Delta:** Pill badge or inline text using `#3182F6` accompanied by `▼` and localized text (`"감소"`).

### Regulatory & Ad Slots
- **Compliance Badges:** Badges for `"광고"`, `"유료 등록"`, and `"제휴 링크"` use neutral grey framing (`#F2F4F6` background, `#4E5968` text, `1px solid #D1D6DB`).
- **Banner Enclosures:** Hardened layout slots with `overflow: hidden`, subtle `"AD"` watermark indicators, and zero layout shift.