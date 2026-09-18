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
 * @property {string} selectedMonth   - 'YYYY-MM'
 * @property {string} filterCategory  - category id or '' for all
 * @property {boolean} loaded
 * @property {string} error           - non-blocking error message ('' if none)
 */

/** @type {State} */
const state = {
  transactions: [],
  categories: [],
  selectedMonth: currentMonth(),
  filterCategory: '',
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
    const transactions = await db.getAllTransactions();
    state.categories = categories;
    state.transactions = transactions;
  } catch {
    // Fall back to defaults so the app still renders.
    state.categories = db.DEFAULT_CATEGORIES.slice();
    state.transactions = [];
    state.error = 'Could not load saved data; starting fresh.';
  } finally {
    state.loaded = true;
    notify();
  }
}

// ---- Mutations (write-through) --------------------------------------------

/**
 * @param {{amount:number, type:import('../types.js').TxType, categoryId:string, date:string, note?:string}} data
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
    createdAt: Date.now(),
  };
  state.transactions.push(txn);
  notify();
  try {
    await db.addTransaction(txn);
  } catch {
    setError('Could not save the transaction to storage.');
  }
}

/**
 * @param {string} id
 * @param {{amount:number, type:import('../types.js').TxType, categoryId:string, date:string, note?:string}} data
 * @returns {Promise<void>}
 */
export async function editTransaction(id, data) {
  const idx = state.transactions.findIndex((t) => t.id === id);
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
  };
  state.transactions[idx] = updated;
  notify();
  try {
    await db.updateTransaction(updated);
  } catch {
    setError('Could not update the transaction in storage.');
  }
}

/**
 * @param {string} id
 * @returns {Promise<void>}
 */
export async function removeTransaction(id) {
  state.transactions = state.transactions.filter((t) => t.id !== id);
  notify();
  try {
    await db.deleteTransaction(id);
  } catch {
    setError('Could not delete the transaction from storage.');
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
    setError('Could not save the category to storage.');
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
    setError('Could not delete the category from storage.');
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
