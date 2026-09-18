# Implementation Plan — Personal Finance Tracker (PWA)

Tasks are ordered so the app is runnable early and grows incrementally. Each task references the requirements it satisfies. Requirement 8 (balance trend) is deferred and has no task.

- [ ] 1. Scaffold the project
  - Create a Vite + React + TypeScript app in the workspace.
  - Add dependencies: `idb`, `recharts`, `vite-plugin-pwa` (dev), and testing deps only if tests are requested.
  - Verify dev server and production build run cleanly.
  - _Requirements: 11.2_

- [ ] 2. Define types and the data model
  - Add `src/types.ts` with `Transaction`, `Category`, `TxType`, and derived `MonthlySummary` / `CategorySpend`.
  - _Requirements: 1.1, 5.1_

- [ ] 3. Build the IndexedDB repository
  - [ ] 3.1 Create `src/data/db.ts` opening DB `finance-tracker` v1 with `transactions` (index `by-date`) and `categories` (index `by-name`) stores.
  - [ ] 3.2 Implement transaction CRUD and category add/delete/getAll.
  - [ ] 3.3 Implement `seedDefaultCategoriesIfEmpty()` with the 8 defaults marked `isDefault`.
  - [ ] 3.4 Wrap reads with safe fallback to empty/defaults on missing or corrupt data.
  - _Requirements: 5.1, 9.1, 9.2, 9.3, 9.4_

- [ ] 4. Validation and helpers
  - Add `src/lib/validation.ts`: `validateTransaction` (positive amount, valid type, category selected, valid date) and case-insensitive category duplicate/normalize helpers.
  - Add date helpers (today's ISO date, month key `YYYY-MM`).
  - _Requirements: 1.2, 1.3, 2.2, 5.3_

- [ ] 5. State layer (store + hooks)
  - [ ] 5.1 Create `StoreProvider` that loads categories/transactions on init (seeding defaults) and holds `selectedMonth` (default = current month).
  - [ ] 5.2 Implement mutations that update in-memory state and write through to the repository, with a non-blocking error path.
  - [ ] 5.3 Implement memoized selectors: `filteredTransactions(month, category)` (combinable AND + clear), `transactionsForMonth`, `monthlySummary`, `spendingByCategory` (expenses only, omit zero totals).
  - _Requirements: 2.4, 4.1, 4.2, 4.3, 4.4, 6.1, 6.2, 7.2, 9.2_

- [ ] 6. App shell, navigation, and base styles
  - Set up mobile-first layout: sticky bottom nav (Dashboard / Transactions), floating "+" add button, safe-area padding, CSS variables.
  - Ensure tap targets ≥ 44px and fixed controls don't shift on scroll.
  - _Requirements: 11.1, 11.2, 11.3, 11.4_

- [ ] 7. Transaction form (add/edit)
  - Build `TransactionForm` with amount, type, category, date (defaults to today), optional note.
  - Show inline field-level validation messages; block invalid submits; reuse for edit (pre-filled).
  - Wire submit to store add/edit mutations.
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 2.1, 2.2_

- [ ] 8. Transactions list + filters
  - [ ] 8.1 Render list sorted by date desc then createdAt desc; show amount/type/category/date/note; distinguish income vs expense; empty state.
  - [ ] 8.2 Add filter bar (month + category, combinable, clear) driving `filteredTransactions`.
  - [ ] 8.3 Row actions: edit (opens form) and delete via reusable `ConfirmDialog`; delete updates list, storage, and dashboard.
  - _Requirements: 2.3, 2.4, 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3, 4.4_

- [ ] 9. Category manager
  - List categories; add custom (reject case-insensitive duplicates with a message); delete custom only with confirmation when in use; defaults not deletable; new categories immediately selectable in the form.
  - _Requirements: 5.2, 5.3, 5.4, 5.5_

- [ ] 10. Dashboard summary
  - Month selector; three cards for total income, total expenses, net balance; net colored when negative; zero totals (not error) when month is empty; recompute on data change.
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [ ] 11. Spending-by-category chart
  - `SpendingChart` (Recharts pie/bar) from `spendingByCategory`; omit zero categories; empty-state message when no expenses; updates on data change.
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [ ] 12. PWA: manifest, icons, iOS meta
  - [ ] 12.1 Configure `vite-plugin-pwa` manifest (name, short_name, start_url, scope, `display: standalone`, theme/background colors, icons 192/512 + maskable).
  - [ ] 12.2 Add icon assets: `apple-touch-icon-180.png` (180×180), `icon-192.png`, `icon-512.png`, maskable 512.
  - [ ] 12.3 Add iOS meta tags to `index.html` (`apple-mobile-web-app-capable`, status-bar style, apple-touch-icon, theme-color, `viewport-fit=cover`).
  - _Requirements: 10.1, 10.2, 10.3, 10.6_

- [ ] 13. PWA: service worker & offline
  - Enable `generateSW` with `registerType: 'autoUpdate'`; precache app shell; register non-blocking with graceful failure handling; enable dev testing via `devOptions`.
  - _Requirements: 10.4, 10.5_

- [ ] 14. Build, verify, and manual PWA validation
  - Production build + local serve; confirm manifest validity and icon resolution.
  - Manually verify: install to iOS home screen, launches full-screen without Safari bar, loads offline after first visit, safe-area layout looks correct.
  - _Requirements: 10.3, 10.4, 11.4_
```
