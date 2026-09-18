// @ts-check
// Data model type definitions (JSDoc typedefs — no runtime code).
// Amounts are stored as positive numbers; `type` conveys income vs expense.

/**
 * @typedef {'income' | 'expense'} TxType
 */

/**
 * @typedef {Object} Transaction
 * @property {string} id           - uuid
 * @property {number} amount       - positive number
 * @property {TxType} type         - 'income' | 'expense'
 * @property {string} categoryId   - FK -> Category.id
 * @property {string} date         - ISO 'YYYY-MM-DD' (local date, no time)
 * @property {string} [note]       - optional free text
 * @property {number} createdAt    - epoch ms, stable tiebreak for ordering
 * @property {string} [walletId]   - FK -> Wallet.id (source/destination wallet)
 */

/**
 * @typedef {'bank' | 'ewallet' | 'cash' | 'credit'} WalletType
 */

/**
 * @typedef {Object} Wallet
 * @property {string} id           - uuid; default cash wallet uses 'tunai'
 * @property {string} name         - display name
 * @property {WalletType} type     - bank | ewallet | cash | credit
 * @property {number} balance      - INITIAL balance; displayed saldo is derived
 *                                    (initial + income − expenses). May be
 *                                    negative for credit-card wallets.
 * @property {number} createdAt    - epoch ms
 */

/**
 * @typedef {Object} Category
 * @property {string} id           - uuid; defaults use stable slugs e.g. 'food'
 * @property {string} name         - display name, unique case-insensitive
 * @property {boolean} isDefault   - default categories cannot be deleted
 */

/**
 * @typedef {Object} MonthlySummary
 * @property {string} month        - 'YYYY-MM'
 * @property {number} totalIncome
 * @property {number} totalExpenses
 * @property {number} net          - income - expenses
 */

/**
 * @typedef {Object} CategorySpend
 * @property {string} categoryId
 * @property {string} categoryName
 * @property {number} total        - expense total for the month
 */

export {};
