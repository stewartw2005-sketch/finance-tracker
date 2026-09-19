// @ts-check
/**
 * Atur Budget (Req 16). Set expected monthly income, choose a method
 * (percentage 50/30/20 or fixed per-category), assign categories to groups,
 * and see per-category progress bars. Live-updates the store.
 * @typedef {import('../types.js').BudgetGroup} BudgetGroup
 */
import { el } from '../lib/dom.js';
import * as store from '../state/store.js';
import { money, parseAmount } from '../lib/format.js';
import { t } from '../lib/i18n.js';

/** Budget groups in display order. */
const GROUPS = /** @type {BudgetGroup[]} */ (['needs', 'wants', 'savings']);

/** Local draft of the group sliders (percentage mode), kept between renders. */
let sliderDraft = null;

/**
 * Render the Atur Budget view.
 * @param {HTMLElement} container
 */
export function renderBudget(container) {
  const budget = store.getBudget();
  // Re-sync the slider draft from stored groups on each full view render.
  // (During slider drags only the sliders subtree re-renders, so the draft
  // persists within an editing session.)
  sliderDraft = { ...budget.groups };
  // Spending categories exclude the special "income" default.
  const spendingCats = store.getState().categories.filter((c) => c.id !== 'income');

  container.append(
    incomeCard(budget),
    methodToggle(budget),
    budget.method === 'percentage'
      ? percentageSection(budget, spendingCats)
      : fixedSection(spendingCats),
    progressSection()
  );
}

/** Expected monthly income input. */
function incomeCard(budget) {
  const input = el('input', {
    type: 'number',
    inputmode: 'numeric',
    step: '1',
    min: '0',
    value: budget.monthlyIncome ? String(budget.monthlyIncome) : '',
    placeholder: t.tx.amountPlaceholder,
    onChange: (e) => store.setMonthlyIncome(parseAmount(e.target.value) || 0),
  });
  return el('div', { class: 'card' }, [
    el('label', { class: 'field', style: 'margin-bottom:0' }, [
      el('span', { class: 'field-label' }, t.budget.monthlyIncome),
      input,
      el('span', { class: 'field-hint' }, t.budget.monthlyIncomeHint),
    ]),
  ]);
}

/** Percentage / fixed method toggle (segmented). */
function methodToggle(budget) {
  const btn = (method, label) =>
    el(
      'button',
      {
        type: 'button',
        class: budget.method === method ? 'active' : '',
        dataset: { type: method === 'percentage' ? 'income' : 'expense' },
        onClick: () => {
          if (budget.method !== method) store.setBudgetMethod(method);
        },
      },
      label
    );
  return el('div', { style: 'margin:14px 0' }, [
    el('div', { class: 'field-label', style: 'margin-bottom:6px' }, t.budget.method),
    el('div', { class: 'segmented' }, [
      btn('percentage', t.budget.methodPercentage),
      btn('fixed', t.budget.methodFixed),
    ]),
  ]);
}

/** Percentage mode: 3 sliders + category→group assignment. */
function percentageSection(budget, spendingCats) {
  const draft = sliderDraft;
  const wrap = el('div', { class: 'card' });

  function rebuild() {
    wrap.textContent = '';
    const rows = GROUPS.map((g) => sliderRow(g));
    const totalNode = el(
      'div',
      { class: 'budget-total' + (validNow() ? '' : ' invalid') },
      t.budget.total(currentTotal())
    );
    const saveBtn = el(
      'button',
      {
        class: 'btn primary full',
        disabled: validNow() ? undefined : true,
        onClick: () => {
          if (!validNow()) return;
          store.setGroupPercents({ ...draft });
        },
      },
      t.app.save
    );

    wrap.append(
      el('div', { class: 'section-title', style: 'margin-top:0' }, t.budget.groupsTitle),
      ...rows,
      totalNode,
      validNow() ? null : el('div', { class: 'field-error' }, t.budget.mustTotal100),
      saveBtn
    );
  }

  function currentTotal() {
    return draft.needs + draft.wants + draft.savings;
  }
  function validNow() {
    return currentTotal() === 100;
  }

  function sliderRow(g) {
    const label =
      g === 'needs' ? t.budget.needs : g === 'wants' ? t.budget.wants : t.budget.savings;
    const range = el('input', {
      type: 'range',
      min: '0',
      max: '100',
      step: '5',
      value: String(draft[g]),
      class: 'budget-slider',
      onInput: (e) => {
        draft[g] = parseInt(e.target.value, 10) || 0;
        rebuild();
      },
    });
    const rupiah = Math.round((draft[g] / 100) * (budget.monthlyIncome || 0));
    return el('div', { class: 'budget-slider-row' }, [
      el('div', { class: 'budget-slider-head' }, [
        el('span', { class: 'budget-slider-label' }, label),
        el('span', { class: 'budget-slider-val' }, `${draft[g]}% · ${money(rupiah)}`),
      ]),
      range,
    ]);
  }

  rebuild();

  return el('div', {}, [
    wrap,
    assignSection(spendingCats),
  ]);
}

/** Category → group assignment (percentage mode). */
function assignSection(spendingCats) {
  const list = el(
    'ul',
    { class: 'assign-list' },
    spendingCats.map((c) => {
      const select = el(
        'select',
        {
          'aria-label': store.categoryName(c.id),
          onChange: (e) => store.setCategoryGroup(c.id, e.target.value),
        },
        [
          el('option', { value: '', selected: !c.budgetGroup }, t.budget.noGroup),
          el('option', { value: 'needs', selected: c.budgetGroup === 'needs' }, t.budget.needs),
          el('option', { value: 'wants', selected: c.budgetGroup === 'wants' }, t.budget.wants),
          el('option', { value: 'savings', selected: c.budgetGroup === 'savings' }, t.budget.savings),
        ]
      );
      return el('li', { class: 'assign-item' }, [
        el('span', { class: 'assign-name' }, store.categoryName(c.id)),
        select,
      ]);
    })
  );
  return el('div', {}, [
    el('div', { class: 'section-title' }, t.budget.assignTitle),
    el('div', { class: 'field-hint', style: 'margin-bottom:10px' }, t.budget.assignHint),
    list,
  ]);
}

/** Fixed mode: per-category amount inputs. */
function fixedSection(spendingCats) {
  const budget = store.getBudget();
  const list = el(
    'ul',
    { class: 'assign-list' },
    spendingCats.map((c) => {
      const input = el('input', {
        type: 'number',
        inputmode: 'numeric',
        step: '1',
        min: '0',
        value: budget.fixedByCategory[c.id] ? String(budget.fixedByCategory[c.id]) : '',
        placeholder: t.tx.amountPlaceholder,
        onChange: (e) => store.setFixedBudget(c.id, parseAmount(e.target.value) || 0),
      });
      return el('li', { class: 'assign-item' }, [
        el('span', { class: 'assign-name' }, store.categoryName(c.id)),
        el('div', { style: 'flex:1;max-width:160px' }, input),
      ]);
    })
  );
  return el('div', {}, [
    el('div', { class: 'section-title' }, t.budget.perCategoryFixed),
    el('div', { class: 'field-hint', style: 'margin-bottom:10px' }, t.budget.perCategoryFixedHint),
    list,
  ]);
}

/** Per-category progress bars for the current month. */
function progressSection() {
  const rows = store.budgetProgress();
  const body = rows.length
    ? el(
        'div',
        { class: 'progress-list' },
        rows.map((r) => progressRow(r))
      )
    : el('div', { class: 'empty' }, [
        el('div', {}, t.budget.noBudgetTitle),
        el('div', { style: 'font-size:0.85rem;margin-top:4px' }, t.budget.noBudgetHint),
      ]);
  return el('div', {}, [
    el('div', { class: 'section-title' }, t.budget.progressTitle),
    body,
  ]);
}

/** @param {ReturnType<typeof store.budgetProgress>[number]} r */
function progressRow(r) {
  const width = r.limit > 0 ? Math.min(100, Math.round((r.spent / r.limit) * 100)) : 0;
  return el('div', { class: 'progress-item' }, [
    el('div', { class: 'progress-head' }, [
      el('span', { class: 'progress-name' }, r.categoryName),
      el(
        'span',
        { class: 'progress-vals' + (r.over ? ' over' : '') },
        r.limit > 0 ? t.budget.spentOf(money(r.spent), money(r.limit)) : money(r.spent)
      ),
    ]),
    el(
      'div',
      { class: 'progress-track' },
      el('div', {
        class: 'progress-fill' + (r.over ? ' over' : ''),
        style: `width:${width}%`,
      })
    ),
    r.over ? el('div', { class: 'progress-over' }, t.budget.overBudget) : null,
  ]);
}
