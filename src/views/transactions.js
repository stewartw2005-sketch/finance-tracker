// @ts-check
/**
 * Transaksi list view (Req 15): search bar + advanced filter sheet
 * (date range, wallet, category, type), and a date-grouped list
 * (Hari Ini / Kemarin / dated). Edit/delete row actions.
 */
import { el } from '../lib/dom.js';
import * as store from '../state/store.js';
import { signedMoney } from '../lib/format.js';
import { t, typeLabel } from '../lib/i18n.js';
import { icon } from '../lib/icons.js';
import { openTransactionForm } from './transactionForm.js';
import { openModal, closeModal, confirmDialog } from './modal.js';

/**
 * Render the Transaksi view into the given container.
 * @param {HTMLElement} container
 */
export function renderTransactions(container) {
  const filters = store.getState().txFilters;
  const list = store.selectTransactionsAdvanced();
  const groups = store.groupByDate(list);
  const activeCount = store.activeFilterCount();

  // ---- Search + filter row ----
  const searchInput = el('input', {
    type: 'search',
    value: filters.search,
    placeholder: t.tx.searchPlaceholder,
    'aria-label': t.tx.searchAria,
    onInput: (e) => store.setTxSearch(e.target.value),
  });

  const filterBtn = el(
    'button',
    {
      class: 'filter-btn' + (activeCount > 0 ? ' active' : ''),
      'aria-label': t.tx.filterButton,
      onClick: () => openFilterSheet(),
    },
    [
      icon('more', { size: 18 }),
      el('span', {}, t.tx.filterButton),
      activeCount > 0 ? el('span', { class: 'filter-count' }, String(activeCount)) : null,
    ]
  );

  const controls = el('div', { class: 'tx-controls' }, [
    el('div', { class: 'search-wrap' }, searchInput),
    filterBtn,
  ]);

  // Active-filter summary / clear
  const summaryRow =
    activeCount > 0 || filters.search
      ? el('div', { class: 'tx-filter-summary' }, [
          el('span', {}, t.tx.resultCount(list.length)),
          el(
            'button',
            { class: 'link-btn', onClick: () => store.clearTxFilters() },
            t.app.clear
          ),
        ])
      : el('div', { class: 'section-title' }, t.tx.resultCount(list.length));

  // ---- Grouped list ----
  let body;
  if (list.length === 0) {
    body = el('div', { class: 'empty' }, [
      el('div', {}, t.tx.emptyTitle),
      el('div', { style: 'font-size:0.85rem;margin-top:4px' }, t.tx.emptyHint),
    ]);
  } else {
    body = el(
      'div',
      { class: 'tx-groups' },
      groups.map((g) =>
        el('section', { class: 'tx-group' }, [
          el('div', { class: 'tx-group-head' }, g.label),
          el('ul', { class: 'tx-list' }, g.items.map((tx) => transactionRow(tx))),
        ])
      )
    );
  }

  container.append(controls, summaryRow, body);
}

/**
 * @param {import('../types.js').Transaction} tx
 * @returns {HTMLElement}
 */
function transactionRow(tx) {
  const walletLabel = tx.walletId ? store.walletName(tx.walletId) : '';
  const meta = [store.categoryName(tx.categoryId), walletLabel].filter(Boolean).join(' · ');
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
        { class: 'icon-btn', 'aria-label': t.tx.editAria, onClick: () => openTransactionForm(tx) },
        icon('edit', { size: 18 })
      ),
      el(
        'button',
        { class: 'icon-btn', 'aria-label': t.tx.deleteAria, onClick: () => confirmDelete(tx) },
        icon('trash', { size: 18 })
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

/** Open the advanced filter sheet (date range, wallet, category, type). */
function openFilterSheet() {
  const state = store.getState();
  const f = { ...state.txFilters };

  const content = el('div', { class: 'stack' });

  const fromInput = el('input', {
    type: 'date',
    value: f.from,
    onInput: (e) => (f.from = e.target.value),
  });
  const toInput = el('input', {
    type: 'date',
    value: f.to,
    onInput: (e) => (f.to = e.target.value),
  });

  const walletSelect = el(
    'select',
    { onChange: (e) => (f.walletId = e.target.value) },
    [
      el('option', { value: '', selected: !f.walletId }, t.tx.allWallets),
      ...state.wallets.map((w) =>
        el('option', { value: w.id, selected: w.id === f.walletId }, w.name)
      ),
    ]
  );

  const catSelect = el(
    'select',
    { onChange: (e) => (f.categoryId = e.target.value) },
    [
      el('option', { value: '', selected: !f.categoryId }, t.tx.allCategories),
      ...state.categories.map((c) =>
        el('option', { value: c.id, selected: c.id === f.categoryId }, store.categoryName(c.id))
      ),
    ]
  );

  const typeSelect = el(
    'select',
    { onChange: (e) => (f.type = e.target.value) },
    [
      el('option', { value: '', selected: !f.type }, t.tx.allTypes),
      el('option', { value: 'income', selected: f.type === 'income' }, t.tx.income),
      el('option', { value: 'expense', selected: f.type === 'expense' }, t.tx.expense),
    ]
  );

  function field(labelText, control) {
    return el('label', { class: 'field' }, [
      el('span', { class: 'field-label' }, labelText),
      control,
    ]);
  }

  content.append(
    el('div', { class: 'filter-bar' }, [
      field(t.tx.dateFrom, fromInput),
      field(t.tx.dateTo, toInput),
    ]),
    field(t.tx.filterWallet, walletSelect),
    field(t.tx.filterCategory, catSelect),
    field(t.tx.filterType, typeSelect),
    el('div', { class: 'btn-row' }, [
      el(
        'button',
        {
          class: 'btn ghost',
          onClick: () => {
            store.clearTxFilters();
            closeModal();
          },
        },
        t.tx.resetFilters
      ),
      el(
        'button',
        {
          class: 'btn primary',
          onClick: () => {
            store.setTxFilters({
              from: f.from,
              to: f.to,
              walletId: f.walletId,
              categoryId: f.categoryId,
              type: f.type,
            });
            closeModal();
          },
        },
        t.tx.applyFilters
      ),
    ])
  );

  openModal(t.tx.filterTitle, content);
}
