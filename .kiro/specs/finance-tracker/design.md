# Design — Personal Finance Tracker (PWA)

## Overview

A client-only, installable PWA for tracking personal income and expenses. There is no backend: all data lives on the device in IndexedDB, and the app shell is cached by a service worker so it launches full-screen and offline from the iOS home screen.

The app is built with **vanilla JavaScript (ES modules) + HTML + CSS** — no build step and no third-party runtime dependencies. This decision was forced by the sandbox network mode (INTEGRATIONS_ONLY), which blocks the npm registry and all CDN mirrors, making `npm install` impossible. The vanilla approach is also simpler and fully transparent for a single-user personal app. PWA assets (a hand-written `manifest.json` and a Workbox-free service worker) are authored directly. The spending chart is drawn with inline **SVG**. Styling is plain CSS (CSS custom properties) for a lightweight, mobile-first **black-themed** UI.

> **Original stack (not used):** React + TypeScript + Vite, `vite-plugin-pwa`, Recharts, and the `idb` wrapper. Retained here for historical context; the requirements are unchanged and fully met by the vanilla implementation. IndexedDB is used directly via the browser API instead of the `idb` wrapper.

This design covers Requirements 1–7 and 9–11. Requirement 8 (balance trend line chart) is deferred and intentionally not implemented, though the data layer exposes a monthly-aggregation helper that could support it later.

### Technology Decisions

| Concern | Choice | Rationale |
|---|---|---|
| Framework | React 18 + TypeScript | Component model fits the list/form/dashboard split; strong typing for the transaction model. |
| Build tool | Vite | Fast dev server, first-class PWA plugin, simple static output for any host. |
| PWA tooling | `vite-plugin-pwa` (Workbox) | Generates manifest + service worker, precaches the app shell, handles registration and updates. |
| Storage | IndexedDB via a thin typed wrapper (`idb` library) | Robust structured storage for transactions/categories; async, larger quota than localStorage. |
| Charts | Recharts | React-native, responsive, good on mobile; covers pie/bar for spending-by-category. |
| Routing | Minimal in-app view state (or `react-router` with two routes) | Only two primary views (Dashboard, Transactions); keep it light. |
| State | React Context + hooks over a data-service layer | No need for Redux; a single store context is sufficient. |

## Architecture

```
┌───────────────────────────────────────────────────────────┐
│                        UI (React)                           │
│  App shell / nav                                            │
│   ├─ DashboardView   (summary cards, spending pie/bar)      │
│   ├─ TransactionsView(list, filters, empty states)          │
│   ├─ TransactionForm (add/edit modal or route)              │
│   └─ CategoryManager (add/delete custom categories)         │
└───────────────▲───────────────────────────┬───────────────┘
                │ hooks (useTransactions,     │ dispatch actions
                │ useCategories, useMonth)    │
┌───────────────┴───────────────────────────▼───────────────┐
│                  State layer (Context)                      │
│  StoreProvider: in-memory state + selectors                 │
│   - selectedMonth, transactions[], categories[]             │
│   - derived: monthly totals, spending-by-category           │
└───────────────▲───────────────────────────┬───────────────┘
                │ load on init                │ persist on change
┌───────────────┴───────────────────────────▼───────────────┐
│              Data service (repository)                      │
│  db.ts (idb wrapper): transactions & categories stores      │
│  seedDefaultCategories(), CRUD, safe read w/ fallback       │
└───────────────▲───────────────────────────────────────────┘
                │
┌───────────────┴───────────────────────────────────────────┐
│         Platform: IndexedDB  +  Service Worker (Workbox)     │
└─────────────────────────────────────────────────────────────┘
```

**Data flow:** On startup, `StoreProvider` loads categories and transactions from the repository (seeding defaults on first run), holds them in memory, and exposes derived selectors. UI reads via hooks and issues mutations through the store; every mutation updates in-memory state *and* writes through to IndexedDB. Derived values (monthly totals, spending-by-category) are computed with memoized selectors from in-memory state, so the dashboard and list stay in sync automatically (Req 2.4, 6.2, 7.4).

## Data Models

```ts
type TxType = 'income' | 'expense';

interface Transaction {
  id: string;            // uuid
  amount: number;        // positive number; type carries the sign meaning
  type: TxType;
  categoryId: string;    // FK -> Category.id
  date: string;          // ISO 'YYYY-MM-DD' (local date, no time)
  note?: string;         // optional
  createdAt: number;     // epoch ms, for stable tiebreak ordering
}

interface Category {
  id: string;            // uuid; defaults use stable slugs e.g. 'food'
  name: string;          // display name, unique case-insensitive
  isDefault: boolean;    // default categories cannot be deleted (Req 5.5)
}

// Derived (not stored)
interface MonthlySummary {
  month: string;         // 'YYYY-MM'
  totalIncome: number;
  totalExpenses: number;
  net: number;           // income - expenses
}

interface CategorySpend {
  categoryId: string;
  categoryName: string;
  total: number;         // expense total for the month
}
```

**Default categories** (seeded once, `isDefault: true`): Food, Transport, Rent, Bills, Shopping, Entertainment, Income, Other. (Req 5.1)

### IndexedDB schema
- Database: `finance-tracker`, version 1.
- Object store `transactions`, keyPath `id`; index `by-date` on `date`.
- Object store `categories`, keyPath `id`; index `by-name` on lowercased name for duplicate checks (Req 5.3).

## Components and Interfaces

### Repository (`src/data/db.ts`)
```ts
getAllTransactions(): Promise<Transaction[]>
addTransaction(tx: Transaction): Promise<void>
updateTransaction(tx: Transaction): Promise<void>
deleteTransaction(id: string): Promise<void>
getAllCategories(): Promise<Category[]>
addCategory(c: Category): Promise<void>
deleteCategory(id: string): Promise<void>
seedDefaultCategoriesIfEmpty(): Promise<Category[]>
```
Reads are wrapped so a missing/corrupt DB resolves to a valid empty/default state instead of throwing (Req 9.3).

### Store (`src/state/StoreProvider.tsx` + hooks)
- Holds `transactions`, `categories`, `selectedMonth` (defaults to current month).
- Mutations: `addTransaction`, `editTransaction`, `removeTransaction`, `addCategory`, `removeCategory`, `setSelectedMonth`.
- Selectors (memoized): `transactionsForMonth`, `filteredTransactions(monthFilter, categoryFilter)`, `monthlySummary`, `spendingByCategory`.

### Validation (`src/lib/validation.ts`)
- `validateTransaction(input)` → returns field-level errors; enforces positive amount, valid type, selected category, valid date (Req 1.2–1.3, 2.2).
- `normalizeCategoryName(name)` and duplicate check (case-insensitive) (Req 5.3).

### Views / Components
- **DashboardView** — month selector; three summary cards (income / expenses / net, net colored when negative — Req 6.3); spending chart (pie by default). Empty states for no data (Req 6.4, 7.3).
- **TransactionsView** — filter bar (month + category, combinable + clear — Req 4); list sorted by date desc then `createdAt` desc (Req 3.1); each row shows amount/type/category/date/note with income vs expense styling (Req 3.2–3.3); empty state (Req 3.4); row actions edit/delete.
- **TransactionForm** — add/edit; date defaults to today (Req 1.4); inline validation messages (Req 1.3); shared by add and edit (Req 2.1).
- **CategoryManager** — lists categories, add custom (with duplicate rejection), delete custom only with confirmation when in use; defaults not deletable (Req 5.2–5.5).
- **ConfirmDialog** — reused for delete confirmations (Req 2.3).
- **SpendingChart** — Recharts pie/bar of `spendingByCategory`.

### SpendingChart mapping
`spendingByCategory` filters to `type === 'expense'` within `selectedMonth`, groups by `categoryId`, sums amounts, and omits zero-total categories (Req 7.2). Empty array → empty-state message (Req 7.3).

## PWA & iOS Design (Req 10, 11)

### Manifest (`vite-plugin-pwa` `manifest` option → emitted `manifest.webmanifest`)
```jsonc
{
  "name": "Personal Finance Tracker",
  "short_name": "Finances",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "background_color": "#0f172a",
  "theme_color": "#0f172a",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icons/icon-512-maskable.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

### iOS meta tags (in `index.html`)
```html
<meta name="theme-color" content="#0f172a" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<meta name="apple-mobile-web-app-title" content="Finances" />
<link rel="apple-touch-icon" href="/icons/apple-touch-icon-180.png" />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
```
- `viewport-fit=cover` + `env(safe-area-inset-*)` padding so content clears the notch/home indicator in full-screen mode (Req 10.3, 11.4).
- Icons required: `apple-touch-icon-180.png` (180×180, Req 10.6), `icon-192.png`, `icon-512.png`, plus a maskable 512.

### Service worker
- `vite-plugin-pwa` in `generateSW` mode with `registerType: 'autoUpdate'`.
- Precache the app shell (HTML/JS/CSS/icons) so it loads offline from the home screen (Req 10.4).
- Registration is non-blocking and wrapped so failure is logged but does not break first render (Req 10.5).
- In dev, the plugin's `devOptions` enables testing the SW without a full build.

### Responsive/clean UI (Req 11)
- Mobile-first CSS with a single-column layout; sticky bottom nav (Dashboard / Transactions) and a floating "+" add button within thumb reach (Req 11.3).
- Tap targets ≥ 44×44 px (Req 11.1). Fluid layout that stays usable on larger screens (Req 11.2). Fixed controls don't shift on scroll (Req 11.4).
- CSS variables for a small, consistent color/spacing system.

## Error Handling
- **Persistence failures:** repository writes are awaited; on write failure the store surfaces a non-blocking error message and keeps in-memory state consistent. Corrupt/missing reads fall back to empty/defaults (Req 9.3).
- **Validation:** form submission blocked with field-level messages; no partial writes (Req 1.3, 2.2).
- **Duplicate category:** rejected with a message; not persisted (Req 5.3).
- **Delete guards:** confirmation required; default categories not deletable (Req 2.3, 5.5).
- **Service worker:** registration errors caught and logged; app still renders (Req 10.5).
- **Offline:** all reads/writes are local, so no network dependency for core function (Req 9.4).

## Testing Strategy
- **Unit (Vitest):** validation rules (amount/type/category/date), duplicate-category detection, and the derived selectors (`monthlySummary`, `spendingByCategory`, filtering AND logic).
- **Component (React Testing Library):** TransactionForm add/edit + validation messages; list ordering and empty states; filter combinations; delete confirmation flow.
- **Repository:** CRUD round-trip and corrupt-read fallback using a fake-indexeddb environment.
- **PWA manual checks:** build + serve; verify manifest is valid, icons resolve, install to iOS home screen, launch full-screen (no Safari bar), and confirm offline load after first visit.

*(Per project guidance, tests are written only if you ask for them — this section documents the intended approach.)*

## Assumptions
- Single user, single device; no data sync or export in this version (could be added later).
- Currency is display-only (single locale/currency, no conversion) for the initial build.
- Amounts are stored as positive numbers; `type` conveys income vs expense.
- Requirement 8 (balance trend) is deferred; the monthly-aggregation selector leaves room to add it without a data-model change.
