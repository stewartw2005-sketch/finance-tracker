// @ts-check
/**
 * Add / edit transaction form (Req 1, 2.1, 2.2). Opened in a modal.
 * @typedef {import('../types.js').Transaction} Transaction
 */
import { el } from '../lib/dom.js';
import { openModal, closeModal } from './modal.js';
import * as store from '../state/store.js';
import { validateTransaction } from '../lib/validation.js';
import { todayISO } from '../lib/dates.js';

/**
 * Open the transaction form. Pass a transaction to edit; omit to add.
 * @param {Transaction} [existing]
 */
export function openTransactionForm(existing) {
  const isEdit = !!existing;
  const state = store.getState();
  const categories = state.categories;

  // Working copy of form values.
  const form = {
    amount: existing ? String(existing.amount) : '',
    type: /** @type {'income'|'expense'} */ (existing ? existing.type : 'expense'),
    categoryId: existing ? existing.categoryId : '',
    date: existing ? existing.date : todayISO(),
    note: existing && existing.note ? existing.note : '',
  };

  /** @type {Record<string,string>} */
  let errors = {};

  const content = el('form', { class: 'stack', novalidate: 'true' });

  function rebuild() {
    content.textContent = '';

    // Type segmented control
    const seg = el('div', { class: 'segmented', role: 'group', 'aria-label': 'Type' }, [
      typeButton('expense', 'Expense'),
      typeButton('income', 'Income'),
    ]);

    // Amount
    const amountInput = el('input', {
      type: 'number',
      inputmode: 'decimal',
      step: '0.01',
      min: '0',
      placeholder: '0.00',
      value: form.amount,
      class: errors.amount ? 'invalid' : '',
      onInput: (e) => (form.amount = e.target.value),
    });

    // Category select
    const catSelect = el(
      'select',
      {
        class: errors.categoryId ? 'invalid' : '',
        onChange: (e) => (form.categoryId = e.target.value),
      },
      [
        el('option', { value: '', disabled: true, selected: !form.categoryId }, 'Select category…'),
        ...categories.map((c) =>
          el('option', { value: c.id, selected: c.id === form.categoryId }, c.name)
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
      placeholder: 'Optional note',
      value: form.note,
      onInput: (e) => (form.note = e.target.value),
    });

    content.append(
      field('Type', seg, errors.type),
      field('Amount', amountInput, errors.amount),
      field('Category', catSelect, errors.categoryId),
      field('Date', dateInput, errors.date),
      field('Note', noteInput),
      el('div', { class: 'btn-row' }, [
        el('button', { type: 'button', class: 'btn ghost', onClick: () => closeModal() }, 'Cancel'),
        el('button', { type: 'submit', class: 'btn primary' }, isEdit ? 'Save' : 'Add'),
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
      amount: parseFloat(form.amount),
      type: form.type,
      categoryId: form.categoryId,
      date: form.date,
      note: form.note.trim() || undefined,
    };
    if (isEdit && existing) {
      await store.editTransaction(existing.id, payload);
    } else {
      await store.addTransaction(payload);
    }
    closeModal();
  });

  rebuild();
  openModal(isEdit ? 'Edit transaction' : 'Add transaction', content);
}
