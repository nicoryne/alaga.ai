# Web Dashboard Implementation Guide (Next.js 16)

This document is meant to brief another Cursor AI session (or any teammate) on how to build the web-admin counterpart of **alaga.ai** using the assets and flows we already defined on mobile. Treat every section as an actionable checklist.

---

## 1. Brand System (apply everywhere)

| Token | Value | Usage |
| --- | --- | --- |
| `--color-primary` | `#4FC3F7` | Accent, buttons, links, active nav |
| `--color-primary-muted` | `#E0F7FF` | Backgrounds for cards and alerts |
| `--color-success` | `#4CAF50` | Trend-up indicators |
| `--color-warning` | `#FFB74D` | Pending syncs, caution labels |
| `--color-danger` | `#FF8A80` | Critical cases |
| `--color-neutral-100` | `#F8FAFF` | Page background |
| `--color-neutral-400` | `#94A3B8` | Secondary text |
| `--color-neutral-900` | `#0F172A` | Headlines |

Typography: `font-family: 'Inter', sans-serif;` with weights 500 (labels) and 700 (metrics). Radius: `16px`. Shadow: `0 12px 30px rgba(15,23,42,0.08)`. Spacing baseline: `8px`.

> **Action for Cursor AI:** Create `src/styles/brand.css` exporting CSS variables, then import inside `app/layout.tsx`.

---

## 2. Project Setup (Next.js 16 App Router)

```bash
npx create-next-app@latest alaga-web --ts --app --eslint --tailwind --src-dir --no-experimental-app
cd alaga-web
npm install firebase @tanstack/react-query lucide-react recharts clsx
```

Project structure (should exist after setup):
```
src/
  app/
    (public)/login/page.tsx
    (dashboard)/layout.tsx
    (dashboard)/overview/page.tsx
    (dashboard)/patients/page.tsx
    (dashboard)/assessments/page.tsx
    (dashboard)/settings/page.tsx
    layout.tsx
    globals.css
  components/
  lib/
```

> **Action:** Configure path aliases (`tsconfig.json -> compilerOptions.paths`) to mirror the RN project (`@/components`, `@/lib`, etc.).

---

## 3. Firebase Integration (shared project)

Environment file `.env.local`:
```
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

`src/lib/firebase.ts`:
```ts
import { initializeApp, getApps, getApp } from 'firebase/app'
import {
  browserLocalPersistence,
  getAuth,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

const app = getApps().length ? getApp() : initializeApp(firebaseConfig)
const auth = getAuth(app)
await setPersistence(auth, browserLocalPersistence)
const db = getFirestore(app)

export { app, auth, db, signInWithEmailAndPassword, signOut, onAuthStateChanged }
```

> **Action:** Build `src/contexts/AuthContext.tsx` as a client component, subscribe with `onAuthStateChanged`, expose `login`, `logout`, `user`, `status`.

---

## 4. Authentication & Routing Flow

1. **Public Route (`/login`)**  
   - Minimal form, brand gradient background.  
   - Show inline error messages (Firebase error codes).  
   - Footer link to “Need access? Contact admin”.

2. **Protected Segment `(dashboard)`**  
   - Create `src/app/(dashboard)/layout.tsx` as a client component.  
   - Inside layout, check `useAuth()`. If `status === 'loading'`, render skeleton. If `!user`, redirect via `redirect('/login')` from `next/navigation`.

3. **Navigation**  
   - Use the Figma screenshot to replicate the left sidebar with four entries.  
   - Use `lucide-react` icons: `LayoutDashboard`, `UsersRound`, `Crosshair`, `Settings`.

> **Action:** Add `useActivePath` hook to highlight the current tab with a pill using `--color-primary`.

---

## 5. Global Shell Implementation Steps

1. **Sidebar** (`src/components/Sidebar.tsx`)  
   - Logo (reuse PNG from assets).  
   - “alaga.ai” + “Admin Dashboard” text.  
   - Nav items map.

2. **Top Bar** (`src/components/TopBar.tsx`)  
   - Breadcrumb (based on segment).  
   - Connectivity pill (use `navigator.onLine` + `window.addEventListener('online')`).  
   - User avatar with dropdown (Profile, Logout).

3. **Layout grid**  
   - `display: grid; grid-template-columns: 240px 1fr; min-height: 100vh; background: var(--color-neutral-100);`.

> **Action:** Compose Layout inside `(dashboard)/layout.tsx` with `<Sidebar />`, `<main>` wrapping `children`.

---

## 6. Screen Requirements

### Overview Page

Break into three sections referencing `docs/figma-mockups/Desktop - Dashboard.png`.

1. **Stats Row (4 cards)**  
   - `Total Cases`, `Patients`, `Critical Cases`, `Pending Syncs`.  
   - Each card uses the brand colors (blue, mint, coral, lavender).  
   - Include delta text (“+12% from last week”).

2. **Charts Row**  
   - **Case Timeline**: Recharts `LineChart` with Total vs Critical (dummy data until Firestore pipeline done).  
   - **Triage Distribution**: Recharts `PieChart` with severity segments.

3. **Bottom Row**  
   - **Top Conditions** card (list of top 5 from `assessments`).  
   - **Regional Overview** card (sparkline or mini table).  

> **Action:** Create `src/components/dashboard/StatCard.tsx`, `ChartCard.tsx`, `TimelineChart.tsx`, `TriagePie.tsx`.

### Patients Page

- Use server component to fetch list: `const patients = await getPatients()` from Firestore (or fetch API route).  
- Client table (DataGrid style) with columns: `Patient`, `Age`, `Gender`, `Region`, `Last Assessment`, `Status`.  
- Add filters (Region dropdown, Search input).  
- Row click opens side drawer `PatientDetailsDrawer` with summary, vitals, and “View assessments”.

### Assessments Page

- Table or cards for latest 30 assessments.  
- Filters: date range, triage level, facility.  
- Show AI confidence bars (XGBoost, Transformer, fused).  
- Provide `Export CSV` button calling `/api/assessments/export`.

### Settings Page

- Profile section (display name, email, role).  
- Organization preferences (default region, offline threshold).  
- Connectivity indicator (same pill).  
- Danger zone with “Sign out”.

---

## 7. Data Layer & Firestore Helpers

Create `src/lib/firestore.ts` with typed helpers:
```ts
import { collection, getDocs, orderBy, query, where, limit, doc, getDoc } from 'firebase/firestore'
import { db } from './firebase'

export async function fetchStats() { /* precomputed stats doc */ }
export async function fetchPatients() { /* returns PatientRecord[] */ }
export async function fetchAssessments(params) { /* filter aware */ }
```

For heavy aggregations (weekly trends, triage counts):
- Prefer Cloud Functions writing to `stats/overview`.  
- Web app reads that doc to avoid client-side fan-out queries.

> **Action:** Mirror `types/patient.ts` from mobile to `src/types/patient.ts`.

---

## 8. UI Components Checklist

- `StatCard` – props `{ title, value, delta, colorToken, icon }`.
- `TrendBadge` – arrow + percentage.
- `ConnectivityPill` – shows `Online` / `Offline`.  
- `DataTable` – wrapper around `<table>` with sticky header, zebra stripes.
- `Drawer` – overlay for patient details.
- `Skeleton` components for loading states.

> **Action:** Keep component API minimal so mobile + web share naming (e.g., `AssessmentSummary`).

---

## 9. Styling & Layout Guide

- Use Tailwind with custom theme (extend colors to match brand tokens).  
- Container width: `max-w-[1440px] mx-auto px-8`.  
- Card padding `p-6`, gap system `gap-6`.  
- Use `grid auto-fit` for responsive card layout.  
- Buttons: `rounded-full bg-[var(--color-primary)] px-5 py-2 text-white font-semibold`.

> **Action:** Update `tailwind.config.ts` with brand palette under `theme.extend.colors`.

---

## 10. Accessibility & Responsiveness

- Sidebar collapses to icon-only at `< 1200px` and becomes top nav at `< 768px`.  
- All interactive controls need `aria-label`.  
- Provide keyboard navigation for drawer (trap focus).  
- Charts need text summary fallback describing key insights.

---

## 11. Testing & Deployment

1. **Testing**  
   - Use Playwright or Cypress for login + nav smoke tests.  
   - Mock Firestore using local emulators (`firebase emulators:start --only firestore`).  
   - Add Storybook snapshots for cards (optional).

2. **Deployment**  
   - `npm run build && npm run start` locally.  
   - Deploy to Vercel; add environment variables in project settings.  
   - Update Firebase Auth authorized domains to include Vercel preview + production domains.

---

## 12. Future Enhancements

- Integrate AI assessment endpoint once we surface REST/GraphQL API.  
- Add role-based access (restrict Settings to admins).  
- Add offline banner synced with mobile `useConnectivity` logic.  
- Hook up push notifications (web FCM) for urgent cases.

---

**Delivery Expectation:** Another Cursor AI session should be able to open this doc, follow the action items, and ship the first iteration of the web dashboard without additional context. Keep the design pixel-aligned with `Desktop - Dashboard.png`, reuse Firebase auth credentials, and preserve parity with the mobile workflow.

