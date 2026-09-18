# Personal Finance Tracker (PWA)

A private, offline personal finance tracker. Add income/expense transactions,
categorize them, filter by month and category, and see a monthly dashboard with
a spending-by-category chart. All data is stored **locally on your device**
(IndexedDB) — no accounts, no server, no network required.

Built as an installable **Progressive Web App** with a black theme, mobile-first
UI, and full iOS "Add to Home Screen" support.

## Features

- Add / edit / delete transactions (amount, income or expense, category, date, optional note)
- Transaction list, most recent first, with month + category filters
- Default categories (Food, Transport, Rent, Bills, Shopping, Entertainment, Income, Other) plus your own custom categories
- Monthly dashboard: total income, total expenses, net balance, and a spending-by-category donut chart
- Works offline; installable to your iPhone home screen and runs full-screen

## Tech

Vanilla JavaScript (ES modules), HTML, and CSS — **no build step and no
dependencies**. Storage uses the browser's IndexedDB directly. The chart is
inline SVG. PWA behavior comes from a hand-written `manifest.json` and
`sw.js` service worker.

> Note: the original plan used React + Vite + Recharts, but the build
> environment had no access to the npm registry, so the app was implemented
> with zero dependencies. It meets all the same requirements. See
> `.kiro/specs/finance-tracker/` for the full requirements, design, and tasks.

## Running it locally

Because it uses ES modules and a service worker, open it over **HTTP** (not the
`file://` protocol). Any static file server works. A tiny zero-dependency one is
included:

```bash
node server.mjs 8080
# then open http://localhost:8080
```

Or use any static server you like, e.g. `python3 -m http.server 8080`.

## Installing on your iPhone

1. Serve the app somewhere your phone can reach it over HTTPS (required for
   service workers), or deploy it to any static host (GitHub Pages, Netlify,
   Vercel, Cloudflare Pages, etc.).
2. Open the URL in **Safari** on your iPhone.
3. Tap the **Share** button → **Add to Home Screen**.
4. Launch it from the home screen — it opens full-screen with no Safari bar and
   works offline after the first load.

## Project structure

```
index.html            App shell + iOS/PWA meta tags
manifest.json         Web app manifest (name, icons, colors, standalone)
sw.js                 Service worker (precache app shell, offline support)
server.mjs            Optional local static server (Node stdlib only)
icons/                App icons (192, 512, 512-maskable, apple-touch 180) + favicon
src/
  main.js             Entry: shell, nav, FAB, SW registration
  styles.css          Black theme, mobile-first, safe-area aware
  types.js            JSDoc type definitions
  data/db.js          IndexedDB repository (CRUD, seeding, safe fallbacks)
  lib/                dates.js, validation.js, dom.js, format.js
  state/store.js      In-memory store + selectors + write-through persistence
  views/              dashboard, transactions, transactionForm, categoryManager,
                      chart, monthSelect, modal
```

## Notes

- Currency is inferred from your browser locale (falls back to USD) and is
  display-only.
- The balance-trend line chart is intentionally out of scope for this version
  (see the spec).
