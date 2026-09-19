# NutriGuard AI — Complete Product Design Document
### AI-Powered Food Ingredient Safety Analyzer
Prepared as a production-ready UI/UX specification for engineering handoff (React + TypeScript + Tailwind + shadcn/ui + Lucide + Framer Motion).

---

## 0. Design Principles

1. **Trust through clarity** — this is a health-adjacent product; every screen must feel medical-grade credible, never gimmicky.
2. **Calm urgency** — risk information is communicated with color and icon weight, not alarming animation or aggressive copy.
3. **Progressive disclosure** — summary first (Safety Score), detail on demand (ingredient drill-down).
4. **One primary action per screen** — never make the user choose between two equally weighted CTAs.
5. **AI is a collaborator, not a black box** — every AI output shows *why* (sources, reasoning, confidence) so users trust the verdict.

---

## 1. Information Architecture

```
NutriGuard AI
│
├── Public (Unauthenticated)
│   ├── Landing Page
│   ├── Login
│   ├── Signup
│   ├── Forgot Password
│   └── OTP Verification
│
├── Core App (Authenticated)
│   ├── Home / Ingredient Input
│   │   ├── Text Paste
│   │   ├── Manual Ingredient Builder
│   │   └── (Future) OCR / Barcode
│   ├── AI Analysis (Loading State)
│   ├── Analysis Dashboard
│   │   ├── Safety Score
│   │   ├── AI Health Summary
│   │   ├── Ingredient Table
│   │   ├── Risk Analysis
│   │   ├── Country Regulation Panel
│   │   ├── Allergy Warnings
│   │   └── Safer Alternatives
│   ├── Ingredient Detail Page
│   ├── Product Comparison
│   │   └── Comparison Result
│   ├── Scan History
│   │   └── History Item → reopens Dashboard
│   └── Profile
│       ├── Account Settings
│       ├── Appearance (Dark Mode)
│       ├── Language
│       ├── Notifications
│       └── Privacy & Data
│
├── System States
│   ├── Empty States (per section)
│   ├── Error Pages (404 / 500 / Network / No Analysis Found)
│   └── Toasts / Modals / Dialogs (global overlays)
│
└── Future Feature Placeholders
    ├── OCR Scanner
    ├── Barcode Scanner
    ├── Voice Assistant
    └── Multi-language Support
```

**Depth rule:** No core task should require more than **3 clicks** from Home. Ingredient Input → Dashboard → Ingredient Detail is the deepest primary path (2 clicks).

---

## 2. Navigation Flow

### Global Navigation Shell
- **Desktop/Laptop:** Persistent left **Sidebar** (collapsible to icon-rail) + top **Navbar** (search, notifications, avatar).
- **Tablet:** Sidebar collapses to icon-rail by default, expandable on tap.
- **Mobile:** Sidebar replaced by **Bottom Tab Bar** (Home, History, Compare, Profile) + top Navbar with hamburger for secondary items.

### Sidebar Items (Desktop)
1. Home (Ingredient Input) — `Home` icon
2. Dashboard (last analysis) — `LayoutDashboard`
3. Scan History — `History`
4. Compare Products — `GitCompare`
5. Future Tools (OCR/Barcode/Voice, badged "Soon") — `Sparkles`
6. — divider —
7. Settings — `Settings`
8. Help & Sources — `LifeBuoy`

### Primary User Flow (linear happy path)
```
Landing Page
   → Signup/Login
      → Home (Ingredient Input)
         → AI Analysis (Loading)
            → Analysis Dashboard
               → Ingredient Detail  (drill-down, back to Dashboard)
               → Product Comparison (select 2nd product)
               → Scan History (auto-saved here)
                  → reopen any past Dashboard
               → Profile (settings, anytime, global nav)
```

### Navigation Rules
- Every deep screen has a persistent **breadcrumb** (e.g., `Dashboard / Ingredient / Sodium Nitrite`).
- Back button behavior is **contextual**, not browser-only: closing Ingredient Detail returns to the exact scroll position on Dashboard.
- Global search (Navbar) allows jumping straight to any past scan or ingredient encyclopedia entry.

---

## 3. Screen List (Full Inventory)

| # | Screen | Auth? |
|---|---|---|
| 1 | Landing Page | No |
| 2 | Login | No |
| 3 | Signup | No |
| 4 | Forgot Password | No |
| 5 | OTP Verification | No |
| 6 | Home / Ingredient Input | Yes |
| 7 | AI Analysis Loading | Yes |
| 8 | Analysis Dashboard | Yes |
| 9 | Ingredient Detail Page | Yes |
| 10 | Product Comparison (Setup) | Yes |
| 11 | Product Comparison (Result) | Yes |
| 12 | Scan History | Yes |
| 13 | Profile — Overview | Yes |
| 14 | Profile — Settings/Notifications/Privacy | Yes |
| 15 | Empty State — No Scans Yet | Yes |
| 16 | Empty State — No Comparison Selected | Yes |
| 17 | Error — 404 | Both |
| 18 | Error — 500 | Both |
| 19 | Error — Network Error | Both |
| 20 | Error — No Analysis Found | Yes |
| 21 | Future Feature — OCR Scanner (placeholder) | Yes |
| 22 | Future Feature — Barcode Scanner (placeholder) | Yes |
| 23 | Future Feature — Voice Assistant (placeholder) | Yes |
| 24 | Future Feature — Multi-language (placeholder) | Yes |

---

## 4. Design System

### 4.1 Color Palette

| Token | Hex | Usage |
|---|---|---|
| `--primary` (Emerald) | `#0E9F6E` | Primary actions, safe/positive states, brand |
| `--primary-dark` | `#047857` | Hover/active states |
| `--primary-light` | `#D1FAE5` | Success backgrounds, chips |
| `--secondary` (Blue) | `#2563EB` | Informational elements, links, AI badges |
| `--secondary-light` | `#DBEAFE` | Info backgrounds |
| `--warning` (Orange) | `#F59E0B` | Medium-risk ingredients |
| `--warning-light` | `#FEF3C7` | Warning backgrounds |
| `--danger` (Red) | `#DC2626` | High-risk / banned ingredients |
| `--danger-light` | `#FEE2E2` | Danger backgrounds |
| `--neutral-900` | `#111827` | Primary text |
| `--neutral-600` | `#4B5563` | Secondary text |
| `--neutral-300` | `#D1D5DB` | Borders |
| `--neutral-100` | `#F3F4F6` | Surface / cards on white |
| `--background` | `#FFFFFF` | App background |
| `--dark-bg` | `#0B1120` | Dark mode background |
| `--dark-surface` | `#161C2C` | Dark mode cards |

Risk-level color mapping is **consistent everywhere** (badges, charts, borders): Green = Safe, Orange = Moderate, Red = High Risk, Gray = Unknown/Unclassified.

### 4.2 Typography

Font family: **Inter** (or "Geist Sans" as alternative) — modern, highly legible, excellent numeral tabular support for scores/tables.

| Style | Size / Line-height | Weight | Usage |
|---|---|---|---|
| Display | 40px / 48px | 700 | Landing hero only |
| H1 | 32px / 40px | 700 | Page titles |
| H2 | 24px / 32px | 600 | Section headers |
| H3 | 18px / 28px | 600 | Card titles |
| Body Large | 16px / 24px | 400 | Primary reading text |
| Body | 14px / 20px | 400 | Default UI text |
| Caption | 12px / 16px | 500 | Meta text, timestamps |
| Numeric/Score | 48–64px | 700 | Safety Score display, tabular nums |

### 4.3 Spacing & Grid

- Base unit: **4px**. Scale: 4, 8, 12, 16, 24, 32, 48, 64, 96.
- Desktop grid: 12-column, 1440px max container, 24px gutters, 80px outer margin.
- Laptop (1280px): 12-column, 24px gutters, 48px margin.
- Tablet (768px): 8-column, 16px gutters, 24px margin.
- Mobile (390px): 4-column, 16px gutters, 16px margin.

### 4.4 Corner Radius
- Small elements (badges, inputs): `8px`
- Cards: `16px`
- Modals/Sheets: `20px`
- Buttons: `10px` (pill variant `9999px` for filter chips)

### 4.5 Shadows (soft, medical-clean — never harsh)
- `shadow-xs`: `0 1px 2px rgba(16,24,40,0.05)` — inputs
- `shadow-sm`: `0 2px 6px rgba(16,24,40,0.06)` — resting cards
- `shadow-md`: `0 8px 24px rgba(16,24,40,0.08)` — hover/elevated cards
- `shadow-lg`: `0 16px 40px rgba(16,24,40,0.12)` — modals

### 4.6 Buttons
- **Primary:** Emerald fill, white text, `10px` radius, 44px height (touch-safe).
- **Secondary:** White fill, emerald 1.5px border.
- **Ghost:** Transparent, neutral text, used in toolbars.
- **Destructive:** Red fill — reserved for delete/remove-scan actions only.
- States: default, hover (darken 8%), active (darken 12% + scale 0.98), disabled (40% opacity), loading (spinner replaces label, width locked).

### 4.7 Input Fields
- 44px height, `8px` radius, 1px neutral-300 border, emerald border + subtle ring on focus.
- Label above field (never placeholder-only, for accessibility).
- Inline validation icon (check/alert) right-aligned; error text below in red, 12px.

### 4.8 Cards, Tables, Badges
- **Cards:** white surface, `16px` radius, `shadow-sm`, 24px internal padding, 1px neutral-100 border for definition in light mode.
- **Tables:** zebra-free (rely on row dividers, 1px neutral-100), sticky header on scroll, risk-level shown as leading colored dot + badge, row hover = neutral-50 background.
- **Badges:** pill shape, colored background at `-light` token + colored text at full token, 12px medium text, icon optional (e.g., `AlertTriangle` for high risk).

### 4.9 Modals / Dialogs / Dropdowns
- Modal: centered, max-width 480–640px depending on content, `20px` radius, `shadow-lg`, backdrop blur(4px) + 40% black scrim.
- Dialog (confirmation): max-width 400px, single primary + one ghost cancel action, icon at top signaling context (warning/info).
- Dropdown/Select: shadcn `Popover`-style, 8px radius, `shadow-md`, 4px offset from trigger, max-height 320px with scroll.

### 4.10 Navigation Components
- Navbar height: 64px desktop / 56px mobile, sticky, subtle bottom border, blurred backdrop on scroll (glassmorphism, 8px blur, 80% opacity white).
- Sidebar width: 260px expanded / 72px collapsed.
- Bottom Tab Bar (mobile): 64px height, 4 items + center-elevated FAB-style "Scan" action, safe-area padding for notch devices.

### 4.11 Icons
Lucide Icons exclusively, 20px default stroke-width 1.75, 24px for nav/primary actions. Risk icons: `ShieldCheck` (safe), `AlertTriangle` (moderate), `ShieldAlert`/`OctagonAlert` (high risk), `HelpCircle` (unknown).

### 4.12 Charts
- Library-agnostic spec (Recharts recommended): donut chart for Safety Score, horizontal bar for risk distribution, radar chart (optional) for nutrient/health-dimension comparison, line/sparkline for scan-history trend.
- Chart colors always map to the risk palette; never introduce new hues in data viz.

### 4.13 Progress Indicators & Loaders
- Circular progress (Safety Score reveal): animates 0 → final score, 900ms ease-out.
- Linear progress bar: AI Analysis loading, indeterminate shimmer while status unknown, determinate once stages are known (Parsing → Cross-referencing → Generating report).
- Skeleton loaders: gray-100 blocks with shimmer sweep, mirror exact final layout (cards/table rows) to avoid layout shift.

### 4.14 Toast Notifications
- Bottom-right (desktop) / bottom-center above tab bar (mobile).
- 4 variants: success (emerald), info (blue), warning (orange), error (red) — left icon + message + optional action + auto-dismiss 4s (errors persist until dismissed).

---

## 5. Component Library (Reusable Primitives)

| Component | Key Props / States | Notes |
|---|---|---|
| **Navbar** | search, notification-count, avatar-menu | Sticky, glass on scroll |
| **Sidebar** | collapsed/expanded, active-route highlight | Emerald left-border indicator for active item |
| **Footer** | minimal — links, version, disclaimer | Only on public pages |
| **Ingredient Card** | name, risk badge, one-line reason | Used in Dashboard table rows (expandable) & Ingredient encyclopedia lists |
| **Risk Badge** | `safe / moderate / high / unknown` | Color + icon + label, reusable everywhere |
| **Country Card** | flag, country name, status (Approved/Restricted/Banned) | Grid in Ingredient Detail |
| **Alternative Card** | product image placeholder, name, improved-score delta | Shown in Dashboard + Ingredient Detail |
| **AI Summary Card** | AI avatar/icon, generated text, confidence tag, "Sources" link | Glass accent border (subtle blue) to signal "AI-generated" |
| **Safety Score Card** | large circular score, verdict label, delta vs. last scan | Hero element of Dashboard |
| **History Card** | thumbnail/initial, product name, score badge, date, quick actions | List/grid toggle |
| **Comparison Card** | two-column mirrored layout, winner highlight | Used in Comparison Result |
| **Loading Spinner** | size sm/md/lg, label optional | Emerald arc on neutral track |
| **Search Box** | icon-left, clear-button, keyboard shortcut hint (⌘K) | Global + local variants |
| **Buttons** | primary/secondary/ghost/destructive × sm/md/lg | See 4.6 |
| **Accordion** | single/multi-open | Used for FAQ, ingredient long-lists |
| **Tabs** | underline style, emerald active indicator | Dashboard sub-sections on mobile |
| **Pagination** | numbered + prev/next, condensed on mobile | Scan History list |
| **Tooltip** | on-hover/on-focus, 200ms delay | Explains scientific terms inline |
| **Empty State** | icon illustration, headline, subtext, primary CTA | Consistent template across app |

---

## 6. Full User Journey Narrative

1. **Landing Page** — visitor learns the value prop ("Know what's really in your food") and is funneled to Signup.
2. **Signup/Login/OTP** — lightweight, social-login first, email fallback.
3. **Home / Ingredient Input** — user pastes an ingredient list or builds it manually (OCR/Barcode teased as "Coming soon").
4. **AI Analysis (Loading)** — transparent multi-stage progress builds trust ("Parsing ingredients… Cross-referencing global regulations… Generating your health report").
5. **Analysis Dashboard** — the payoff screen: Safety Score front and center, AI Summary, ingredient table, risk analysis, country regulation, allergy warnings, alternatives.
6. **Ingredient Detail** — drill into any single ingredient for deep scientific/regulatory context.
7. **Comparison** — user picks a second product to compare against the current one.
8. **History** — every scan auto-saved; revisit, delete, or re-compare.
9. **Profile** — manage account, appearance, language, notifications, privacy/data controls.

---

## 7. Screen Specifications

Each screen below follows the required 10-point format. (Auth screens, error pages, and future-feature placeholders are grouped at reduced depth where their pattern is standard/repeating — noted explicitly.)

---

### 7.1 Landing Page

1. **Objective:** Convert visitors into signups by communicating trust + clarity of value in under 5 seconds.
2. **Components:** Navbar (logo, nav links, Login/Signup buttons), Hero (headline, subhead, CTA, product screenshot/mockup), Trust strip (logos/stat chips: "50,000+ ingredients analyzed"), Feature grid (6 feature cards from current-features list), "How it works" 3-step strip, Testimonial/credibility section, Footer.
3. **Layout:** Centered hero (max 720px text column) over soft emerald-tinted gradient background; feature grid 3-columns desktop / 1-column mobile.
4. **User Interaction:** Primary CTA "Analyze Your First Product Free" → Signup. Secondary "See how it works" → scroll anchor.
5. **Wireframe:**
```
┌────────────────────────────────────────┐
│ Logo        Features  How it Works  [Login][Signup] │
├────────────────────────────────────────┤
│      Headline (2 lines, bold)          │
│      Subheadline (1 line, gray)        │
│        [ Get Started Free ]            │
│      [ product screenshot / mockup ]   │
├────────────────────────────────────────┤
│  [stat] [stat] [stat] [stat]           │
├────────────────────────────────────────┤
│  Feature  Feature  Feature             │
│  Feature  Feature  Feature             │
├────────────────────────────────────────┤
│  Step1 → Step2 → Step3                 │
├────────────────────────────────────────┤
│  Footer                                │
└────────────────────────────────────────┘
```
6. **High-Fidelity Description:** White background, emerald-to-white radial gradient behind hero; hero mockup shown inside a subtle glass card with drop shadow tilted 3° for depth; feature icons in emerald-light circular chips; CTA button emerald with soft glow on hover.
7. **Responsive:** Mobile stacks all sections single-column; hero mockup scales to 100% width with 16px margin; nav collapses to hamburger + persistent Signup button.
8. **Accessibility:** Headline is a real `<h1>`; CTA has descriptive accessible name ("Get started with NutriGuard AI free"); color contrast of emerald CTA on white verified ≥4.5:1; gradient never used as sole means of separating sections (also uses spacing/borders).
9. **UX Best Practices:** Single above-the-fold CTA; no more than one competing action visible at first scroll; social proof placed before deep feature explanation (builds trust early).

---

### 7.2 Home / Ingredient Input

1. **Objective:** Get an ingredient list into the system with minimum friction, supporting both power users (paste) and casual users (guided builder).
2. **Components:** Segmented control ("Paste Text" / "Build Manually" / "Scan — Coming Soon" disabled tab), large textarea with placeholder example, manual builder (repeatable ingredient-name input rows with add/remove), product-name/optional-brand field, "Analyze Ingredients" primary button, recent-scans quick-access strip.
3. **Layout:** Centered single-column card (max 720px) on white background; quick-access strip as horizontal scroll cards below the form.
4. **User Interaction:** Paste text → live character/ingredient count; Manual mode → dynamically add rows (`Plus` icon button); button disabled until minimum 1 valid ingredient; Enter/Cmd+Enter submits.
5. **Wireframe:**
```
┌───────────────────────────────┐
│ [Paste Text] [Manual] [Scan🔒]│
│ ┌───────────────────────────┐ │
│ │ Paste ingredient list...  │ │
│ │                           │ │
│ └───────────────────────────┘ │
│ Product name (optional) [___]│
│         [ Analyze Ingredients ]│
├───────────────────────────────┤
│ Recent: [card][card][card] →  │
└───────────────────────────────┘
```
6. **High-Fidelity Description:** Textarea has a subtle emerald focus ring; helper microcopy under textarea ("Tip: paste the full ingredient list exactly as printed on the pack"); button shows loading spinner in-place on submit.
7. **Responsive:** Tablet/mobile: segmented control becomes full-width tabs; recent-scans strip becomes vertically stacked list on narrow screens (<400px) or stays horizontal-scroll on tablet.
8. **Accessibility:** Textarea has a visible `<label>`; segmented control uses `role="tablist"`/`role="tab"` with arrow-key navigation; disabled "Scan" tab has `aria-disabled` + tooltip explaining it's upcoming.
9. **UX Best Practices:** Pre-fill a sample ingredient list as a dismissible ghost example so first-time users understand expected input format; auto-save draft input to prevent loss on accidental navigation.

---

### 7.3 AI Analysis — Loading State

1. **Objective:** Keep the user engaged and confident during processing (typically 5–15s) by making AI reasoning visible.
2. **Components:** Full-bleed centered loader card, animated AI "thinking" icon (pulsing brain/sparkle), staged progress list with checkmarks appearing sequentially, determinate progress bar, cancel button (ghost, small, bottom).
3. **Layout:** Vertically centered on screen, everything else dimmed/hidden to reduce distraction.
4. **User Interaction:** Fully passive; only action available is "Cancel". Auto-navigates to Dashboard on completion.
5. **Wireframe:**
```
┌───────────────────────────┐
│         ( ✦ pulsing )     │
│   Analyzing your product  │
│  ✓ Parsing ingredients     │
│  ✓ Cross-referencing bans  │
│  ◐ Generating health report│
│  [██████████░░░░] 72%      │
│        [ Cancel ]          │
└───────────────────────────┘
```
6. **High-Fidelity Description:** Icon uses a soft looping Framer Motion pulse/glow in emerald + blue gradient (signals "AI" without being gimmicky); each completed stage fades in with a checkmark; card sits on a very light neutral-50 background with subtle blur behind it.
7. **Responsive:** Same centered layout scales down; on mobile the stage list may collapse to a single rotating current-stage line to save vertical space.
8. **Accessibility:** `aria-live="polite"` region announces stage changes for screen readers; progress bar has `role="progressbar"` with `aria-valuenow`; motion respects `prefers-reduced-motion` (falls back to static icon + text updates only).
9. **UX Best Practices:** Never show a generic spinner alone for AI tasks >3s — labeled stages measurably reduce perceived wait time and increase trust in the eventual output.

---

### 7.4 Analysis Dashboard

1. **Objective:** Deliver the core value — an at-a-glance verdict plus the ability to drill into any dimension of the analysis.
2. **Components:** Page header (product name, scan date, "Re-scan"/"Compare"/"Share" actions), **Safety Score Card** (hero), **AI Summary Card**, **Allergy Warning banner** (conditional, red/orange), Ingredient Table (with Risk Badge per row, expandable), Risk Analysis chart (donut/bar breakdown of safe/moderate/high counts), Country Regulation panel (flags + status chips), Safer Alternatives carousel, Quick Statistics strip (ingredient count, additive count, natural vs. synthetic ratio).
3. **Layout:** 2-column desktop grid — left column (8/12) holds Summary + Ingredient Table + Risk Analysis; right column (4/12, sticky) holds Safety Score, Allergy Warning, Country Regulation, Alternatives.
4. **User Interaction:** Click any ingredient row → navigates to Ingredient Detail; click "Compare" → Product Comparison setup with current product pre-filled as Product A; tabs/anchor-nav for quick jump on long pages.
5. **Wireframe:**
```
┌─────────────────────────────────────────────┐
│ Product Name          [Re-scan][Compare][⋮]  │
├───────────────────────────┬───────────────────┤
│ AI Summary Card           │  Safety Score      │
│                           │   ( 78 / 100 )     │
│ ⚠ Allergy Warning         │   "Moderate Risk"  │
│                           ├───────────────────┤
│ Ingredient Table          │ Country Regulation │
│  ● Sodium Nitrite  [High] │  🇺🇸 Approved       │
│  ● Citric Acid    [Safe]  │  🇪🇺 Restricted     │
│  ...                      │  🇮🇳 Approved       │
│                           ├───────────────────┤
│ Risk Analysis (chart)     │ Safer Alternatives │
│                           │  [card][card]      │
└───────────────────────────┴───────────────────┘
```
6. **High-Fidelity Description:** Safety Score rendered as large circular donut (emerald arc for good scores, orange/red for lower) with animated count-up; AI Summary Card has a subtle blue-tinted glass border to distinguish "AI voice" from raw data; ingredient table rows use colored left-border matching risk level, hover elevates row with `shadow-xs`.
7. **Responsive:** Tablet: columns stack, right-column content moves below Ingredient Table but Safety Score stays pinned near top. Mobile: converts to vertical tab sections (Summary / Ingredients / Risks / Alternatives) to avoid excessive scroll, sticky mini safety-score chip in the header.
8. **Accessibility:** Safety score has a text-equivalent (e.g., "Safety Score 78 out of 100 — Moderate Risk") for screen readers, not conveyed by color/chart alone; table is a real `<table>` with proper headers; allergy warning uses `role="alert"`.
9. **UX Best Practices:** Score + verdict label always paired (never color alone); place the single most actionable item (Allergy Warning or top alternative) above the fold on mobile.

---

### 7.5 Ingredient Detail Page

1. **Objective:** Give a credible, sourced deep-dive on one ingredient so users understand *why* it's flagged.
2. **Components:** Breadcrumb, header (ingredient name + scientific name + Risk Badge), Description block, "Purpose in food" block, Health Effects list (icon + short explanation each), Country Regulations grid (Country Card ×N), Safer Alternatives (Alternative Card ×2–3), Research Sources list (linked citations), "Back to Dashboard" sticky action.
3. **Layout:** Single-column, max 800px reading width, generous line-height for scannability.
4. **User Interaction:** Tooltip on scientific/technical terms; "Sources" list expands via accordion; alternates link back into Dashboard/Comparison flow.
5. **Wireframe:**
```
┌───────────────────────────────┐
│ Dashboard / Sodium Nitrite     │
│ Sodium Nitrite (E250)  [High]  │
├───────────────────────────────┤
│ Description                    │
│ Purpose in Food                │
│ Health Effects                 │
│  ⚠ Linked to ...                │
│ Country Regulations             │
│  🇺🇸 Approved  🇪🇺 Restricted    │
│ Safer Alternatives              │
│  [card] [card]                  │
│ Research Sources ▸               │
└───────────────────────────────┘
```
6. **High-Fidelity Description:** Risk badge at header is oversized (pill, 16px text) for immediate scanning; Health Effects use a vertical timeline-style list with icon bullets rather than plain paragraphs; Sources accordion uses muted gray text with external-link icons.
7. **Responsive:** Mobile keeps single-column (already narrow); Country Regulations grid becomes horizontal scroll of Country Cards instead of wrapping grid.
8. **Accessibility:** All external source links open in new tab with `aria-label` noting "opens in new tab"; risk badge repeats as text, not icon/color only.
9. **UX Best Practices:** Always show at least one actionable safer alternative on a high-risk ingredient page — informing without offering a next step increases anxiety without utility.

---

### 7.6 Product Comparison — Setup & Result

1. **Objective:** Let users make a confident purchase decision between two products.
2. **Components (Setup):** Two side-by-side "slot" cards (Product A pre-filled from current scan if entered via Dashboard, Product B = search-from-history or new-input trigger), "Compare Now" CTA.
   **Components (Result):** Mirrored two-column comparison table (Safety Score, Risk Level, Ingredient Count, Harmful Ingredient Count), Visual Comparison chart (side-by-side bar or radar), Recommendation banner (AI-generated verdict, e.g., "Product B is the safer choice").
3. **Layout:** Perfect left/right symmetry; a central vertical divider with a "VS" chip.
4. **User Interaction:** Swap button to flip A/B; each column header links to that product's full Dashboard.
5. **Wireframe:**
```
┌─────────────┬───┬─────────────┐
│ Product A    │VS │ Product B    │
│ Score: 78     │   │ Score: 91     │
│ Risk: Moderate│   │ Risk: Safe    │
│ Ingredients:22│   │ Ingredients:14│
│ Harmful: 3    │   │ Harmful: 0    │
├─────────────┴───┴─────────────┤
│  [ visual bar comparison ]      │
├───────────────────────────────┤
│ ✓ Recommendation: Product B is  │
│   the safer choice.             │
└───────────────────────────────┘
```
6. **High-Fidelity Description:** Winning column gets a subtle emerald top-border highlight + small "Better Choice" ribbon badge; losing metrics shown in muted gray rather than red (avoid shaming a legitimately-purchased product, keep tone constructive).
7. **Responsive:** Mobile stacks Product A above Product B (VS chip becomes a horizontal divider with icon), Visual Comparison chart switches from side-by-side bars to a stacked/paired bar-per-metric layout for narrow width.
8. **Accessibility:** "Better Choice" is also stated in text form, not ribbon-only; comparison table uses proper `<th scope="col">`/`<th scope="row">` structure.
9. **UX Best Practices:** Never show comparison metrics without an overall plain-language recommendation — raw numbers alone increase cognitive load for non-expert users.

---

### 7.7 Scan History

1. **Objective:** Let users revisit, manage, and re-engage with past analyses.
2. **Components:** View toggle (list/grid), filter/sort bar (by date, risk level, score), **History Card** ×N (timeline grouped by "Today / This Week / Earlier"), search box, bulk-select for delete/compare, pagination.
3. **Layout:** Grid: 3-column card grid desktop, list: single-column dense rows. Grouped under date-section headers.
4. **User Interaction:** Click card → reopens that Dashboard; long-press/select checkbox → "Compare selected" or "Delete"; swipe-to-delete on mobile.
5. **Wireframe:**
```
┌───────────────────────────────┐
│ Search [____]  Sort ▾  [Grid|List]│
│ Today                           │
│  [card][card][card]             │
│ This Week                       │
│  [card][card][card]             │
└───────────────────────────────┘
```
6. **High-Fidelity Description:** Each History Card shows a small colored risk-dot + score badge top-right, product name, relative timestamp ("3 days ago"), quick-action icon row (Compare / Delete) revealed on hover (desktop) or always-visible tap targets (mobile).
7. **Responsive:** Grid degrades 3→2→1 columns across desktop/tablet/mobile; sort/filter bar collapses into a single "Filter" icon button opening a bottom sheet on mobile.
8. **Accessibility:** Delete action always requires confirmation Dialog (no destructive action on single tap); date-group headers are real headings for screen-reader navigation.
9. **UX Best Practices:** Persist last-used view (grid/list) and sort order per user; empty search state should suggest clearing filters rather than a dead end.

---

### 7.8 Profile — Overview & Settings

1. **Objective:** Give users control over identity, appearance, notifications, and data privacy in one predictable place.
2. **Components:** Profile header (avatar, name, email, edit button), Settings list grouped into sections: **Account** (name/email/password), **Appearance** (Dark Mode toggle, theme preview), **Language** (dropdown, multi-language future flag), **Notifications** (toggles: scan complete, weekly digest, new-ban alerts for saved ingredients), **Privacy & Data** (download my data, delete account, data-retention explainer), Logout button.
3. **Layout:** Left icon-tab list of setting sections (desktop) / accordion sections (mobile), right content pane shows active section.
4. **User Interaction:** Toggle switches apply instantly with toast confirmation; destructive actions (delete account) require typed confirmation in a Dialog.
5. **Wireframe:**
```
┌───────┬───────────────────────┐
│Account │  Full Name  [_______] │
│Appearance│ Email      [_______] │
│Language │ [ Save Changes ]      │
│Notify  │                        │
│Privacy │                        │
└───────┴───────────────────────┘
```
6. **High-Fidelity Description:** Dark Mode toggle shows a live mini-preview swatch (light/dark card thumbnail) rather than a bare switch; Privacy section uses neutral, reassuring iconography (`ShieldCheck`, `Download`) to reduce anxiety around data topics.
7. **Responsive:** Mobile converts the left tab list into a stacked accordion so each section expands in place; Save button becomes a sticky bottom bar.
8. **Accessibility:** All toggles are real `<button role="switch">` with `aria-checked`; delete-account flow is fully keyboard operable and screen-reader announces consequences before confirmation.
9. **UX Best Practices:** Never bundle "Delete Account" visually near safe/frequent actions — separate with spacing + destructive-only color to prevent accidental taps.

---

### 7.9 Empty States (Template + Key Instances)

1. **Objective:** Turn a "nothing here" moment into a clear next action rather than a dead end.
2. **Components:** Centered icon illustration (line-art, emerald/blue duotone), headline, one-line supporting text, single primary CTA.
3. **Layout:** Vertically centered within the content area (not full page — nav/sidebar remain visible).
4. **Instances:**
   - *No Scans Yet* (History): "Your scan history will show up here" → CTA "Analyze your first product".
   - *No Comparison Selected*: "Pick two products to compare" → CTA "Choose from history" / "Scan a new product".
5. **Wireframe:**
```
┌───────────────────────┐
│        ( icon )         │
│   No scans yet           │
│  Analyze a product to    │
│  start building history  │
│    [ Analyze Now ]       │
└───────────────────────┘
```
6. **High-Fidelity Description:** Illustration uses the same emerald/blue palette as the rest of the app (never generic gray clipart) to keep brand consistency even in "nothing" states.
7. **Responsive:** Illustration scales down proportionally on mobile; text remains centered, max 280px width.
8. **Accessibility:** Illustration is decorative (`aria-hidden`), headline is a real heading, CTA has clear accessible label.
9. **UX Best Practices:** Empty state copy should be encouraging, never apologetic ("Nothing here" reads worse than "Let's get your first scan started").

---

### 7.10 Error Pages (404 / 500 / Network Error / No Analysis Found)

1. **Objective:** De-escalate frustration and route the user back to safety within one click.
2. **Components:** Icon/illustration (distinct per error type), status headline, plain-language explanation (no raw stack traces/codes as primary text), primary CTA ("Go to Home" / "Retry"), secondary "Contact Support" link.
3. **Layout:** Centered, full-page, minimal chrome (Navbar logo only, no full nav, to keep focus on recovery).
4. **Variants:**
   - **404:** "Page not found" — CTA "Back to Home".
   - **500:** "Something went wrong on our end" — CTA "Retry" + auto-report logged silently.
   - **Network Error:** "Check your internet connection" — CTA "Retry" with connectivity icon; auto-retries with backoff and updates state live.
   - **No Analysis Found:** (product-specific) "We couldn't find this scan" — CTA "Start a new analysis".
5. **Wireframe:**
```
┌───────────────────────┐
│        ( icon )         │
│   Something went wrong   │
│  Try again in a moment    │
│      [ Retry ]            │
│   Contact support ▸        │
└───────────────────────┘
```
6. **High-Fidelity Description:** Error icons use the warning/danger palette sparingly — outline style, not solid red fills, to avoid feeling alarming for a simple 404.
7. **Responsive:** Fully centered layout is inherently responsive; font sizes step down one level on mobile.
8. **Accessibility:** Page `<title>` reflects the error for screen-reader/tab clarity; retry actions are keyboard-reachable and focus is programmatically set to the headline on load.
9. **UX Best Practices:** Never dead-end a user — every error screen offers at least one forward action, never "just" an explanation.

---

### 7.11 Authentication (Login / Signup / Forgot Password / OTP)

1. **Objective:** Fast, low-friction account access without compromising trust (health data sensitivity).
2. **Components:** Centered auth card (max 420px) with logo, form fields, primary CTA, social login buttons (Google/Apple), switch-mode link ("New here? Sign up"), OTP input as 6 individual boxes with auto-advance and paste support.
3. **Layout:** Single centered card over a softly branded background (same gradient as Landing hero, lower opacity).
4. **User Interaction:** Real-time field validation; password field has show/hide toggle; OTP auto-submits on 6th digit; "Resend code" link with 30s cooldown timer.
5. **Wireframe:**
```
┌───────────────────┐
│      Logo           │
│  Email    [_______] │
│  Password [_______] │
│      [ Log In ]      │
│  ── or ──             │
│  [Google] [Apple]     │
│  New here? Sign up    │
└───────────────────┘
```
6. **High-Fidelity Description:** Card has subtle glassmorphism (semi-transparent white, 12px blur) over the gradient backdrop; error states shake the field subtly (respecting reduced-motion) and show inline red helper text.
7. **Responsive:** Mobile: card becomes full-width with 24px side margins, background gradient simplified to reduce paint cost.
8. **Accessibility:** OTP boxes are a single logical group with `aria-label="One time passcode, digit N of 6"`; forgot-password flow never confirms/denies whether an email exists (security + prevents enumeration, phrased neutrally: "If an account exists, we've sent a reset link").
9. **UX Best Practices:** Autofocus first field on load; support password managers (correct `autocomplete` attributes); never block paste in OTP fields.

---

### 7.12 Future Feature Placeholders (OCR / Barcode / Voice / Multi-language)

1. **Objective:** Signal roadmap and gather interest without implying the feature works today.
2. **Components:** Disabled nav entry with "Soon" badge → on click opens a lightweight modal: icon, feature name, one-line description, "Notify me when available" button (email capture or one-tap if already logged in).
3. **Layout:** Modal, centered, 400px width, illustration top, copy + CTA below.
4. **User Interaction:** "Notify me" triggers toast confirmation + closes modal; no other interaction available (clearly not a dead feature, just gated).
5. **Wireframe:**
```
┌───────────────────┐
│      ( icon )        │
│   OCR Scanner         │
│  Coming soon — scan   │
│  labels with your     │
│  camera.               │
│  [ Notify Me ]         │
└───────────────────┘
```
6. **High-Fidelity Description:** Icon uses a dashed emerald outline treatment to visually communicate "in progress / not yet solid" distinct from live features.
7. **Responsive:** Modal collapses to a bottom sheet on mobile.
8. **Accessibility:** Nav item still keyboard-focusable (not removed from tab order) with `aria-disabled="true"` and accessible description of why.
9. **UX Best Practices:** Never let a "coming soon" entry look identical to a broken/dead link — the badge + modal makes intent explicit.

---

## 8. Responsive Behavior Summary

| Breakpoint | Width | Layout Shift |
|---|---|---|
| Desktop | 1440px | Full sidebar + 2-column dashboard |
| Laptop | 1280px | Sidebar slightly narrower, same 2-column logic |
| Tablet | 768px | Icon-rail sidebar, dashboard columns stack, grids 3→2 |
| Mobile | 390px | Bottom tab bar, single column everywhere, dashboard becomes tabbed sections |

---

## 9. Accessibility Standards (Applied App-Wide)

- WCAG 2.1 AA minimum contrast on all text and meaningful icons.
- Full keyboard operability: every interactive element reachable via Tab, visible focus ring (2px emerald offset ring, never `outline: none` without replacement).
- Color is never the sole indicator of risk level — always paired with icon + text label.
- All motion respects `prefers-reduced-motion`.
- Live regions (`aria-live`) for async states: analysis progress, toast notifications, form validation.
- Minimum touch target 44×44px on mobile.

---

## 10. Handoff Notes for Engineering

- All colors, spacing, radii, and shadows above should be implemented as Tailwind theme tokens / CSS variables, not hardcoded per-component values.
- Component Library (Section 5) maps 1:1 to a shadcn/ui-based implementation — most primitives (Dialog, Popover, Tabs, Accordion, Toast) exist in shadcn already and should be themed rather than rebuilt.
- Framer Motion should be reserved for: Safety Score reveal, AI loading stage transitions, modal/toast enter-exit, and page transitions between Dashboard ↔ Ingredient Detail — avoid decorative motion elsewhere to keep the medical/professional tone.
- This document intentionally contains no code — see accompanying implementation ticket breakdown for engineering task splitting by screen.
