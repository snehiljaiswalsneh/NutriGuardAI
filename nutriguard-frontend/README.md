# NutriGuard AI — Frontend

A React + TypeScript + Tailwind CSS implementation of the NutriGuard AI product design (AI-powered food ingredient safety analyzer), built from the accompanying UI/UX design document.

## Stack

- **React 18** + **TypeScript**
- **Vite** for dev server/build
- **Tailwind CSS** (design tokens configured in `tailwind.config.js` — emerald primary, blue secondary, orange warning, red danger)
- **React Router v6** for navigation
- **Lucide React** for icons
- **Recharts** for the risk-analysis chart
- **Framer Motion** listed as a dependency for future micro-interactions (page transitions, score reveal) — currently the score/loading animations use CSS + inline SVG transitions to keep the bundle light; swap in Framer Motion where noted in the design doc if you want the orchestrated transitions

## Getting started

```bash
npm install
npm run dev
```

Then open the printed local URL (typically `http://localhost:5173`).

To type-check and build for production:

```bash
npm run build
npm run preview
```

## Project structure

```
src/
├── components/         # Shared UI: Navbar, Sidebar, cards, badges, charts
│   └── ui/              # Base primitives: Button, Input, Card
├── data/                # Mock data + shared TypeScript types (swap for real API calls)
├── lib/                 # Utility helpers (cn/classnames)
├── pages/
│   ├── auth/             # Login, Signup, Forgot Password, OTP
│   ├── Landing.tsx
│   ├── Home.tsx           # Ingredient input
│   ├── AnalyzingLoading.tsx
│   ├── Dashboard.tsx      # Analysis dashboard
│   ├── IngredientDetail.tsx
│   ├── Comparison.tsx     # Setup + result
│   ├── History.tsx
│   ├── Profile.tsx
│   ├── ErrorPages.tsx     # 404 / 500 / Network / No Analysis Found
│   └── FutureFeature.tsx  # OCR / Barcode / Voice / Language placeholders
└── App.tsx              # Route definitions
```

## What's wired up

All screens are click-through-able using mock data in `src/data/mock.ts` — no backend required to demo the flow:

`Landing → Signup → OTP → Home (paste ingredients) → Analyzing (loading) → Dashboard → Ingredient Detail → Compare → History → Profile`

## Connecting to a real backend

Replace the functions in `src/data/mock.ts` (`getAnalysisById`, `getIngredientById`, `scanHistory`) with real API calls (e.g. React Query or plain `fetch`), and swap the `setTimeout` navigation in `Home.tsx` / `AnalyzingLoading.tsx` for your actual AI-analysis request lifecycle (kick off the job on submit, poll or stream progress into the same staged-loader UI, then navigate to `/app/dashboard/:scanId` once the real result is ready).

## Design system reference

All colors, spacing, radii, and shadows are defined as Tailwind theme extensions in `tailwind.config.js` so they can be themed globally rather than hardcoded per component. See the accompanying `NutriGuard-AI-Design-Document.md` for the full rationale, screen-by-screen spec, and component library reference this build follows.

## Note on verification

This project was generated in a sandboxed environment without network access, so dependencies could not be installed or the build verified end-to-end here. Please run `npm install` and fix any minor type errors that surface — the code follows standard React/TS/Tailwind patterns throughout.
