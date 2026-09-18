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


---

# Implementation Plan — Expansion (Budggt-inspired)

Phases are implemented **one at a time, in this order**, and reviewed before moving on. Each phase leaves the app working. Requirement references point to the expansion requirements (12–22).

## Phase 1 — Localization (Bahasa Indonesia), IDR currency & new bottom nav

- [ ] 1. Create `src/lib/i18n.js` with a flat Bahasa Indonesia string table and a `t` accessor; no hard-coded English in views.
- [ ] 2. Update `src/lib/format.js` to format Rupiah (`Rp1.250.000`, no decimals) and signed Rupiah for negatives; update amount parsing to whole-rupiah integers.
- [ ] 3. Update `src/lib/dates.js` for Indonesian date labels and add `isToday`/`isYesterday` helpers.
- [ ] 4. Translate all existing screens (dashboard, transactions, form, category manager, modals, empty states, validation) to use `i18n` strings.
- [ ] 5. Redesign the bottom navigation: 4 tabs (Beranda, Dompet, Transaksi, Lainnya) + elevated lime central "+" FAB; add `--accent-lime`, safe-area handling, active-tab styling; expand the router in `main.js`.
- [ ] 6. Add a **placeholder** Beranda view (basic totals only) and a Lainnya hub (links wired as sections land). The full Dashboard is built later in Phase 9.
  - _Requirements: 12.1–12.6, 13.1–13.6, 22.1_

## Phase 2 — Dompet (wallets / accounts)

- [ ] 7. IndexedDB v2 upgrade: add `wallets` store + new-store scaffolding; migration seeds a default "Tunai" cash wallet and assigns legacy transactions to it.
  - [ ] 7.1 Add wallet CRUD to `src/data/db.js`.
  - [ ] 7.2 Implement migration + safe fallbacks (Req 21).
- [ ] 8. Store: wallet state, mutations, and derived selectors `walletSaldo`, `totalSaldo`, `walletsWithSaldo` (saldo derived from initial balance + transactions).
- [ ] 9. `src/views/wallets.js` (Dompet): list wallets with type + derived saldo, total-saldo card, add/edit/delete with confirmation; credit-card balances shown as amount owed / negative.
- [ ] 10. Add a wallet selector to the transaction form; show wallet on transaction rows; keep saldo consistent on add/edit/delete.
- [ ] 11. Surface total saldo on Beranda.
  - _Requirements: 14.1–14.8, 21.1–21.4, 22.1_

## Phase 3 — Transaksi enhancements (filters, search, grouping)

- [ ] 12. Store: `selectTransactionsAdvanced({from,to,walletId,categoryId,type,search})` + `groupByDate` (Hari Ini / Kemarin / dates).
- [ ] 13. Transaksi view: filter sheet (date range, wallet, category, type) + clear.
- [ ] 14. Transaksi view: search bar over notes/description (case-insensitive), combined with filters.
- [ ] 15. Transaksi view: render grouped-by-date sections with Indonesian headings; row shows category, wallet, colored amount, note; empty state.
  - _Requirements: 15.1–15.8_

## Phase 4 — Atur Budget

- [ ] 16. IDB: `budget` store (singleton) + `budgetGroup` on categories; CRUD in `db.js`.
- [ ] 17. Store selectors: `categoryBudget`, `budgetProgress` (spent vs limit, over-budget), `groupBudget`; percentage→category via even split within group.
- [ ] 18. `src/views/budget.js`: expected monthly income input; method toggle (percentage / fixed).
- [ ] 19. Percentage mode: three sliders (Kebutuhan/Keinginan/Tabungan) with live total and 100% guard blocking save otherwise.
- [ ] 20. Category→group assignment UI (in budget view and/or category manager).
- [ ] 21. Fixed mode: per-category Rupiah budget inputs.
- [ ] 22. Per-category progress bars (spent vs limit) with over-budget indication; link from Lainnya.
  - _Requirements: 16.1–16.10_

## Phase 5 — Aset (assets / net worth)

- [ ] 23. IDB: `assets` store + CRUD.
- [ ] 24. Store selectors: `netWorth`, `assetsBreakdown` (Dompet&Akun / Likuid / Tetap), `avgMonthlyExpense`, `runwayMonths` (N/A when expenses are 0).
- [ ] 25. `src/views/assets.js`: net-worth header, three-total breakdown, Total Runway, manual asset add/edit/delete (Aset Likuid / Aset Tetap); link from Lainnya.
  - _Requirements: 17.1–17.6_

## Phase 6 — Utang (debt tracking)

- [ ] 26. IDB: `debts` store + CRUD.
- [ ] 27. Store selectors: `debtRemaining`, `totalDebt`.
- [ ] 28. `src/views/debts.js`: add/edit/delete debt (name, total, paid, optional due date); per-debt remaining, overall total, overdue indicator; link from Lainnya.
  - _Requirements: 18.1–18.6_

## Phase 7 — Investasi (investments)

- [ ] 29. IDB: `investments` store + CRUD.
- [ ] 30. Store selectors: `investmentGainLoss`, `investTotals` (invested, current, gain, gain%).
- [ ] 31. `src/views/investments.js`: add/edit/delete holding (name, type, invested, current value); per-item and total gain/loss (abs + %, colored); link from Lainnya.
  - _Requirements: 19.1–19.5_

## Phase 8 — Laporan (reports)

- [ ] 32. Store selectors: `monthlyReport`, `previousMonthComparison` (% change, N/A when prior 0), `topExpenses`.
- [ ] 33. Extend `src/views/chart.js` with a progress/bar primitive (also used by budget) and comparison indicator.
- [ ] 34. `src/views/laporan.js`: month selector; income / expenses / net savings; % vs last month; spending-by-category chart; Top Pengeluaran list; link from Lainnya.
  - _Requirements: 20.1–20.6_

## Phase 9 — Dashboard / Beranda (built LAST, aggregates prior phases)

> Implemented after Budget, Transaksi, Dompet, and Aset exist, so it only summarizes data that is already there.

- [ ] 38. Dashboard selectors in the store: `greeting(now)`, `dailyBudgetRemaining()`, `dailyNetSpend(month)` (day → net spend), `recentTransactions(n)`; reuse existing `previousMonthComparison`, `topExpenses`, `selectMonthlySummary`, `totalSaldo`.
- [ ] 39. Replace the placeholder Beranda with the full Dashboard in `src/views/beranda.js`:
  - [ ] 39.1 Time-of-day greeting + total saldo header.
  - [ ] 39.2 "At a glance" card: today's remaining daily budget (with N/A fallback).
  - [ ] 39.3 Quick totals: month income vs expenses + progress bar.
  - [ ] 39.4 Monthly calendar heatmap of daily net spend.
  - [ ] 39.5 Recent transactions (last 5–10) linking into Transaksi.
  - [ ] 39.6 Period comparison stats (income & expenses, "+X% vs bulan lalu").
  - [ ] 39.7 "Pengeluaran Terbesar" top expenses, tagged by budget group.
  - [ ] 39.8 Quick-access menu to Atur Budget, Aset, Utang, Investasi, Laporan.
- [ ] 40. Ensure the Dashboard re-renders on any relevant data change.
  - _Requirements: 22.1–22.11_

## Cross-cutting (each phase)

- [ ] 35. Add every new module path to the service-worker `APP_SHELL` precache list in `sw.js`.
- [ ] 36. Verify per phase: JS syntax check, selector logic checks (Node), local serve smoke test; keep the app installable/offline.
- [ ] 37. Commit each completed phase and push (PR per phase or per user preference).
  - _Requirements: 9.x, 10.x, 21.x_
