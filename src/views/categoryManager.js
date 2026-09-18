// @ts-check
/**
 * Category manager (Req 5): list categories, add custom (reject duplicates),
 * delete custom only (with in-use confirmation); defaults protected.
 */
import { el } from '../lib/dom.js';
import { openModal, confirmDialog } from './modal.js';
import * as store from '../state/store.js';
import { categoryNameExists } from '../lib/validation.js';

export function openCategoryManager() {
  const content = el('div', { class: 'stack' });

  function rebuild() {
    content.textContent = '';
    const categories = store.getState().categories.slice().sort((a, b) => {
      if (a.isDefault !== b.isDefault) return a.isDefault ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

    // Add form
    let inputValue = '';
    let error = '';
    const input = el('input', {
      type: 'text',
      placeholder: 'New category name',
      'aria-label': 'New category name',
      onInput: (e) => {
        inputValue = e.target.value;
      },
    });
    const errorNode = el('span', { class: 'field-error' }, '');

    function submitAdd() {
      const name = inputValue.trim();
      error = '';
      if (!name) {
        error = 'Enter a category name.';
      } else if (categoryNameExists(name, store.getState().categories)) {
        error = 'That category already exists.';
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
      el('span', { class: 'field-label' }, 'Add a category'),
      el('div', { class: 'filter-bar' }, [
        input,
        el('button', { type: 'submit', class: 'btn primary' }, 'Add'),
      ]),
      errorNode,
    ]);

    // List
    const listNode = el(
      'ul',
      { class: 'cat-list' },
      categories.map((c) => {
        const inUse = store.countTransactionsForCategory(c.id);
        return el('li', { class: 'cat-item' }, [
          el('span', { class: 'cat-name' }, c.name),
          c.isDefault
            ? el('span', { class: 'badge' }, 'Default')
            : el(
                'button',
                {
                  class: 'icon-btn',
                  'aria-label': `Delete ${c.name}`,
                  onClick: () => deleteCategory(c, inUse, rebuild),
                },
                '🗑️'
              ),
        ]);
      })
    );

    content.append(
      addForm,
      el('div', { class: 'section-title', style: 'margin-top:6px' }, 'Your categories'),
      listNode
    );
  }

  rebuild();
  openModal('Categories', content);
}

/**
 * @param {import('../types.js').Category} c
 * @param {number} inUse
 * @param {() => void} rebuild
 */
function deleteCategory(c, inUse, rebuild) {
  const doDelete = () => store.removeCategory(c.id).then(rebuild);
  if (inUse > 0) {
    confirmDialog({
      title: 'Delete category?',
      message: `"${c.name}" is used by ${inUse} transaction${
        inUse === 1 ? '' : 's'
      }. Those transactions will keep their category but you won't be able to pick it again. Delete anyway?`,
      confirmLabel: 'Delete',
      onConfirm: doDelete,
    });
  } else {
    confirmDialog({
      title: 'Delete category?',
      message: `Delete "${c.name}"?`,
      confirmLabel: 'Delete',
      onConfirm: doDelete,
    });
  }
}
