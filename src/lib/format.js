// @ts-check
/**
 * Currency formatting (Req 12). The app uses Indonesian Rupiah (IDR),
 * displayed as `Rp1.250.000` with Indonesian thousands separators and no
 * decimal places. Internal math uses whole-rupiah integers.
 */
import { locale } from './i18n.js';

const fmt = new Intl.NumberFormat(locale, {
  style: 'currency',
  currency: 'IDR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/**
 * Format a number as Rupiah, e.g. 1250000 -> "Rp1.250.000".
 * Negative values keep their sign, e.g. -500000 -> "-Rp500.000".
 * @param {number} n
 * @returns {string}
 */
export function money(n) {
  return fmt.format(Number.isFinite(n) ? Math.round(n) : 0);
}

/**
 * Format an absolute Rupiah value with an explicit +/- sign based on the
 * transaction type. Expenses are shown negative, income positive.
 * @param {number} amount
 * @param {'income'|'expense'} type
 * @returns {string}
 */
export function signedMoney(amount, type) {
  const sign = type === 'expense' ? '-' : '+';
  return sign + money(Math.abs(amount));
}

/**
 * Format a signed Rupiah value directly (used for balances/gains that may be
 * negative), e.g. -500000 -> "-Rp500.000", 300000 -> "Rp300.000".
 * @param {number} n
 * @returns {string}
 */
export function moneySigned(n) {
  return money(n);
}

/**
 * Parse user input into a whole-rupiah integer. Accepts plain digits and
 * strips grouping characters (`.`, `,`, spaces). Returns NaN if not numeric.
 * @param {string|number} input
 * @returns {number}
 */
export function parseAmount(input) {
  if (typeof input === 'number') return Math.round(input);
  const cleaned = String(input).replace(/[.\s,]/g, '');
  if (cleaned === '' || !/^-?\d+$/.test(cleaned)) return NaN;
  return parseInt(cleaned, 10);
}

/**
 * Compact Rupiah for tight spaces (e.g. calendar cells), e.g.
 * 675000 -> "675rb", 1250000 -> "1,2jt", 500 -> "500". Keeps a leading sign.
 * @param {number} n
 * @returns {string}
 */
export function moneyShort(n) {
  if (!Number.isFinite(n) || n === 0) return '0';
  const sign = n < 0 ? '-' : '';
  const abs = Math.abs(n);
  let out;
  if (abs >= 1_000_000) {
    const v = abs / 1_000_000;
    out = (Number.isInteger(v) ? String(v) : v.toFixed(1)).replace('.', ',') + 'jt';
  } else if (abs >= 1_000) {
    const v = abs / 1_000;
    out = (Number.isInteger(v) ? String(v) : v.toFixed(1)).replace('.', ',') + 'rb';
  } else {
    out = String(Math.round(abs));
  }
  return sign + out;
}

/**
 * Group a raw amount string with `.` thousands separators for display in an
 * input field, e.g. "500000" -> "500.000". Non-digits are stripped; an empty
 * or all-zero-stripped string returns ''. A leading '-' is preserved.
 * @param {string} raw
 * @returns {string}
 */
export function groupDigits(raw) {
  let s = String(raw == null ? '' : raw);
  const neg = s.trim().startsWith('-');
  const digits = s.replace(/\D/g, '');
  if (digits === '') return '';
  const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return (neg ? '-' : '') + grouped;
}

/**
 * Wire a text input so it live-formats with `.` thousands separators while
 * keeping the caret reasonable. The input should be type="text"
 * inputmode="numeric". Returns nothing; attaches an input listener.
 * @param {HTMLInputElement} input
 */
export function attachAmountFormatting(input) {
  input.addEventListener('input', () => {
    input.value = groupDigits(input.value);
  });
}
