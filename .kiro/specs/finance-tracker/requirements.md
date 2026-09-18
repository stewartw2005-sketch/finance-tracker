# Requirements — Personal Finance Tracker (PWA)

## Introduction

A single-user personal finance tracker built as an installable Progressive Web App (PWA). It lets the user record income and expense transactions, categorize them, review them in a filterable list, and see monthly summaries and spending breakdowns on a dashboard. All data lives locally on the user's device (no accounts, no backend) and persists between sessions. The app is mobile-first and installable to the iOS home screen via Safari's "Add to Home Screen", running full-screen without the browser chrome and loading reliably offline.

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
