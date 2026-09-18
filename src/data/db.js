// @ts-check
/**
 * IndexedDB repository for the finance tracker.
 * Uses the raw IndexedDB API (no dependencies). All reads are wrapped so a
 * missing or corrupt database resolves to a valid empty/default state rather
 * than throwing (Req 9.3).
 *
 * @typedef {import('../types.js').Transaction} Transaction
 * @typedef {import('../types.js').Category} Category
 */

const DB_NAME = 'finance-tracker';
const DB_VERSION = 1;
const STORE_TX = 'transactions';
const STORE_CAT = 'categories';

/** Default categories seeded on first run (Req 5.1). Stable slug ids. */
export const DEFAULT_CATEGORIES = /** @type {Category[]} */ ([
  { id: 'food', name: 'Food', isDefault: true },
  { id: 'transport', name: 'Transport', isDefault: true },
  { id: 'rent', name: 'Rent', isDefault: true },
  { id: 'bills', name: 'Bills', isDefault: true },
  { id: 'shopping', name: 'Shopping', isDefault: true },
  { id: 'entertainment', name: 'Entertainment', isDefault: true },
  { id: 'income', name: 'Income', isDefault: true },
  { id: 'other', name: 'Other', isDefault: true },
]);

/** @type {Promise<IDBDatabase|null>|null} */
let dbPromise = null;

/**
 * Open (and if needed create/upgrade) the database.
 * Resolves to null if IndexedDB is unavailable or blocked so callers can
 * fall back to defaults without crashing.
 * @returns {Promise<IDBDatabase|null>}
 */
function openDB() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve) => {
    if (typeof indexedDB === 'undefined') {
      resolve(null);
      return;
    }
    let req;
    try {
      req = indexedDB.open(DB_NAME, DB_VERSION);
    } catch {
      resolve(null);
      return;
    }
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_TX)) {
        const tx = db.createObjectStore(STORE_TX, { keyPath: 'id' });
        tx.createIndex('by-date', 'date', { unique: false });
      }
      if (!db.objectStoreNames.contains(STORE_CAT)) {
        db.createObjectStore(STORE_CAT, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(null);
    req.onblocked = () => resolve(null);
  });
  return dbPromise;
}

/**
 * Run a transaction against a store and return a promise for its result.
 * @template T
 * @param {string} storeName
 * @param {IDBTransactionMode} mode
 * @param {(store: IDBObjectStore) => IDBRequest<T>} fn
 * @returns {Promise<T>}
 */
function run(storeName, mode, fn) {
  return openDB().then(
    (db) =>
      new Promise((resolve, reject) => {
        if (!db) {
          reject(new Error('IndexedDB unavailable'));
          return;
        }
        const tx = db.transaction(storeName, mode);
        const store = tx.objectStore(storeName);
        const request = fn(store);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      })
  );
}

// ---- Transactions ---------------------------------------------------------

/** @returns {Promise<Transaction[]>} */
export async function getAllTransactions() {
  try {
    const all = await run(STORE_TX, 'readonly', (s) => s.getAll());
    return Array.isArray(all) ? all.filter(isValidTransaction) : [];
  } catch {
    return []; // Safe fallback (Req 9.3)
  }
}

/** @param {Transaction} txn @returns {Promise<void>} */
export async function addTransaction(txn) {
  await run(STORE_TX, 'readwrite', (s) => s.put(txn));
}

/** @param {Transaction} txn @returns {Promise<void>} */
export async function updateTransaction(txn) {
  await run(STORE_TX, 'readwrite', (s) => s.put(txn));
}

/** @param {string} id @returns {Promise<void>} */
export async function deleteTransaction(id) {
  await run(STORE_TX, 'readwrite', (s) => s.delete(id));
}

// ---- Categories -----------------------------------------------------------

/** @returns {Promise<Category[]>} */
export async function getAllCategories() {
  try {
    const all = await run(STORE_CAT, 'readonly', (s) => s.getAll());
    return Array.isArray(all) ? all.filter(isValidCategory) : [];
  } catch {
    return []; // Safe fallback (Req 9.3)
  }
}

/** @param {Category} c @returns {Promise<void>} */
export async function addCategory(c) {
  await run(STORE_CAT, 'readwrite', (s) => s.put(c));
}

/** @param {string} id @returns {Promise<void>} */
export async function deleteCategory(id) {
  await run(STORE_CAT, 'readwrite', (s) => s.delete(id));
}

/**
 * Seed default categories if the store is empty. Returns the full category
 * list after seeding. Never throws — on failure returns the in-memory
 * defaults so the app remains usable (Req 5.1, 9.3).
 * @returns {Promise<Category[]>}
 */
export async function seedDefaultCategoriesIfEmpty() {
  try {
    const existing = await getAllCategories();
    if (existing.length > 0) return existing;
    for (const c of DEFAULT_CATEGORIES) {
      await addCategory(c);
    }
    return DEFAULT_CATEGORIES.slice();
  } catch {
    return DEFAULT_CATEGORIES.slice();
  }
}

// ---- Validation guards for corrupt records --------------------------------

/** @param {any} t @returns {t is Transaction} */
function isValidTransaction(t) {
  return (
    t &&
    typeof t.id === 'string' &&
    typeof t.amount === 'number' &&
    Number.isFinite(t.amount) &&
    (t.type === 'income' || t.type === 'expense') &&
    typeof t.categoryId === 'string' &&
    typeof t.date === 'string'
  );
}

/** @param {any} c @returns {c is Category} */
function isValidCategory(c) {
  return c && typeof c.id === 'string' && typeof c.name === 'string';
}
