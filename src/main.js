// @ts-check
/**
 * App entry point: initializes the store, renders the shell (header, active
 * view, 5-tab bottom nav with elevated center "+" button, error toast), and
 * registers the service worker.
 */
import { el, render } from './lib/dom.js';
import * as store from './state/store.js';
import { t } from './lib/i18n.js';
import { icon } from './lib/icons.js';
import { renderBeranda } from './views/beranda.js';
import { renderWallets } from './views/wallets.js';
import { renderTransactions } from './views/transactions.js';
import { renderLainnya } from './views/lainnya.js';
import { renderBudget } from './views/budget.js';
import { renderAssets } from './views/assets.js';
import { renderDebts } from './views/debts.js';
import { openTransactionForm } from './views/transactionForm.js';

/**
 * Active view. Primary tabs: beranda | dompet | transaksi | lainnya.
 * Secondary sections (budget, aset, utang, investasi, laporan) are reached
 * from Lainnya and will be added in later phases.
 * @type {string}
 */
let activeView = 'beranda';

/** Views reachable from Lainnya that render with a back affordance. */
const SECONDARY = new Set(['budget', 'aset', 'utang', 'investasi', 'laporan']);

const root = /** @type {HTMLElement} */ (document.getElementById('app'));

function setView(view) {
  activeView = view;
  renderApp();
}

/** Map a view id to its header title. */
function headerTitle(view) {
  return t.header[view] || t.app.name;
}

function renderApp() {
  const state = store.getState();

  if (!state.loaded) {
    render(root, el('div', { class: 'loading' }, t.app.loading));
    return;
  }

  const isSecondary = SECONDARY.has(activeView);

  const header = el('header', { class: 'app-header' + (isSecondary ? ' with-back' : '') }, [
    isSecondary
      ? el(
          'button',
          {
            class: 'back-btn',
            onClick: () => setView('lainnya'),
            'aria-label': t.app.back,
          },
          [icon('chevronLeft', { size: 20 }), el('span', {}, t.app.back)]
        )
      : null,
    el('h1', {}, headerTitle(activeView)),
  ]);

  const main = el('main', { class: 'main', id: 'view-root' });
  renderActiveView(main);

  const nav = el('nav', { class: 'bottom-nav', 'aria-label': t.nav.beranda }, [
    navButton('beranda', 'home', t.nav.beranda),
    navButton('dompet', 'wallet', t.nav.dompet),
    fabButton(),
    navButton('transaksi', 'transactions', t.nav.transaksi),
    navButton('lainnya', 'more', t.nav.lainnya),
  ]);

  const children = [header, main, nav];

  if (state.error) {
    children.push(
      el('div', { class: 'toast', role: 'alert' }, [
        el('span', {}, state.error),
        el(
          'button',
          { onClick: () => store.clearError(), 'aria-label': t.app.dismiss },
          '✕'
        ),
      ])
    );
  }

  if (state.notice) {
    children.push(
      el('div', { class: 'notice', role: 'status' }, state.notice)
    );
  }

  render(root, children);
}

/** Render whichever view is active into the main container. */
function renderActiveView(main) {
  switch (activeView) {
    case 'beranda':
      renderBeranda(main);
      break;
    case 'dompet':
      renderWallets(main);
      break;
    case 'transaksi':
      renderTransactions(main);
      break;
    case 'lainnya':
      renderLainnya(main, setView);
      break;
    case 'budget':
      renderBudget(main);
      break;
    case 'aset':
      renderAssets(main);
      break;
    case 'utang':
      renderDebts(main);
      break;
    default:
      // Secondary sections not yet implemented in this phase.
      renderComingSoon(main);
  }
}

function renderComingSoon(main) {
  main.append(el('div', { class: 'empty' }, el('div', {}, t.lainnya.soon)));
}

/**
 * A bottom-nav tab button.
 * @param {string} view @param {import('./lib/icons.js').icon extends (n: infer N, ...a: any) => any ? N : string} iconName @param {string} label
 */
function navButton(view, iconName, label) {
  const active = activeView === view;
  return el(
    'button',
    {
      class: 'nav-btn' + (active ? ' active' : ''),
      onClick: () => setView(view),
      'aria-current': active ? 'page' : undefined,
    },
    [
      el('span', { class: 'icon', 'aria-hidden': 'true' }, icon(iconName, { size: 24 })),
      el('span', {}, label),
    ]
  );
}

/** The elevated central "+" action button (Req 13.1, 13.3). */
function fabButton() {
  return el(
    'button',
    {
      class: 'nav-fab',
      onClick: () => openTransactionForm(),
      'aria-label': t.nav.tambah,
    },
    icon('plus', { size: 28 })
  );
}

// Re-render whenever the store changes.
store.subscribe(renderApp);

// Boot.
store.init();
renderApp();

// Register the service worker (non-blocking, graceful failure) (Req 10.4, 10.5).
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch((err) => {
      console.warn('Service worker registration failed:', err);
    });
  });
}
