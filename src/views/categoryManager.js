// @ts-check
/**
 * Category manager: list categories grouped by kind (Pemasukan/Pengeluaran),
 * add custom (reject duplicates, pick kind), and delete any category —
 * including defaults — with an in-use confirmation.
 */
import { el } from '../lib/dom.js';
import { openModal, confirmDialog } from './modal.js';
import * as store from '../state/store.js';
import { categoryNameExists } from '../lib/validation.js';
import { t } from '../lib/i18n.js';
import { icon } from '../lib/icons.js';

export function openCategoryManager() {
  const content = el('div', { class: 'stack' });

  // Add-form state (kept across rebuilds within this session).
  let inputValue = '';
  /** @type {import('../types.js').TxType} */
  let addKind = 'expense';

  function rebuild() {
    content.textContent = '';

    const input = el('input', {
      type: 'text',
      value: inputValue,
      placeholder: t.category.newNamePlaceholder,
      'aria-label': t.category.newNameAria,
      onInput: (e) => {
        inputValue = e.target.value;
      },
    });
    const errorNode = el('span', { class: 'field-error' }, '');

    // Kind picker (income/expense) for the new category.
    const kindSeg = el('div', { class: 'segmented', role: 'group', 'aria-label': t.tx.type }, [
      kindButton('expense', t.tx.expense),
      kindButton('income', t.tx.income),
    ]);
    function kindButton(k, label) {
      return el(
        'button',
        {
          type: 'button',
          dataset: { type: k },
          class: addKind === k ? 'active' : '',
          onClick: () => {
            addKind = k;
            rebuild();
          },
        },
        label
      );
    }

    function submitAdd() {
      const name = inputValue.trim();
      let error = '';
      if (!name) error = t.category.nameRequired;
      else if (categoryNameExists(name, store.getState().categories)) error = t.category.duplicate;
      if (error) {
        errorNode.textContent = error;
        input.classList.add('invalid');
        return;
      }
      store.addCategory(name, addKind).then(() => {
        inputValue = '';
        rebuild();
      });
    }

    const addForm = el('form', { class: 'field', onSubmit: (e) => { e.preventDefault(); submitAdd(); } }, [
      el('span', { class: 'field-label' }, t.category.addLabel),
      kindSeg,
      el('div', { class: 'filter-bar', style: 'margin-top:8px' }, [
        input,
        el('button', { type: 'submit', class: 'btn primary' }, t.app.add),
      ]),
      errorNode,
    ]);

    content.append(
      addForm,
      kindGroup('expense', t.tx.expense),
      kindGroup('income', t.tx.income)
    );
  }

  /** A titled list of categories of one kind. */
  function kindGroup(kind, title) {
    const cats = store
      .categoriesByKind(kind)
      .slice()
      .sort((a, b) => store.categoryName(a.id).localeCompare(store.categoryName(b.id)));
    const listNode = el(
      'ul',
      { class: 'cat-list' },
      cats.map((c) => {
        const displayName = store.categoryName(c.id);
        return el('li', { class: 'cat-item' }, [
          el('span', { class: 'cat-name' }, displayName),
          c.isDefault ? el('span', { class: 'badge' }, t.category.defaultBadge) : null,
          el(
            'button',
            {
              class: 'icon-btn',
              'aria-label': t.category.deleteAria(displayName),
              onClick: () => deleteCategory(c, rebuild),
            },
            icon('trash', { size: 18 })
          ),
        ]);
      })
    );
    return el('div', { class: 'cat-group' }, [
      el('div', { class: 'cat-group-title ' + kind }, title),
      cats.length
        ? listNode
        : el('div', { class: 'field-hint', style: 'margin-bottom:4px' }, t.category.emptyKind),
    ]);
  }

  rebuild();
  openModal(t.category.title, content);
}

/**
 * @param {import('../types.js').Category} c
 * @param {() => void} rebuild
 */
function deleteCategory(c, rebuild) {
  const inUse = store.countTransactionsForCategory(c.id);
  const doDelete = () => store.removeCategory(c.id).then(rebuild);
  const displayName = store.categoryName(c.id);
  confirmDialog({
    title: t.category.deleteTitle,
    message:
      inUse > 0
        ? t.category.deleteMsgInUse(displayName, inUse)
        : t.category.deleteMsgSimple(displayName),
    confirmLabel: t.app.delete,
    onConfirm: doDelete,
  });
}
