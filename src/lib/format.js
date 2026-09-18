// @ts-check
/** Currency formatting. Single locale/currency for this personal build. */

const fmt = new Intl.NumberFormat(undefined, {
  style: 'currency',
  currency: guessCurrency(),
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Best-effort local currency; falls back to USD.
 * @returns {string}
 */
function guessCurrency() {
  try {
    const region = (navigator.language || 'en-US').split('-')[1];
    /** @type {Record<string,string>} */
    const map = {
      US: 'USD', GB: 'GBP', EU: 'EUR', DE: 'EUR', FR: 'EUR', ES: 'EUR',
      IT: 'EUR', IE: 'EUR', IN: 'INR', JP: 'JPY', CN: 'CNY', CA: 'CAD',
      AU: 'AUD', NZ: 'NZD', CH: 'CHF', SE: 'SEK', NO: 'NOK', DK: 'DKK',
      BR: 'BRL', MX: 'MXN', ZA: 'ZAR', SG: 'SGD', AE: 'AED', SA: 'SAR',
    };
    return (region && map[region]) || 'USD';
  } catch {
    return 'USD';
  }
}

/**
 * Format a number as currency.
 * @param {number} n
 * @returns {string}
 */
export function money(n) {
  return fmt.format(Number.isFinite(n) ? n : 0);
}

/**
 * Format with an explicit +/- sign for a transaction based on its type.
 * @param {number} amount
 * @param {'income'|'expense'} type
 * @returns {string}
 */
export function signedMoney(amount, type) {
  const sign = type === 'expense' ? '-' : '+';
  return sign + money(Math.abs(amount)).replace('-', '');
}
