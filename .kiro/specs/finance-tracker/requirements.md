# Requirements — Personal Finance Tracker (PWA)

## Introduction

A single-user personal finance tracker built as an installable Progressive Web App (PWA), inspired by the "Budggt" app. It lets the user record income and expense transactions across multiple **wallets/accounts (Dompet)**, categorize them, review them in a richly filterable/searchable list, plan spending with a **budget (Atur Budget)**, and track **assets/net worth (Aset)**, **debts (Utang)**, and **investments (Investasi)**, with monthly **reports (Laporan)**. All data lives locally on the user's device (no accounts, no backend) and persists between sessions. The app is mobile-first and installable to the iOS home screen via Safari's "Add to Home Screen", running full-screen without the browser chrome and loading reliably offline.

### Localization & Currency (applies to the whole app)

- **Language:** The entire user interface SHALL be in **Bahasa Indonesia**. All labels, buttons, headings, empty states, validation messages, and navigation SHALL use Indonesian text.
- **Currency:** All monetary values SHALL be displayed in **Indonesian Rupiah**, formatted with the `Rp` symbol and Indonesian digit grouping (e.g. `Rp1.250.000`). Rupiah is conventionally shown without decimal places; amounts SHALL default to whole-rupiah display.
- Key vocabulary used across requirements: **Dompet** (wallets/accounts), **Saldo** (balance), **Transaksi** (transactions), **Atur Budget** (budget setup), **Kebutuhan** (needs), **Keinginan** (wants), **Tabungan** (savings), **Aset** (assets), **Utang** (debt), **Investasi** (investments), **Laporan** (reports).

### Implementation Order

Features SHALL be implemented in this order (one phase at a time, reviewed before moving on): (1) Localization + IDR + new bottom navigation, (2) Dompet, (3) Transaksi enhancements, (4) Atur Budget, (5) Aset, (6) Utang, (7) Investasi, (8) Laporan.

## Requirements

### Requirement 1 — Add a transaction

**User Story:** As a user, I want to add a transaction with its details, so that I can keep a record of my income and expenses.

#### Acceptance Criteria
1. WHEN the user opens the "add transaction" form THEN the system SHALL provide inputs for amount, type (income or expense), category, date, and an optional note.
2. WHEN the user submits the form THEN the system SHALL require amount to be a positive number, type to be either income or expense, category to be selected, and date to be a valid date.
3. IF a required field is missing or invalid THEN the system SHALL block submission AND display a clear validation message identifying the field.
4. WHEN a transaction is saved THEN the system SHALL default the date to today if the user did not change it.
5. WHEN a transaction is saved THEN the system SHALL persist it to local storage AND show it in the transaction list.
6. WHEN the note field is left empty THEN the system SHALL save the transaction successfully with no note.

### Requirement 2 — Edit and delete transactions

**User Story:** As a user, I want to edit or delete a transaction, so that I can correct mistakes and remove entries I no longer want.

#### Acceptance Criteria
1. WHEN the user selects a transaction to edit THEN the system SHALL pre-fill the form with that transaction's current values.
2. WHEN the user saves an edit THEN the system SHALL apply the same validation rules as adding AND update the stored transaction in place.
3. WHEN the user deletes a transaction THEN the system SHALL ask for confirmation before removing it.
4. WHEN a delete is confirmed THEN the system SHALL remove the transaction from local storage AND from the list AND update dashboard totals.

### Requirement 3 — Transaction list view

**User Story:** As a user, I want to see all my transactions in a list, so that I can review my activity.

#### Acceptance Criteria
1. WHEN the user views the list THEN the system SHALL display transactions ordered by date, most recent first.
2. WHEN displaying each transaction THEN the system SHALL show amount, type, category, date, and note (if present).
3. WHEN displaying amounts THEN the system SHALL visually distinguish income from expenses (e.g., color and/or sign).
4. IF there are no transactions (or none match the active filters) THEN the system SHALL display an empty-state message.

### Requirement 4 — Filter transactions

**User Story:** As a user, I want to filter transactions by month and category, so that I can focus on a specific period or spending area.

#### Acceptance Criteria
1. WHEN the user selects a month THEN the system SHALL show only transactions within that month.
2. WHEN the user selects a category THEN the system SHALL show only transactions in that category.
3. WHEN both a month and a category filter are active THEN the system SHALL apply both together (logical AND).
4. WHEN the user clears the filters THEN the system SHALL show all transactions again.

### Requirement 5 — Categories with defaults and custom entries

**User Story:** As a user, I want default categories plus the ability to add my own, so that I can classify transactions the way I think about them.

#### Acceptance Criteria
1. WHEN the app is first used THEN the system SHALL provide default categories: Food, Transport, Rent, Bills, Shopping, Entertainment, Income, and Other.
2. WHEN the user adds a custom category THEN the system SHALL persist it AND make it available for selection on transactions.
3. IF the user adds a category name that already exists (case-insensitive) THEN the system SHALL reject the duplicate AND inform the user.
4. WHEN a category is displayed for selection THEN the system SHALL include both default and custom categories.
5. WHEN the user attempts to delete a custom category that is in use THEN the system SHALL warn the user and require confirmation, AND SHALL NOT allow deletion of default categories.

### Requirement 6 — Monthly dashboard summary

**User Story:** As a user, I want to see totals for the selected month, so that I understand my financial position at a glance.

#### Acceptance Criteria
1. WHEN the user views the dashboard for a selected month THEN the system SHALL show total income, total expenses, and net balance (income minus expenses) for that month.
2. WHEN transactions for the month change THEN the system SHALL recompute and update the totals.
3. WHEN net balance is negative THEN the system SHALL visually indicate this (e.g., color).
4. WHEN no transactions exist for the selected month THEN the system SHALL display zero totals rather than an error.

### Requirement 7 — Spending-by-category chart

**User Story:** As a user, I want a chart of spending by category, so that I can see where my money goes.

#### Acceptance Criteria
1. WHEN the user views the dashboard for a selected month THEN the system SHALL display a pie or bar chart of expenses grouped by category.
2. WHEN a category has no expenses in the month THEN the system SHALL omit it from the chart.
3. WHEN there are no expenses in the month THEN the system SHALL show an empty-state message in place of the chart.
4. WHEN the underlying transactions change THEN the system SHALL update the chart.

### Requirement 8 — Balance trend chart (deferred — out of scope)

**User Story:** As a user, I want a line chart of my balance over recent months, so that I can see my trend over time.

**Status:** Deferred by user decision. This is intentionally **out of scope** for the initial build. It is recorded here so the data model and dashboard layout can leave room for it later, but no implementation task will be created for it.

#### Future Acceptance Criteria (not to be implemented now)
1. WHEN the user views the dashboard THEN the system SHOULD display a line chart of net balance over the last several months (e.g., last 6).
2. WHEN a month in the range has no transactions THEN the system SHALL treat that month's net as zero.

### Requirement 9 — Local persistence, no accounts

**User Story:** As a user, I want my data stored locally with no login, so that the app is private and works on my own device without setup.

#### Acceptance Criteria
1. WHEN the app stores data THEN the system SHALL use local device storage (browser local storage or a local database such as IndexedDB) with no server or account.
2. WHEN the user reloads or reopens the app THEN the system SHALL restore all previously saved transactions and categories.
3. IF stored data is missing or corrupted THEN the system SHALL fall back to a valid empty/default state without crashing.
4. The system SHALL NOT require any network connection to read or write the user's data.

### Requirement 10 — Installable PWA (iOS home screen)

**User Story:** As a user, I want to install the app to my iPhone home screen, so that it behaves like a native app and launches full-screen.

#### Acceptance Criteria
1. WHEN the app is served THEN the system SHALL include a web app manifest (manifest.json) declaring app name, icons, theme color, background color, `display: standalone`, and start URL.
2. WHEN the app is loaded in Safari THEN the system SHALL include iOS-specific meta tags: `apple-touch-icon`, `apple-mobile-web-app-capable`, and an `apple-mobile-web-app-status-bar-style`, plus an appropriate `theme-color` meta tag.
3. WHEN the user adds the app to the home screen and launches it THEN the system SHALL display full-screen without Safari's address bar or navigation chrome.
4. WHEN the app is opened after being installed THEN the system SHALL load successfully offline via a service worker that caches the app shell and required assets.
5. WHEN the app registers a service worker THEN the system SHALL do so without blocking first render AND SHALL handle registration failure gracefully.
6. The manifest SHALL reference icons in the sizes required for iOS home-screen display (at least 180×180) and standard PWA sizes (192×192 and 512×512).

### Requirement 11 — Mobile-first, clean UI

**User Story:** As a user, I want a clean, simple, mobile-friendly interface, so that the app is pleasant to use primarily on my phone.

#### Acceptance Criteria
1. WHEN the app is viewed on a mobile viewport THEN the system SHALL present a responsive layout with touch-friendly controls (adequate tap-target sizes).
2. WHEN the app is viewed on larger screens THEN the system SHALL remain usable without broken layout.
3. WHEN primary actions (add transaction, switch month, open dashboard/list) are needed THEN the system SHALL make them reachable within easy thumb reach on mobile.
4. WHEN content exceeds the viewport THEN the system SHALL scroll cleanly without layout shift of fixed controls.


---

## Expansion Requirements (Budggt-inspired)

> The following requirements extend the existing app. Where they modify prior behavior, the newer requirement takes precedence. Existing transactions/categories data SHALL be migrated forward without loss (see Requirement 20).

### Requirement 12 — Localization (Bahasa Indonesia) & IDR currency

**User Story:** As an Indonesian user, I want the whole app in Bahasa Indonesia with Rupiah formatting, so that it feels native to me.

#### Acceptance Criteria
1. WHEN any screen renders THEN the system SHALL display all UI text in Bahasa Indonesia.
2. WHEN any monetary value is displayed THEN the system SHALL format it as Rupiah using the `Rp` prefix and Indonesian thousands separators (`.`), with no decimal places by default (e.g. `Rp1.250.000`).
3. WHEN a negative monetary value is shown (e.g. credit-card debt or a loss) THEN the system SHALL indicate the sign clearly (e.g. `-Rp500.000`) and may use color.
4. WHEN the user enters an amount THEN the system SHALL accept plain digits and SHALL treat the value as whole Rupiah.
5. WHEN dates are displayed THEN the system SHALL use Indonesian date formatting (e.g. `18 Sep 2026`, Indonesian month/day names where applicable).
6. All UI strings SHALL be sourced from a single localization module so wording stays consistent and maintainable.

### Requirement 13 — New bottom navigation

**User Story:** As a user, I want a modern bottom navigation with a prominent central add button, so that I can move between the main sections quickly with my thumb.

#### Acceptance Criteria
1. WHEN the app renders THEN the system SHALL present a fixed bottom navigation bar with a prominent, elevated, circular central "+" (tambah) action button that overlaps the bar, following the format of the provided reference image (two nav entries on each side of a raised circular center button). The exact accent color is not fixed to lime; it SHALL suit the app's black theme.
2. WHEN the bottom navigation renders THEN the system SHALL provide **exactly 5 tab entries**, ordered left-to-right as: **(1) Beranda** (Dashboard, the first/default tab), **(2) Dompet**, **(3) center "+"**, **(4) Transaksi**, **(5) Lainnya** (More). That is two tabs left of the center button (Beranda, Dompet) and two tabs right of it (Transaksi, Lainnya).
3. WHEN the user taps the central "+" button THEN the system SHALL open the add-transaction flow.
4. WHEN a navigation entry is active THEN the system SHALL visually indicate the active section.
5. WHEN the bottom navigation is displayed THEN it SHALL respect iOS safe-area insets and keep tap targets ≥ 44px.
6. WHEN the app has more destinations than the 5 tabs (Atur Budget, Aset, Utang, Investasi, Laporan, Kategori) THEN the system SHALL group those secondary sections under the **Lainnya** tab, AND those sections SHALL also be reachable from the Dashboard's quick-access menu (Req 22.9).

### Requirement 14 — Dompet (wallets / accounts)

**User Story:** As a user, I want multiple wallets/accounts, so that I can track where my money actually is.

#### Acceptance Criteria
1. WHEN the user adds a wallet THEN the system SHALL capture a name, a type (one of: `bank`, `e-wallet`, `cash`/tunai, `credit card`/kartu kredit), and an initial balance (saldo).
2. WHEN the user views the Dompet section THEN the system SHALL list all wallets with their current saldo and type.
3. WHEN the user views a summary THEN the system SHALL display the **total saldo across all wallets**.
4. WHEN computing total saldo THEN the system SHALL add non-credit balances and SHALL subtract amounts owed on credit-card wallets (credit cards MAY hold a negative balance representing debt).
5. WHEN a wallet is of type credit card THEN the system SHALL allow its balance to be negative AND SHALL display it distinctly (e.g. amount owed).
6. WHEN the user edits or deletes a wallet THEN the system SHALL confirm destructive actions AND SHALL handle transactions linked to a deleted wallet gracefully (see 15.x and 20.x).
7. WHEN the user adds or edits a transaction THEN the system SHALL let the user choose the wallet the money came from (expense) or went into (income); a transfer between wallets is out of scope for this phase unless separately specified.
8. WHEN a transaction is created/edited/deleted against a wallet THEN the system SHALL keep that wallet's saldo consistent (income increases saldo, expense decreases saldo).

### Requirement 15 — Transaksi enhancements (filters, search, grouping)

**User Story:** As a user, I want powerful filtering, search, and date grouping on my transactions, so that I can find and understand my activity.

#### Acceptance Criteria
1. WHEN the user opens filters THEN the system SHALL allow filtering by: date range (from/to), wallet/account, category, and type (income/expense).
2. WHEN multiple filters are active THEN the system SHALL apply them together (logical AND).
3. WHEN the user types in the search bar THEN the system SHALL filter transactions whose note/description matches the query (case-insensitive substring).
4. WHEN search and filters are both active THEN the system SHALL apply search in addition to the filters.
5. WHEN the transaction list renders THEN the system SHALL group transactions by date with human headings: **Hari Ini** (Today), **Kemarin** (Yesterday), then specific dates (e.g. `16 Sep 2026`), each group ordered most-recent-first.
6. WHEN a transaction row renders THEN the system SHALL show its category, wallet, amount (colored by type), and note if present.
7. WHEN the user clears filters/search THEN the system SHALL restore the full grouped list.
8. WHEN no transactions match THEN the system SHALL show an Indonesian empty-state message.

### Requirement 16 — Atur Budget (budget setup)

**User Story:** As a user, I want to plan a monthly budget using either percentages or fixed amounts, so that I can control my spending.

#### Acceptance Criteria
1. WHEN the user opens Atur Budget THEN the system SHALL let the user set an **expected monthly income** (pemasukan bulanan) in Rupiah.
2. WHEN the user chooses a budgeting method THEN the system SHALL offer two methods: **percentage-based** (persentase) and **fixed monthly** (nominal tetap per kategori).
3. WHEN percentage-based is selected THEN the system SHALL provide a 50/30/20-style split across three groups — **Kebutuhan** (Needs), **Keinginan** (Wants), **Tabungan** (Savings) — each adjustable via a slider, and the three percentages MUST total exactly 100%.
4. IF the three group percentages do not total 100% THEN the system SHALL prevent saving AND indicate the discrepancy.
5. WHEN percentage-based is active THEN the system SHALL compute each group's Rupiah budget as its percentage × expected monthly income.
6. WHEN the user assigns categories THEN the system SHALL let each spending category be assigned to exactly one of the three groups (Kebutuhan/Keinginan/Tabungan).
7. WHEN percentage-based is active THEN the system SHALL derive a per-category budget by distributing each group's Rupiah budget across the categories assigned to it (e.g. evenly, or by a stored weight — the exact distribution rule SHALL be defined in design).
8. WHEN fixed-monthly is selected THEN the system SHALL let the user set an explicit Rupiah budget amount per category.
9. WHEN viewing the budget THEN the system SHALL show a **progress bar per category**: amount spent this month vs. its budget limit, including an over-budget indication when spent exceeds the limit.
10. WHEN budget settings change THEN the system SHALL persist them AND recompute progress from the current month's transactions.

### Requirement 17 — Aset (assets / net worth)

**User Story:** As a user, I want to see my net worth and runway, so that I understand my overall financial health.

#### Acceptance Criteria
1. WHEN the user views Aset THEN the system SHALL display an estimated **total net worth (kekayaan bersih)** = sum of all wallet saldo + other manually-added assets (minus credit-card amounts owed, consistent with 14.4).
2. WHEN the user adds a manual asset THEN the system SHALL capture a name, a class (one of: **Aset Likuid** / liquid, **Aset Tetap** / fixed), and a current value in Rupiah.
3. WHEN the user views Aset THEN the system SHALL show a breakdown of three totals: **Dompet & Akun** (wallets total), **Aset Likuid** (liquid assets total), and **Aset Tetap** (fixed assets total).
4. WHEN the user views Aset THEN the system SHALL display **Total Runway**: an estimate of how many months current assets would cover average monthly expenses, computed as (liquid net worth ÷ average monthly expense), where the averaging window and which assets count SHALL be defined in design.
5. IF average monthly expenses are zero or unknown THEN the system SHALL display Runway as not-applicable rather than dividing by zero.
6. WHEN the user edits or deletes a manual asset THEN the system SHALL persist the change AND recompute net worth and the breakdown.

### Requirement 18 — Utang (debt tracking)

**User Story:** As a user, I want to track debts I owe, so that I know my remaining obligations.

#### Acceptance Criteria
1. WHEN the user adds a debt THEN the system SHALL capture a name, a total amount owed, an amount paid so far, and an optional due date (jatuh tempo).
2. WHEN a debt is displayed THEN the system SHALL show its **remaining balance** = total − paid (never below zero for display purposes).
3. WHEN the user views Utang THEN the system SHALL show the **overall total remaining debt** across all debts.
4. WHEN a due date is set THEN the system SHALL display it in Indonesian date format AND MAY indicate overdue debts.
5. WHEN the user updates the amount paid THEN the system SHALL recompute remaining balances and the overall total.
6. WHEN the user edits or deletes a debt THEN the system SHALL confirm destructive actions and persist changes.

### Requirement 19 — Investasi (investments)

**User Story:** As a user, I want to record investment holdings and see gains/losses, so that I can monitor performance.

#### Acceptance Criteria
1. WHEN the user adds an investment THEN the system SHALL capture a name, a type (e.g. **saham**/stocks, **reksadana**/mutual funds, **kripto**/crypto, and other), an amount invested (modal), and a current value (nilai sekarang) in Rupiah.
2. WHEN the user views Investasi THEN the system SHALL show the **total current value** of all investments.
3. WHEN the user views Investasi THEN the system SHALL show **overall gain/loss** = total current value − total invested, both as an absolute Rupiah amount and as a percentage, colored to indicate gain vs. loss.
4. WHEN an individual investment is displayed THEN the system SHALL show its invested amount, current value, and its own gain/loss.
5. WHEN the user edits or deletes an investment THEN the system SHALL persist the change AND recompute totals.

### Requirement 20 — Laporan (reports)

**User Story:** As a user, I want monthly reports with comparisons and highlights, so that I can review my financial trends.

#### Acceptance Criteria
1. WHEN the user views Laporan for a selected month THEN the system SHALL show total income (pemasukan), total expenses (pengeluaran), and **net savings** (tabungan bersih = income − expenses).
2. WHEN a previous comparable period exists THEN the system SHALL show a **comparison to the previous month** as a percentage change (e.g. `+12% vs bulan lalu`) for key figures, with sign and color.
3. IF there is no previous-period data (or it is zero) THEN the system SHALL show the comparison as not-applicable rather than dividing by zero.
4. WHEN the user views Laporan THEN the system SHALL show a **spending breakdown by category** as a chart (reusing/extending the existing spending chart).
5. WHEN the user views Laporan THEN the system SHALL show a **Top Pengeluaran** (top expenses) list for the period, ordered by amount descending.
6. WHEN the underlying data changes THEN the system SHALL recompute the report.

### Requirement 21 — Data model migration & persistence (expansion)

**User Story:** As an existing user, I want my current data preserved as new features arrive, so that upgrading is seamless.

#### Acceptance Criteria
1. WHEN the app upgrades its local database schema THEN the system SHALL migrate existing transactions and categories without data loss.
2. WHEN existing transactions have no wallet assigned THEN the system SHALL either assign them to a default wallet (e.g. a seeded "Tunai"/cash wallet) or clearly represent them as unassigned, as defined in design, without breaking totals.
3. WHEN new stores are introduced (wallets, budget, assets, debts, investments) THEN the system SHALL create them via versioned IndexedDB upgrades and SHALL apply the same corrupt/missing-data fallbacks as existing stores (per Requirement 9.3).
4. WHEN any new entity changes THEN the system SHALL persist it locally and restore it on reload, with no network dependency (consistent with Requirement 9).

### Requirement 22 — Dashboard / Beranda (home screen overview)

**User Story:** As a user, I want a rich home screen that summarizes everything, so that I get an at-a-glance overview the moment I open the app.

**Status:** Implemented **last**, because it aggregates data from Budget (Req 16), Transaksi (Req 15), Dompet (Req 14), and Aset (Req 17). Those features are built first, then the Dashboard is wired to summarize them.

#### Acceptance Criteria
1. WHEN the user opens the app THEN the system SHALL show a Dashboard (Beranda) as the default screen.
2. WHEN the Dashboard renders THEN the system SHALL show a **personalized greeting** that varies by time of day (e.g. "Selamat pagi" / "Selamat siang" / "Selamat sore" / "Selamat malam").
3. WHEN a monthly budget is configured THEN the system SHALL show an **"at a glance" card** with **today's remaining daily budget**, derived from remaining monthly budget ÷ remaining days in the month.
   - The concrete formula SHALL be defined in design; IF no budget is set or remaining days is zero THEN the system SHALL show a sensible fallback (e.g. not-applicable) rather than an error or divide-by-zero.
4. WHEN the Dashboard renders THEN the system SHALL show **quick totals** for the current month: total income vs. total expenses, with a **progress bar** (e.g. expenses relative to income or to budget).
5. WHEN the Dashboard renders THEN the system SHALL show a **monthly calendar heatmap** where each day cell reflects that day's **net spend**, so high-spending days stand out visually; days with no activity SHALL be visually neutral.
6. WHEN the Dashboard renders THEN the system SHALL show a **recent transactions list** (last 5–10), most recent first, each linking into Transaksi.
7. WHEN a previous period exists THEN the system SHALL show **period comparison stats** ("+X% vs bulan lalu") for **income and expenses**, with sign and color; IF prior data is zero/absent THEN show not-applicable (no divide-by-zero).
8. WHEN the Dashboard renders THEN the system SHALL show a **"Pengeluaran Terbesar" (biggest expenses)** section listing top spending items for the period, each **tagged by its budget group** (Kebutuhan / Keinginan / Tabungan) when the category is assigned to one.
9. WHEN the Dashboard renders THEN the system SHALL provide a **quick-access menu** to jump to: Atur Budget, Aset, Utang, Investasi, and Laporan.
10. WHEN any underlying data changes (transactions, budget, wallets, assets) THEN the system SHALL keep the Dashboard in sync.
11. WHEN the Dashboard renders THEN it SHALL also show total saldo across wallets (Req 14.3) and MAY surface net worth (Req 17) and total debt (Req 18) as space allows.
