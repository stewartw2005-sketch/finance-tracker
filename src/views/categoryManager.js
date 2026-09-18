// @ts-check
/**
 * Category manager (Req 5): list categories, add custom (reject duplicates),
 * delete custom only (with in-use confirmation); defaults protected.
 */
import { el } from '../lib/dom.js';
import { openModal, confirmDialog } from './modal.js';
import * as store from '../state/store.js';
import { categoryNameExists } from '../lib/validation.js';
import { t } from '../lib/i18n.js';

export function openCategoryManager() {
  const content = el('div', { class: 'stack' });

  function rebuild() {
    content.textContent = '';
    const categories = store.getState().categories.slice().sort((a, b) => {
      if (a.isDefault !== b.isDefault) return a.isDefault ? -1 : 1;
      return store.categoryName(a.id).localeCompare(store.categoryName(b.id));
    });

    // Add form
    let inputValue = '';
    let error = '';
    const input = el('input', {
      type: 'text',
      placeholder: t.category.newNamePlaceholder,
      'aria-label': t.category.newNameAria,
      onInput: (e) => {
        inputValue = e.target.value;
      },
    });
    const errorNode = el('span', { class: 'field-error' }, '');

    function submitAdd() {
      const name = inputValue.trim();
      error = '';
      if (!name) {
        error = t.category.nameRequired;
      } else if (categoryNameExists(name, store.getState().categories)) {
        error = t.category.duplicate;
      }
      if (error) {
        errorNode.textContent = error;
        input.classList.add('invalid');
        return;
      }
      store.addCategory(name).then(() => {
        inputValue = '';
        rebuild();
      });
    }

    const addForm = el('form', { class: 'field', onSubmit: (e) => { e.preventDefault(); submitAdd(); } }, [
      el('span', { class: 'field-label' }, t.category.addLabel),
      el('div', { class: 'filter-bar' }, [
        input,
        el('button', { type: 'submit', class: 'btn primary' }, t.app.add),
      ]),
      errorNode,
    ]);

    // List
    const listNode = el(
      'ul',
      { class: 'cat-list' },
      categories.map((c) => {
        const inUse = store.countTransactionsForCategory(c.id);
        const displayName = store.categoryName(c.id);
        return el('li', { class: 'cat-item' }, [
          el('span', { class: 'cat-name' }, displayName),
          c.isDefault
            ? el('span', { class: 'badge' }, t.category.defaultBadge)
            : el(
                'button',
                {
                  class: 'icon-btn',
                  'aria-label': t.category.deleteAria(displayName),
                  onClick: () => deleteCategory(c, inUse, rebuild),
                },
                '🗑️'
              ),
        ]);
      })
    );

    content.append(
      addForm,
      el('div', { class: 'section-title', style: 'margin-top:6px' }, t.category.yourCategories),
      listNode
    );
  }

  rebuild();
  openModal(t.category.title, content);
}

/**
 * @param {import('../types.js').Category} c
 * @param {number} inUse
 * @param {() => void} rebuild
 */
function deleteCategory(c, inUse, rebuild) {
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
