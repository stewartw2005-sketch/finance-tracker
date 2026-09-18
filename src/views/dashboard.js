// @ts-check
/**
 * Dashboard view (Req 6, 7): month selector, summary cards (income, expenses,
 * net with negative styling), and the spending-by-category chart.
 */
import { el } from '../lib/dom.js';
import * as store from '../state/store.js';
import { money } from '../lib/format.js';
import { formatMonthLabel } from '../lib/dates.js';
import { monthSelect } from './monthSelect.js';
import { spendingChart } from './chart.js';

/**
 * Render the dashboard into the given container.
 * @param {HTMLElement} container
 */
export function renderDashboard(container) {
  const month = store.getState().selectedMonth;
  const summary = store.selectMonthlySummary(month);
  const spending = store.selectSpendingByCategory(month);

  const monthRow = el('label', { class: 'field', style: 'margin-bottom:16px' }, [
    el('span', { class: 'field-label' }, 'Month'),
    monthSelect(),
  ]);

  const netClass = summary.net < 0 ? 'negative' : summary.net > 0 ? 'positive' : '';

  const summaryGrid = el('div', { class: 'summary-grid' }, [
    summaryCard('Income', money(summary.totalIncome), 'income'),
    summaryCard('Expenses', money(summary.totalExpenses), 'expense'),
    el('div', { class: 'summary-card net' }, [
      el('div', { class: 'label' }, `Net balance — ${formatMonthLabel(month)}`),
      el('div', { class: 'value ' + netClass }, money(summary.net)),
    ]),
  ]);

  container.append(
    monthRow,
    summaryGrid,
    el('div', { class: 'section-title' }, 'Spending by category'),
    el('div', { class: 'card' }, spendingChart(spending))
  );
}

/**
 * @param {string} label @param {string} value @param {string} valueClass
 * @returns {HTMLElement}
 */
function summaryCard(label, value, valueClass) {
  return el('div', { class: 'summary-card' }, [
    el('div', { class: 'label' }, label),
    el('div', { class: 'value ' + valueClass }, value),
  ]);
}
