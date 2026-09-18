// @ts-check
/**
 * Transactions list view: filter bar (month + category), list sorted
 * most-recent-first, edit/delete row actions (Req 3, 4, 2.3).
 */
import { el } from '../lib/dom.js';
import * as store from '../state/store.js';
import { formatMonthLabel, formatDateLabel } from '../lib/dates.js';
import { signedMoney } from '../lib/format.js';
import { monthSelect } from './monthSelect.js';
import { openTransactionForm } from './transactionForm.js';
import { confirmDialog } from './modal.js';

/**
 * Render the transactions view into the given container.
 * @param {HTMLElement} container
 */
export function renderTransactions(container) {
  const state = store.getState();
  const categories = state.categories;
  const list = store.selectFilteredTransactions();

  // ---- Filter bar (Req 4) ----
  const catFilter = el(
    'select',
    {
      'aria-label': 'Filter by category',
      onChange: (e) => store.setFilterCategory(e.target.value),
    },
    [
      el('option', { value: '', selected: state.filterCategory === '' }, 'All categories'),
      ...categories.map((c) =>
        el('option', { value: c.id, selected: c.id === state.filterCategory }, c.name)
      ),
    ]
  );

  const filterBar = el('div', { class: 'card' }, [
    el('div', { class: 'filter-bar' }, [
      el('label', { class: 'field' }, [
        el('span', { class: 'field-label' }, 'Month'),
        monthSelect(),
      ]),
      el('label', { class: 'field' }, [
        el('span', { class: 'field-label' }, 'Category'),
        catFilter,
      ]),
    ]),
    state.filterCategory
      ? el(
          'div',
          { style: 'margin-top:10px' },
          el(
            'button',
            { class: 'link-btn', onClick: () => store.clearFilters() },
            'Clear filters'
          )
        )
      : null,
  ]);

  // ---- List (Req 3) ----
  let listNode;
  if (list.length === 0) {
    listNode = el('div', { class: 'empty' }, [
      el('span', { class: 'emoji', 'aria-hidden': 'true' }, '🗒️'),
      el('div', {}, 'No transactions match this view.'),
      el('div', { style: 'font-size:0.85rem;margin-top:4px' }, 'Tap + to add one.'),
    ]);
  } else {
    listNode = el(
      'ul',
      { class: 'tx-list' },
      list.map((t) => transactionRow(t))
    );
  }

  container.append(
    filterBar,
    el(
      'div',
      { class: 'section-title' },
      `${list.length} transaction${list.length === 1 ? '' : 's'} — ${formatMonthLabel(
        state.selectedMonth
      )}`
    ),
    listNode
  );
}

/**
 * @param {import('../types.js').Transaction} t
 * @returns {HTMLElement}
 */
function transactionRow(t) {
  const meta = [formatDateLabel(t.date), store.categoryName(t.categoryId)].join(' · ');
  return el('li', { class: 'tx-item' }, [
    el('div', { class: 'tx-main' }, [
      el('div', { class: 'tx-cat' }, store.categoryName(t.categoryId)),
      el('div', { class: 'tx-meta' }, meta),
      t.note ? el('div', { class: 'tx-note' }, t.note) : null,
    ]),
    el('div', { class: 'tx-amount ' + t.type }, signedMoney(t.amount, t.type)),
    el('div', { class: 'tx-actions' }, [
      el(
        'button',
        {
          class: 'icon-btn',
          'aria-label': 'Edit transaction',
          onClick: () => openTransactionForm(t),
        },
        '✏️'
      ),
      el(
        'button',
        {
          class: 'icon-btn',
          'aria-label': 'Delete transaction',
          onClick: () => confirmDelete(t),
        },
        '🗑️'
      ),
    ]),
  ]);
}

/** @param {import('../types.js').Transaction} t */
function confirmDelete(t) {
  confirmDialog({
    title: 'Delete transaction?',
    message: `Delete this ${t.type} of ${signedMoney(t.amount, t.type)} in ${store.categoryName(
      t.categoryId
    )}? This can't be undone.`,
    confirmLabel: 'Delete',
    onConfirm: () => store.removeTransaction(t.id),
  });
}
