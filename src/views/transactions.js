// @ts-check
/**
 * Transactions list view: filter bar (month + category), list sorted
 * most-recent-first, edit/delete row actions (Req 3, 4, 2.3).
 */
import { el } from '../lib/dom.js';
import * as store from '../state/store.js';
import { formatMonthLabel, formatDateLabel } from '../lib/dates.js';
import { signedMoney } from '../lib/format.js';
import { t, typeLabel } from '../lib/i18n.js';
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
      'aria-label': t.tx.filterCategoryAria,
      onChange: (e) => store.setFilterCategory(e.target.value),
    },
    [
      el('option', { value: '', selected: state.filterCategory === '' }, t.tx.allCategories),
      ...categories.map((c) =>
        el('option', { value: c.id, selected: c.id === state.filterCategory }, store.categoryName(c.id))
      ),
    ]
  );

  const filterBar = el('div', { class: 'card' }, [
    el('div', { class: 'filter-bar' }, [
      el('label', { class: 'field' }, [
        el('span', { class: 'field-label' }, t.tx.filterMonth),
        monthSelect(),
      ]),
      el('label', { class: 'field' }, [
        el('span', { class: 'field-label' }, t.tx.filterCategory),
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
            t.app.clear
          )
        )
      : null,
  ]);

  // ---- List (Req 3) ----
  let listNode;
  if (list.length === 0) {
    listNode = el('div', { class: 'empty' }, [
      el('span', { class: 'emoji', 'aria-hidden': 'true' }, '🗒️'),
      el('div', {}, t.tx.emptyTitle),
      el('div', { style: 'font-size:0.85rem;margin-top:4px' }, t.tx.emptyHint),
    ]);
  } else {
    listNode = el(
      'ul',
      { class: 'tx-list' },
      list.map((tx) => transactionRow(tx))
    );
  }

  container.append(
    filterBar,
    el(
      'div',
      { class: 'section-title' },
      t.tx.count(list.length, formatMonthLabel(state.selectedMonth))
    ),
    listNode
  );
}

/**
 * @param {import('../types.js').Transaction} tx
 * @returns {HTMLElement}
 */
function transactionRow(tx) {
  const meta = [formatDateLabel(tx.date), store.categoryName(tx.categoryId)].join(' · ');
  return el('li', { class: 'tx-item' }, [
    el('div', { class: 'tx-main' }, [
      el('div', { class: 'tx-cat' }, store.categoryName(tx.categoryId)),
      el('div', { class: 'tx-meta' }, meta),
      tx.note ? el('div', { class: 'tx-note' }, tx.note) : null,
    ]),
    el('div', { class: 'tx-amount ' + tx.type }, signedMoney(tx.amount, tx.type)),
    el('div', { class: 'tx-actions' }, [
      el(
        'button',
        {
          class: 'icon-btn',
          'aria-label': t.tx.editAria,
          onClick: () => openTransactionForm(tx),
        },
        '✏️'
      ),
      el(
        'button',
        {
          class: 'icon-btn',
          'aria-label': t.tx.deleteAria,
          onClick: () => confirmDelete(tx),
        },
        '🗑️'
      ),
    ]),
  ]);
}

/** @param {import('../types.js').Transaction} tx */
function confirmDelete(tx) {
  confirmDialog({
    title: t.tx.deleteTitle,
    message: t.tx.deleteMsg(
      typeLabel(tx.type),
      signedMoney(tx.amount, tx.type),
      store.categoryName(tx.categoryId)
    ),
    confirmLabel: t.app.delete,
    onConfirm: () => store.removeTransaction(tx.id),
  });
}
