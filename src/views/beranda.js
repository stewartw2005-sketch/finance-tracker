// @ts-check
/**
 * Beranda (home). Phase 1 gave a basic month summary; this adds the
 * "Sekilas Hari Ini" glance card (budget harian yang tersisa + income/expense
 * with a progress bar). The daily-budget figure becomes live once budgets
 * exist (Phase 4); until then it shows a friendly fallback. The full Dashboard
 * (greeting, calendar heatmap, etc.) arrives in Phase 9.
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
  const total = store.totalSaldo();

  container.append(
    totalSaldoCard(total),
    glanceCard(summary),
    el('div', { class: 'section-title' }, t.beranda.ringkasanBulan),
    el('label', { class: 'field', style: 'margin-bottom:16px' }, [
      el('span', { class: 'field-label' }, t.dashboard.month),
      monthSelect(),
    ]),
    monthSummaryGrid(month, summary)
  );
}

/**
 * Total saldo across all wallets (Req 14.3, 22.11).
 * @param {number} total
 * @returns {HTMLElement}
 */
function totalSaldoCard(total) {
  return el('div', { class: 'saldo-card' }, [
    el('div', { class: 'saldo-label' }, t.wallet.totalSaldo),
    el(
      'div',
      { class: 'saldo-value' + (total < 0 ? ' negative' : '') },
      money(total)
    ),
  ]);
}

/**
 * "Sekilas Hari Ini" glance card (matches the requested design).
 * @param {import('../types.js').MonthlySummary} summary
 * @returns {HTMLElement}
 */
function glanceCard(summary) {
  // Daily remaining budget becomes live in Phase 4 (needs budget data).
  const dailyRemaining = store.dailyBudgetRemaining
    ? store.dailyBudgetRemaining()
    : null;
  const hasBudget = dailyRemaining != null && Number.isFinite(dailyRemaining);

  // Progress: expenses relative to income for the month (clamped 0–100%).
  const ratio =
    summary.totalIncome > 0
      ? Math.min(1, summary.totalExpenses / summary.totalIncome)
      : summary.totalExpenses > 0
      ? 1
      : 0;
  const over = summary.totalIncome > 0 && summary.totalExpenses > summary.totalIncome;

  return el('div', { class: 'glance-card' }, [
    // Header label with a spark icon
    el('div', { class: 'glance-label' }, [
      el('span', { 'aria-hidden': 'true' }, '⚡'),
      el('span', {}, t.beranda.sekilasHariIni),
    ]),

    // Big daily-budget amount + lock icon
    el('div', { class: 'glance-amount-row' }, [
      el(
        'span',
        { class: 'glance-amount' + (hasBudget ? '' : ' muted') },
        hasBudget ? money(dailyRemaining) : t.beranda.budgetBelumDiatur
      ),
      hasBudget ? el('span', { class: 'glance-lock', 'aria-hidden': 'true' }, '🔒') : null,
    ]),

    // Caption
    el('div', { class: 'glance-caption' }, [
      el('span', { 'aria-hidden': 'true' }, '👆'),
      el('span', {}, t.beranda.budgetHarianTersisa),
    ]),

    // Income / expense columns
    el('div', { class: 'glance-io' }, [
      el('div', { class: 'glance-io-col' }, [
        el('div', { class: 'glance-io-label' }, t.beranda.pemasukan),
        el('div', { class: 'glance-io-val income' }, money(summary.totalIncome)),
      ]),
      el('div', { class: 'glance-io-col' }, [
        el('div', { class: 'glance-io-label' }, t.beranda.pengeluaran),
        el('div', { class: 'glance-io-val expense' }, money(summary.totalExpenses)),
      ]),
    ]),

    // Progress bar
    el(
      'div',
      { class: 'glance-progress', role: 'progressbar' },
      el('div', {
        class: 'glance-progress-fill' + (over ? ' over' : ''),
        style: `width:${Math.round(ratio * 100)}%`,
      })
    ),
  ]);
}

/**
 * @param {string} month
 * @param {import('../types.js').MonthlySummary} summary
 * @returns {HTMLElement}
 */
function monthSummaryGrid(month, summary) {
  const netClass = summary.net < 0 ? 'negative' : summary.net > 0 ? 'positive' : '';
  return el('div', { class: 'summary-grid' }, [
    summaryCard(t.dashboard.income, money(summary.totalIncome), 'income'),
    summaryCard(t.dashboard.expenses, money(summary.totalExpenses), 'expense'),
    el('div', { class: 'summary-card net' }, [
      el('div', { class: 'label' }, t.dashboard.netForMonth(formatMonthLabel(month))),
      el('div', { class: 'value ' + netClass }, money(summary.net)),
    ]),
  ]);
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
