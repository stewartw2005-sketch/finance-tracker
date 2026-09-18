// @ts-check
/**
 * Beranda (home) — placeholder for Phase 1. Shows the current month's
 * income/expenses/net summary. The full Dashboard (greeting, daily budget,
 * calendar heatmap, etc.) is built in Phase 9 once its data sources exist.
 */
import { el } from '../lib/dom.js';
import * as store from '../state/store.js';
import { money } from '../lib/format.js';
import { formatMonthLabel } from '../lib/dates.js';
import { t } from '../lib/i18n.js';
import { monthSelect } from './monthSelect.js';

/**
 * Render the Beranda into the given container.
 * @param {HTMLElement} container
 */
export function renderBeranda(container) {
  const month = store.getState().selectedMonth;
  const summary = store.selectMonthlySummary(month);
  const netClass = summary.net < 0 ? 'negative' : summary.net > 0 ? 'positive' : '';

  const monthRow = el('label', { class: 'field', style: 'margin-bottom:16px' }, [
    el('span', { class: 'field-label' }, t.dashboard.month),
    monthSelect(),
  ]);

  const summaryGrid = el('div', { class: 'summary-grid' }, [
    summaryCard(t.dashboard.income, money(summary.totalIncome), 'income'),
    summaryCard(t.dashboard.expenses, money(summary.totalExpenses), 'expense'),
    el('div', { class: 'summary-card net' }, [
      el('div', { class: 'label' }, t.dashboard.netForMonth(formatMonthLabel(month))),
      el('div', { class: 'value ' + netClass }, money(summary.net)),
    ]),
  ]);

  container.append(
    el('div', { class: 'section-title' }, t.beranda.ringkasanBulan),
    monthRow,
    summaryGrid
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
