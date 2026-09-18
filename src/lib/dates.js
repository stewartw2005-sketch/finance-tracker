// @ts-check
/** Date helpers working in the user's local timezone. All dates are stored
 *  as ISO 'YYYY-MM-DD' strings; months as 'YYYY-MM'. Labels use Indonesian
 *  formatting (Req 12.5). */
import { locale } from './i18n.js';

/**
 * Today's date as ISO 'YYYY-MM-DD' in local time.
 * @returns {string}
 */
export function todayISO() {
  return toISODate(new Date());
}

/**
 * Format a Date as local 'YYYY-MM-DD'.
 * @param {Date} d
 * @returns {string}
 */
export function toISODate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Current month key 'YYYY-MM' in local time.
 * @returns {string}
 */
export function currentMonth() {
  return todayISO().slice(0, 7);
}

/**
 * Extract the month key 'YYYY-MM' from an ISO date string.
 * @param {string} isoDate
 * @returns {string}
 */
export function monthOf(isoDate) {
  return (isoDate || '').slice(0, 7);
}

/**
 * Human-friendly month label, e.g. '2026-09' -> 'September 2026'.
 * @param {string} monthKey
 * @returns {string}
 */
export function formatMonthLabel(monthKey) {
  const [y, m] = (monthKey || '').split('-').map(Number);
  if (!y || !m) return monthKey || '';
  const d = new Date(y, m - 1, 1);
  return d.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
}

/**
 * Human-friendly date label in Indonesian, e.g. '2026-09-18' -> '18 Sep 2026'.
 * @param {string} isoDate
 * @returns {string}
 */
export function formatDateLabel(isoDate) {
  const [y, m, d] = (isoDate || '').split('-').map(Number);
  if (!y || !m || !d) return isoDate || '';
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * True if the ISO date is today (local time).
 * @param {string} isoDate
 * @returns {boolean}
 */
export function isToday(isoDate) {
  return isoDate === todayISO();
}

/**
 * True if the ISO date is yesterday (local time).
 * @param {string} isoDate
 * @returns {boolean}
 */
export function isYesterday(isoDate) {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return isoDate === toISODate(d);
}

/**
 * True if the string is a valid ISO 'YYYY-MM-DD' calendar date.
 * @param {string} isoDate
 * @returns {boolean}
 */
export function isValidISODate(isoDate) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate || '')) return false;
  const [y, m, d] = isoDate.split('-').map(Number);
  if (m < 1 || m > 12 || d < 1 || d > 31) return false;
  const date = new Date(y, m - 1, d);
  return (
    date.getFullYear() === y &&
    date.getMonth() === m - 1 &&
    date.getDate() === d
  );
}
