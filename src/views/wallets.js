// @ts-check
/**
 * Dompet (wallets/accounts) — placeholder for Phase 1. The full wallet
 * management (add/edit/delete, total saldo, per-wallet balances) is built in
 * Phase 2.
 */
import { el } from '../lib/dom.js';
import { t } from '../lib/i18n.js';

/**
 * Render the Dompet placeholder.
 * @param {HTMLElement} container
 */
export function renderWallets(container) {
  container.append(
    el('div', { class: 'empty' }, [
      el('span', { class: 'emoji', 'aria-hidden': 'true' }, '👛'),
      el('div', {}, t.dompet.placeholderTitle),
      el('div', { style: 'font-size:0.85rem;margin-top:4px' }, t.dompet.placeholderHint),
    ])
  );
}
