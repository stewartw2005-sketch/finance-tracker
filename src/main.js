// @ts-check
/**
 * App entry point: initializes the store, renders the shell (header, active
 * view, bottom nav, FAB, error toast), and registers the service worker.
 */
import { el, render } from './lib/dom.js';
import * as store from './state/store.js';
import { renderDashboard } from './views/dashboard.js';
import { renderTransactions } from './views/transactions.js';
import { openTransactionForm } from './views/transactionForm.js';
import { openCategoryManager } from './views/categoryManager.js';

/** @type {'dashboard'|'transactions'} */
let activeView = 'dashboard';

const root = /** @type {HTMLElement} */ (document.getElementById('app'));

function setView(view) {
  activeView = view;
  renderApp();
}

function renderApp() {
  const state = store.getState();

  if (!state.loaded) {
    render(root, el('div', { class: 'loading' }, 'Loading…'));
    return;
  }

  const header = el('header', { class: 'app-header' }, [
    el('h1', {}, activeView === 'dashboard' ? 'Dashboard' : 'Transactions'),
    el(
      'button',
      {
        class: 'link-btn',
        onClick: () => openCategoryManager(),
        'aria-label': 'Manage categories',
      },
      'Categories'
    ),
  ]);

  const main = el('main', { class: 'main', id: 'view-root' });
  if (activeView === 'dashboard') renderDashboard(main);
  else renderTransactions(main);

  const nav = el('nav', { class: 'bottom-nav' }, [
    navButton('dashboard', '📊', 'Dashboard'),
    navButton('transactions', '📃', 'Transactions'),
  ]);

  const fab = el(
    'button',
    {
      class: 'fab',
      onClick: () => openTransactionForm(),
      'aria-label': 'Add transaction',
    },
    '+'
  );

  const children = [header, main, nav, fab];

  if (state.error) {
    children.push(
      el('div', { class: 'toast', role: 'alert' }, [
        el('span', {}, state.error),
        el(
          'button',
          { onClick: () => store.clearError(), 'aria-label': 'Dismiss' },
          '✕'
        ),
      ])
    );
  }

  render(root, children);
}

function navButton(view, icon, label) {
  return el(
    'button',
    {
      class: 'nav-btn' + (activeView === view ? ' active' : ''),
      onClick: () => setView(view),
      'aria-current': activeView === view ? 'page' : undefined,
    },
    [el('span', { class: 'icon', 'aria-hidden': 'true' }, icon), el('span', {}, label)]
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
