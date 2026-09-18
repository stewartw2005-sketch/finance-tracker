// @ts-check
/**
 * Dompet (wallets/accounts) — Phase 2 (Req 14).
 * Total saldo card + wallet list (type + derived saldo) + add/edit/delete.
 * Credit-card wallets can show a negative balance (amount owed).
 * @typedef {import('../types.js').Wallet} Wallet
 * @typedef {import('../types.js').WalletType} WalletType
 */
import { el } from '../lib/dom.js';
import * as store from '../state/store.js';
import { money } from '../lib/format.js';
import { parseAmount } from '../lib/format.js';
import { t } from '../lib/i18n.js';
import { openModal, closeModal, confirmDialog } from './modal.js';
import { DEFAULT_WALLET_ID } from '../data/db.js';

const WALLET_TYPES = /** @type {WalletType[]} */ (['bank', 'ewallet', 'cash', 'credit']);

const TYPE_ICON = {
  bank: '🏦',
  ewallet: '📱',
  cash: '💵',
  credit: '💳',
};

/**
 * Render the Dompet view.
 * @param {HTMLElement} container
 */
export function renderWallets(container) {
  const rows = store.walletsWithSaldo();
  const total = store.totalSaldo();

  // Total saldo card
  const totalCard = el('div', { class: 'glance-card' }, [
    el('div', { class: 'glance-label' }, [
      el('span', { 'aria-hidden': 'true' }, '💰'),
      el('span', {}, t.wallet.totalSaldo),
    ]),
    el(
      'div',
      { class: 'glance-amount' + (total < 0 ? ' negative' : '') },
      money(total)
    ),
  ]);

  // Add button
  const addBtn = el(
    'button',
    { class: 'btn primary full', onClick: () => openWalletForm() },
    '+ ' + t.wallet.addButton
  );

  // Wallet list
  let listNode;
  if (rows.length === 0) {
    listNode = el('div', { class: 'empty' }, [
      el('span', { class: 'emoji', 'aria-hidden': 'true' }, '👛'),
      el('div', {}, t.wallet.emptyTitle),
      el('div', { style: 'font-size:0.85rem;margin-top:4px' }, t.wallet.emptyHint),
    ]);
  } else {
    listNode = el(
      'ul',
      { class: 'wallet-list' },
      rows.map(({ wallet, saldo }) => walletRow(wallet, saldo))
    );
  }

  container.append(
    totalCard,
    el('div', { style: 'margin:14px 0' }, addBtn),
    el('div', { class: 'section-title' }, t.wallet.yourWallets),
    listNode
  );
}

/**
 * @param {Wallet} w @param {number} saldo
 * @returns {HTMLElement}
 */
function walletRow(w, saldo) {
  const isCredit = w.type === 'credit';
  const negative = saldo < 0;
  // Credit wallets that are negative show the owed amount explicitly.
  const saldoText =
    isCredit && negative
      ? `${money(saldo)} · ${t.wallet.owed}`
      : money(saldo);

  return el('li', { class: 'wallet-item' }, [
    el('span', { class: 'wallet-icon', 'aria-hidden': 'true' }, TYPE_ICON[w.type] || '👛'),
    el('div', { class: 'wallet-main' }, [
      el('div', { class: 'wallet-name' }, [
        w.name,
        w.id === DEFAULT_WALLET_ID
          ? el('span', { class: 'badge', style: 'margin-left:8px' }, t.wallet.defaultBadge)
          : null,
      ]),
      el('div', { class: 'wallet-type' }, t.wallet.types[w.type] || ''),
    ]),
    el(
      'div',
      { class: 'wallet-saldo ' + (negative ? 'negative' : 'positive') },
      saldoText
    ),
    el('div', { class: 'tx-actions' }, [
      el(
        'button',
        {
          class: 'icon-btn',
          'aria-label': t.app.edit,
          onClick: () => openWalletForm(w),
        },
        '✏️'
      ),
      w.id === DEFAULT_WALLET_ID
        ? null
        : el(
            'button',
            {
              class: 'icon-btn',
              'aria-label': t.app.delete,
              onClick: () => confirmDeleteWallet(w),
            },
            '🗑️'
          ),
    ]),
  ]);
}

/**
 * Open the add/edit wallet form in a modal.
 * @param {Wallet} [existing]
 */
function openWalletForm(existing) {
  const isEdit = !!existing;
  const form = {
    name: existing ? existing.name : '',
    type: /** @type {WalletType} */ (existing ? existing.type : 'bank'),
    balance: existing ? String(existing.balance) : '',
  };
  /** @type {Record<string,string>} */
  let errors = {};

  const content = el('form', { class: 'stack', novalidate: 'true' });

  function rebuild() {
    content.textContent = '';

    const nameInput = el('input', {
      type: 'text',
      value: form.name,
      placeholder: t.wallet.namePlaceholder,
      class: errors.name ? 'invalid' : '',
      onInput: (e) => (form.name = e.target.value),
    });

    const typeSelect = el(
      'select',
      { onChange: (e) => (form.type = e.target.value) },
      WALLET_TYPES.map((ty) =>
        el('option', { value: ty, selected: ty === form.type }, t.wallet.types[ty])
      )
    );

    const balanceInput = el('input', {
      type: 'number',
      inputmode: 'numeric',
      step: '1',
      value: form.balance,
      placeholder: t.tx.amountPlaceholder,
      class: errors.balance ? 'invalid' : '',
      onInput: (e) => (form.balance = e.target.value),
    });

    content.append(
      field(t.wallet.name, nameInput, errors.name),
      field(t.wallet.type, typeSelect),
      field(t.wallet.initialBalance, balanceInput, errors.balance),
      el('div', { class: 'btn-row' }, [
        el('button', { type: 'button', class: 'btn ghost', onClick: () => closeModal() }, t.app.cancel),
        el('button', { type: 'submit', class: 'btn primary' }, isEdit ? t.app.save : t.app.add),
      ])
    );
  }

  function field(labelText, control, error) {
    return el('label', { class: 'field' }, [
      el('span', { class: 'field-label' }, labelText),
      control,
      el('span', { class: 'field-error', role: error ? 'alert' : undefined }, error || ''),
    ]);
  }

  content.addEventListener('submit', async (e) => {
    e.preventDefault();
    errors = {};
    const name = form.name.trim();
    // Balance may be empty (treated as 0) or a valid integer; credit can be negative.
    const rawBalance = form.balance.trim();
    let balance = 0;
    if (rawBalance !== '') {
      balance = parseAmount(rawBalance);
      // Allow a leading minus for any type (credit typically negative).
      if (Number.isNaN(balance)) errors.balance = t.wallet.balanceInvalid;
    }
    if (!name) errors.name = t.wallet.nameRequired;

    if (Object.keys(errors).length > 0) {
      rebuild();
      return;
    }

    if (isEdit && existing) {
      await store.editWallet(existing.id, { name, type: form.type, balance });
    } else {
      await store.addWallet({ name, type: form.type, balance });
    }
    closeModal();
  });

  rebuild();
  openModal(isEdit ? t.wallet.editTitle : t.wallet.addTitle, content);
}

/** @param {Wallet} w */
function confirmDeleteWallet(w) {
  const linked = store
    .getState()
    .transactions.filter((tx) => tx.walletId === w.id).length;
  confirmDialog({
    title: t.wallet.deleteTitle,
    message: t.wallet.deleteMsg(w.name, linked),
    confirmLabel: t.app.delete,
    onConfirm: () => store.removeWallet(w.id),
  });
}
