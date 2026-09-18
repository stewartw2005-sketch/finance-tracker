// @ts-check
/**
 * Central app store (vanilla, no framework). Holds in-memory state, loads from
 * and writes through to the IndexedDB repository, and exposes selectors.
 * Components subscribe to change notifications.
 *
 * @typedef {import('../types.js').Transaction} Transaction
 * @typedef {import('../types.js').Category} Category
 * @typedef {import('../types.js').MonthlySummary} MonthlySummary
 * @typedef {import('../types.js').CategorySpend} CategorySpend
 */
import * as db from '../data/db.js';
import { currentMonth, monthOf } from '../lib/dates.js';
import { makeId } from '../lib/validation.js';
import { t } from '../lib/i18n.js';

/**
 * @typedef {Object} State
 * @property {Transaction[]} transactions
 * @property {Category[]} categories
 * @property {import('../types.js').Wallet[]} wallets
 * @property {string} selectedMonth   - 'YYYY-MM'
 * @property {string} filterCategory  - category id or '' for all
 * @property {string} lastWalletId    - last wallet used on a transaction
 * @property {boolean} loaded
 * @property {string} error           - non-blocking error message ('' if none)
 */

/** @type {State} */
const state = {
  transactions: [],
  categories: [],
  wallets: [],
  selectedMonth: currentMonth(),
  filterCategory: '',
  lastWalletId: '',
  loaded: false,
  error: '',
};

/** @type {Set<() => void>} */
const listeners = new Set();

/**
 * Subscribe to state changes. Returns an unsubscribe function.
 * @param {() => void} fn
 * @returns {() => void}
 */
export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function notify() {
  for (const fn of listeners) fn();
}

/** @returns {Readonly<State>} */
export function getState() {
  return state;
}

/**
 * Load persisted data and seed defaults. Never throws (Req 9.2, 9.3).
 * @returns {Promise<void>}
 */
export async function init() {
  try {
    const categories = await db.seedDefaultCategoriesIfEmpty();
    // Seed the default "Tunai" wallet and migrate legacy transactions, then
    // load transactions (post-migration so walletId is populated).
    const wallets = await db.seedDefaultWalletAndMigrate(t.wallet.defaultName);
    const transactions = await db.getAllTransactions();
    state.categories = categories;
    state.wallets = wallets;
    state.transactions = transactions;
    state.lastWalletId =
      (wallets.find((w) => w.id === db.DEFAULT_WALLET_ID) || wallets[0] || {}).id || '';
  } catch {
    // Fall back to defaults so the app still renders.
    state.categories = db.DEFAULT_CATEGORIES.slice();
    state.wallets = [];
    state.transactions = [];
    state.error = t.errors.loadFailed;
  } finally {
    state.loaded = true;
    notify();
  }
}

// ---- Mutations (write-through) --------------------------------------------

/**
 * @param {{amount:number, type:import('../types.js').TxType, categoryId:string, date:string, note?:string, walletId?:string}} data
 * @returns {Promise<void>}
 */
export async function addTransaction(data) {
  /** @type {Transaction} */
  const txn = {
    id: makeId(),
    amount: data.amount,
    type: data.type,
    categoryId: data.categoryId,
    date: data.date,
    note: data.note ? data.note : undefined,
    walletId: data.walletId || undefined,
    createdAt: Date.now(),
  };
  state.transactions.push(txn);
  if (txn.walletId) state.lastWalletId = txn.walletId;
  notify();
  try {
    await db.addTransaction(txn);
  } catch {
    setError(t.errors.txSaveFailed);
  }
}

/**
 * @param {string} id
 * @param {{amount:number, type:import('../types.js').TxType, categoryId:string, date:string, note?:string, walletId?:string}} data
 * @returns {Promise<void>}
 */
export async function editTransaction(id, data) {
  const idx = state.transactions.findIndex((tx) => tx.id === id);
  if (idx === -1) return;
  const existing = state.transactions[idx];
  /** @type {Transaction} */
  const updated = {
    ...existing,
    amount: data.amount,
    type: data.type,
    categoryId: data.categoryId,
    date: data.date,
    note: data.note ? data.note : undefined,
    walletId: data.walletId || existing.walletId,
  };
  state.transactions[idx] = updated;
  if (updated.walletId) state.lastWalletId = updated.walletId;
  notify();
  try {
    await db.updateTransaction(updated);
  } catch {
    setError(t.errors.txUpdateFailed);
  }
}

/**
 * @param {string} id
 * @returns {Promise<void>}
 */
export async function removeTransaction(id) {
  state.transactions = state.transactions.filter((tx) => tx.id !== id);
  notify();
  try {
    await db.deleteTransaction(id);
  } catch {
    setError(t.errors.txDeleteFailed);
  }
}

/**
 * Add a custom category. Assumes duplicate check done by caller/UI (Req 5.2).
 * @param {string} name
 * @returns {Promise<Category>}
 */
export async function addCategory(name) {
  /** @type {Category} */
  const cat = { id: makeId(), name: name.trim(), isDefault: false };
  state.categories.push(cat);
  notify();
  try {
    await db.addCategory(cat);
  } catch {
    setError(t.errors.categorySaveFailed);
  }
  return cat;
}

/**
 * Delete a custom category (default categories are protected) (Req 5.5).
 * @param {string} id
 * @returns {Promise<void>}
 */
export async function removeCategory(id) {
  const cat = state.categories.find((c) => c.id === id);
  if (!cat || cat.isDefault) return;
  state.categories = state.categories.filter((c) => c.id !== id);
  notify();
  try {
    await db.deleteCategory(id);
  } catch {
    setError(t.errors.categoryDeleteFailed);
  }
}

// ---- Wallet mutations -----------------------------------------------------

/**
 * Add a wallet (Req 14.1).
 * @param {{name:string, type:import('../types.js').WalletType, balance:number}} data
 * @returns {Promise<import('../types.js').Wallet>}
 */
export async function addWallet(data) {
  /** @type {import('../types.js').Wallet} */
  const wallet = {
    id: makeId(),
    name: data.name.trim(),
    type: data.type,
    balance: data.balance,
    createdAt: Date.now(),
  };
  state.wallets.push(wallet);
  notify();
  try {
    await db.addWallet(wallet);
  } catch {
    setError(t.errors.walletSaveFailed);
  }
  return wallet;
}

/**
 * Edit a wallet's name/type/initial balance.
 * @param {string} id
 * @param {{name:string, type:import('../types.js').WalletType, balance:number}} data
 * @returns {Promise<void>}
 */
export async function editWallet(id, data) {
  const idx = state.wallets.findIndex((w) => w.id === id);
  if (idx === -1) return;
  /** @type {import('../types.js').Wallet} */
  const updated = {
    ...state.wallets[idx],
    name: data.name.trim(),
    type: data.type,
    balance: data.balance,
  };
  state.wallets[idx] = updated;
  notify();
  try {
    await db.updateWallet(updated);
  } catch {
    setError(t.errors.walletUpdateFailed);
  }
}

/**
 * Delete a wallet. Linked transactions are reassigned to the default "Tunai"
 * wallet to preserve totals (Req 14.6, 21.2). The default wallet itself is
 * protected from deletion.
 * @param {string} id
 * @returns {Promise<void>}
 */
export async function removeWallet(id) {
  if (id === db.DEFAULT_WALLET_ID) return;
  const exists = state.wallets.some((w) => w.id === id);
  if (!exists) return;

  // Reassign linked transactions to the default wallet (fallback: first).
  const fallback =
    state.wallets.find((w) => w.id === db.DEFAULT_WALLET_ID) ||
    state.wallets.find((w) => w.id !== id);
  const fallbackId = fallback ? fallback.id : undefined;
  const affected = state.transactions.filter((tx) => tx.walletId === id);
  for (const tx of affected) {
    tx.walletId = fallbackId;
  }

  state.wallets = state.wallets.filter((w) => w.id !== id);
  notify();
  try {
    for (const tx of affected) await db.updateTransaction(tx);
    await db.deleteWallet(id);
  } catch {
    setError(t.errors.walletDeleteFailed);
  }
}

/** @param {string} month 'YYYY-MM' */
export function setSelectedMonth(month) {
  state.selectedMonth = month;
  notify();
}

/** @param {string} categoryId category id or '' for all */
export function setFilterCategory(categoryId) {
  state.filterCategory = categoryId;
  notify();
}

/** Clear all list filters (keeps selected month) (Req 4.4). */
export function clearFilters() {
  state.filterCategory = '';
  notify();
}

/** @param {string} msg */
export function setError(msg) {
  state.error = msg;
  notify();
}

export function clearError() {
  state.error = '';
  notify();
}

// ---- Selectors ------------------------------------------------------------

/**
 * Transactions sorted most-recent-first (date desc, then createdAt desc) (Req 3.1).
 * @param {Transaction[]} list
 * @returns {Transaction[]}
 */
function sortRecent(list) {
  return list.slice().sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1;
    return (b.createdAt || 0) - (a.createdAt || 0);
  });
}

/**
 * Filtered + sorted transactions for the list view. Applies month + category
 * filters together (logical AND) (Req 4.1–4.3).
 * @param {{ month?: string, categoryId?: string }} [opts]
 * @returns {Transaction[]}
 */
export function selectFilteredTransactions(opts = {}) {
  const month = opts.month ?? state.selectedMonth;
  const categoryId = opts.categoryId ?? state.filterCategory;
  let list = state.transactions;
  if (month) list = list.filter((t) => monthOf(t.date) === month);
  if (categoryId) list = list.filter((t) => t.categoryId === categoryId);
  return sortRecent(list);
}

/**
 * All transactions for a given month (unsorted filter helper).
 * @param {string} [month]
 * @returns {Transaction[]}
 */
export function selectTransactionsForMonth(month = state.selectedMonth) {
  return state.transactions.filter((t) => monthOf(t.date) === month);
}

/**
 * Monthly totals for the selected (or given) month (Req 6.1). Returns zeros
 * when there are no transactions (Req 6.4).
 * @param {string} [month]
 * @returns {MonthlySummary}
 */
export function selectMonthlySummary(month = state.selectedMonth) {
  const list = selectTransactionsForMonth(month);
  let totalIncome = 0;
  let totalExpenses = 0;
  for (const t of list) {
    if (t.type === 'income') totalIncome += t.amount;
    else totalExpenses += t.amount;
  }
  return {
    month,
    totalIncome,
    totalExpenses,
    net: totalIncome - totalExpenses,
  };
}

/**
 * Expense totals grouped by category for the month, omitting zero-total
 * categories, sorted descending by total (Req 7.2).
 * @param {string} [month]
 * @returns {CategorySpend[]}
 */
export function selectSpendingByCategory(month = state.selectedMonth) {
  const list = selectTransactionsForMonth(month).filter(
    (t) => t.type === 'expense'
  );
  /** @type {Map<string, number>} */
  const totals = new Map();
  for (const t of list) {
    totals.set(t.categoryId, (totals.get(t.categoryId) || 0) + t.amount);
  }
  /** @type {CategorySpend[]} */
  const result = [];
  for (const [categoryId, total] of totals) {
    if (total <= 0) continue;
    result.push({
      categoryId,
      categoryName: categoryName(categoryId),
      total,
    });
  }
  return result.sort((a, b) => b.total - a.total);
}

/**
 * Resolve a category id to its display name (falls back gracefully).
 * @param {string} id
 * @returns {string}
 */
export function categoryName(id) {
  const c = state.categories.find((x) => x.id === id);
  if (!c) return t.category.unknown;
  // Localize default categories by their stable slug id; custom categories
  // keep their user-entered name.
  if (c.isDefault && t.defaultCategories[c.id]) return t.defaultCategories[c.id];
  return c.name;
}

/**
 * Count of transactions using a given category (for delete-in-use warning) (Req 5.5).
 * @param {string} categoryId
 * @returns {number}
 */
export function countTransactionsForCategory(categoryId) {
  return state.transactions.filter((t) => t.categoryId === categoryId).length;
}

/**
 * Sorted list of months (desc) that have transactions, plus the current month,
 * for populating the month selector.
 * @returns {string[]}
 */
export function selectAvailableMonths() {
  const set = new Set(state.transactions.map((t) => monthOf(t.date)));
  set.add(currentMonth());
  set.add(state.selectedMonth);
  return Array.from(set)
    .filter(Boolean)
    .sort((a, b) => (a < b ? 1 : -1));
}


// ---- Wallet selectors -----------------------------------------------------

/**
 * Look up a wallet by id.
 * @param {string} id
 * @returns {import('../types.js').Wallet | undefined}
 */
export function walletById(id) {
  return state.wallets.find((w) => w.id === id);
}

/**
 * Display name for a wallet id (falls back gracefully).
 * @param {string} id
 * @returns {string}
 */
export function walletName(id) {
  const w = walletById(id);
  return w ? w.name : '';
}

/**
 * Derived saldo for a wallet: initial balance + all income to it − all
 * expenses from it, across all time (Req 14.8). Keeps balances drift-free.
 * @param {string} id
 * @returns {number}
 */
export function walletSaldo(id) {
  const w = walletById(id);
  if (!w) return 0;
  let saldo = w.balance;
  for (const tx of state.transactions) {
    if (tx.walletId !== id) continue;
    if (tx.type === 'income') saldo += tx.amount;
    else saldo -= tx.amount;
  }
  return saldo;
}

/**
 * Total saldo across all wallets. Credit-card wallets that are negative
 * subtract from the total (Req 14.3, 14.4).
 * @returns {number}
 */
export function totalSaldo() {
  return state.wallets.reduce((sum, w) => sum + walletSaldo(w.id), 0);
}

/**
 * Wallets with their derived saldo, in creation order.
 * @returns {{ wallet: import('../types.js').Wallet, saldo: number }[]}
 */
export function walletsWithSaldo() {
  return state.wallets
    .slice()
    .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0))
    .map((w) => ({ wallet: w, saldo: walletSaldo(w.id) }));
}
