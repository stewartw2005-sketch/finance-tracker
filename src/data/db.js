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
const DB_VERSION = 2;
const STORE_TX = 'transactions';
const STORE_CAT = 'categories';
const STORE_WALLET = 'wallets';

/** Stable id for the seeded default cash wallet (Req 21.2). */
export const DEFAULT_WALLET_ID = 'tunai';

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
      // v1 stores
      if (!db.objectStoreNames.contains(STORE_TX)) {
        const tx = db.createObjectStore(STORE_TX, { keyPath: 'id' });
        tx.createIndex('by-date', 'date', { unique: false });
      }
      if (!db.objectStoreNames.contains(STORE_CAT)) {
        db.createObjectStore(STORE_CAT, { keyPath: 'id' });
      }
      // v2 stores (Req 21.3)
      if (!db.objectStoreNames.contains(STORE_WALLET)) {
        db.createObjectStore(STORE_WALLET, { keyPath: 'id' });
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

// ---- Wallets --------------------------------------------------------------

/** @returns {Promise<import('../types.js').Wallet[]>} */
export async function getAllWallets() {
  try {
    const all = await run(STORE_WALLET, 'readonly', (s) => s.getAll());
    return Array.isArray(all) ? all.filter(isValidWallet) : [];
  } catch {
    return []; // Safe fallback (Req 9.3)
  }
}

/** @param {import('../types.js').Wallet} w @returns {Promise<void>} */
export async function addWallet(w) {
  await run(STORE_WALLET, 'readwrite', (s) => s.put(w));
}

/** @param {import('../types.js').Wallet} w @returns {Promise<void>} */
export async function updateWallet(w) {
  await run(STORE_WALLET, 'readwrite', (s) => s.put(w));
}

/** @param {string} id @returns {Promise<void>} */
export async function deleteWallet(id) {
  await run(STORE_WALLET, 'readwrite', (s) => s.delete(id));
}

/**
 * Ensure a default cash wallet ("Tunai") exists and migrate any legacy
 * transactions that have no walletId onto it (Req 21.1, 21.2). Never throws.
 * @param {string} tunaiName - localized display name for the seeded wallet
 * @returns {Promise<import('../types.js').Wallet[]>} the full wallet list
 */
export async function seedDefaultWalletAndMigrate(tunaiName) {
  try {
    let wallets = await getAllWallets();

    // Seed the default cash wallet if there are none yet.
    if (wallets.length === 0) {
      /** @type {import('../types.js').Wallet} */
      const tunai = {
        id: DEFAULT_WALLET_ID,
        name: tunaiName,
        type: 'cash',
        balance: 0,
        isPrimary: true,
        createdAt: Date.now(),
      };
      await addWallet(tunai);
      wallets = [tunai];
    }

    // Ensure exactly one primary wallet exists (migration for pre-primary data).
    if (wallets.length > 0 && !wallets.some((w) => w.isPrimary)) {
      const first =
        wallets.find((w) => w.id === DEFAULT_WALLET_ID) || wallets[0];
      first.isPrimary = true;
      await updateWallet(first);
    }

    // Migrate legacy transactions with no walletId to the default wallet.
    const txns = await getAllTransactions();
    const orphans = txns.filter((t) => !t.walletId);
    if (orphans.length > 0) {
      const fallbackId =
        (wallets.find((w) => w.id === DEFAULT_WALLET_ID) || wallets[0]).id;
      for (const t of orphans) {
        await updateTransaction({ ...t, walletId: fallbackId });
      }
    }

    return wallets;
  } catch {
    // Fall back to an in-memory default so the app still works (Req 9.3).
    return [
      {
        id: DEFAULT_WALLET_ID,
        name: tunaiName,
        type: 'cash',
        balance: 0,
        createdAt: Date.now(),
      },
    ];
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

/** @param {any} w @returns {w is import('../types.js').Wallet} */
function isValidWallet(w) {
  return (
    w &&
    typeof w.id === 'string' &&
    typeof w.name === 'string' &&
    typeof w.balance === 'number' &&
    Number.isFinite(w.balance)
  );
}
