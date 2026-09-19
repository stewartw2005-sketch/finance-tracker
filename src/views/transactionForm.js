// @ts-check
/**
 * Add / edit transaction form (Req 1, 2.1, 2.2). Opened in a modal.
 * @typedef {import('../types.js').Transaction} Transaction
 */
import { el } from '../lib/dom.js';
import { openModal, closeModal } from './modal.js';
import * as store from '../state/store.js';
import { validateTransaction } from '../lib/validation.js';
import { parseAmount, groupDigits } from '../lib/format.js';
import { todayISO } from '../lib/dates.js';
import { t } from '../lib/i18n.js';

/**
 * Open the transaction form. Pass a transaction to edit; omit to add.
 * @param {Transaction} [existing]
 */
export function openTransactionForm(existing) {
  const isEdit = !!existing;
  const state = store.getState();
  const categories = state.categories;
  const wallets = state.wallets;

  // Default wallet: the transaction's own (edit), else the primary (UTAMA)
  // wallet, else the first wallet.
  const primary = store.primaryWallet();
  const defaultWalletId =
    (existing && existing.walletId) ||
    (primary ? primary.id : '') ||
    (wallets[0] ? wallets[0].id : '');

  // Working copy of form values. Amount is stored as a grouped display string.
  const form = {
    amount: existing ? groupDigits(String(existing.amount)) : '',
    type: /** @type {'income'|'expense'} */ (existing ? existing.type : 'expense'),
    categoryId: existing ? existing.categoryId : '',
    date: existing ? existing.date : todayISO(),
    note: existing && existing.note ? existing.note : '',
    walletId: defaultWalletId,
  };

  /** @type {Record<string,string>} */
  let errors = {};

  const content = el('form', { class: 'stack', novalidate: 'true' });

  function rebuild() {
    content.textContent = '';

    // Type segmented control
    const seg = el('div', { class: 'segmented', role: 'group', 'aria-label': t.tx.type }, [
      typeButton('expense', t.tx.expense),
      typeButton('income', t.tx.income),
    ]);

    // Amount (whole Rupiah, live-grouped with dots)
    const amountInput = el('input', {
      type: 'text',
      inputmode: 'numeric',
      placeholder: t.tx.amountPlaceholder,
      value: form.amount,
      class: errors.amount ? 'invalid' : '',
      onInput: (e) => {
        e.target.value = groupDigits(e.target.value);
        form.amount = e.target.value;
      },
    });

    // Category select
    const catSelect = el(
      'select',
      {
        class: errors.categoryId ? 'invalid' : '',
        onChange: (e) => (form.categoryId = e.target.value),
      },
      [
        el('option', { value: '', disabled: true, selected: !form.categoryId }, t.tx.selectCategory),
        ...categories.map((c) =>
          el('option', { value: c.id, selected: c.id === form.categoryId }, store.categoryName(c.id))
        ),
      ]
    );

    // Wallet select
    const walletSelect = el(
      'select',
      {
        class: errors.walletId ? 'invalid' : '',
        onChange: (e) => (form.walletId = e.target.value),
      },
      [
        wallets.length === 0
          ? el('option', { value: '', selected: true }, t.wallet.selectWallet)
          : null,
        ...wallets.map((w) =>
          el('option', { value: w.id, selected: w.id === form.walletId }, w.name)
        ),
      ]
    );

    // Date
    const dateInput = el('input', {
      type: 'date',
      value: form.date,
      class: errors.date ? 'invalid' : '',
      onInput: (e) => (form.date = e.target.value),
    });

    // Note
    const noteInput = el('textarea', {
      placeholder: t.tx.notePlaceholder,
      value: form.note,
      onInput: (e) => (form.note = e.target.value),
    });

    content.append(
      field(t.tx.type, seg, errors.type),
      field(t.tx.amount, amountInput, errors.amount),
      field(t.tx.category, catSelect, errors.categoryId),
      field(t.wallet.walletLabel, walletSelect, errors.walletId),
      field(t.tx.date, dateInput, errors.date),
      field(t.tx.note, noteInput),
      el('div', { class: 'btn-row' }, [
        el('button', { type: 'button', class: 'btn ghost', onClick: () => closeModal() }, t.app.cancel),
        el('button', { type: 'submit', class: 'btn primary' }, isEdit ? t.app.save : t.app.add),
      ])
    );
  }

  function typeButton(type, label) {
    return el(
      'button',
      {
        type: 'button',
        dataset: { type },
        class: form.type === type ? 'active' : '',
        'aria-pressed': form.type === type ? 'true' : 'false',
        onClick: () => {
          form.type = type;
          rebuild();
        },
      },
      label
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
    errors = validateTransaction(
      {
        amount: form.amount,
        type: form.type,
        categoryId: form.categoryId,
        date: form.date,
        note: form.note,
      },
      categories
    );
    if (Object.keys(errors).length > 0) {
      rebuild();
      return;
    }
    const payload = {
      amount: parseAmount(form.amount),
      type: form.type,
      categoryId: form.categoryId,
      date: form.date,
      note: form.note.trim() || undefined,
      walletId: form.walletId || undefined,
    };
    if (isEdit && existing) {
      await store.editTransaction(existing.id, payload);
    } else {
      await store.addTransaction(payload);
    }
    closeModal();
  });

  rebuild();
  openModal(isEdit ? t.tx.editTitle : t.tx.addTitle, content);
}
