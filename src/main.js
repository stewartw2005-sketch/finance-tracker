// @ts-check
/**
 * App entry point: initializes the store, renders the shell (header, active
 * view, 5-tab bottom nav with elevated center "+" button, error toast), and
 * registers the service worker.
 */
import { el, render } from './lib/dom.js';
import * as store from './state/store.js';
import { t, setLanguage, currentLang } from './lib/i18n.js';
import { icon } from './lib/icons.js';
import { renderBeranda } from './views/beranda.js';
import { renderWallets } from './views/wallets.js';
import { renderTransactions } from './views/transactions.js';
import { renderLainnya } from './views/lainnya.js';
import { renderBudget } from './views/budget.js';
import { renderAssets } from './views/assets.js';
import { renderDebts } from './views/debts.js';
import { renderInvestments } from './views/investments.js';
import { renderLaporan } from './views/laporan.js';
import { renderCategoryManager } from './views/categoryManager.js';
import { openTransactionForm } from './views/transactionForm.js';

/**
 * Active view. Primary tabs: beranda | dompet | transaksi | lainnya.
 * Secondary sections (budget, aset, utang, investasi, laporan) are reached
 * from Lainnya and will be added in later phases.
 * @type {string}
 */
let activeView = 'beranda';

/** Views reachable from Lainnya that render with a back affordance. */
const SECONDARY = new Set(['budget', 'aset', 'utang', 'investasi', 'laporan', 'kategori']);

const root = /** @type {HTMLElement} */ (document.getElementById('app'));

// ---- Theme (light / dark) -------------------------------------------------

const THEME_LS_KEY = 'appTheme';

/** Read the persisted theme, defaulting to dark. @returns {'dark'|'light'} */
function initialTheme() {
  try {
    const v = localStorage.getItem(THEME_LS_KEY);
    if (v === 'light' || v === 'dark') return v;
  } catch {
    /* ignore */
  }
  return 'dark';
}

/** @type {'dark'|'light'} */
let currentTheme = initialTheme();

/** Apply the theme to <html> (data-theme) and sync the browser theme-color. */
function applyTheme() {
  const html = document.documentElement;
  if (currentTheme === 'light') html.setAttribute('data-theme', 'light');
  else html.removeAttribute('data-theme');
  // Keep the iOS status-bar / browser chrome color in step with the theme.
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', currentTheme === 'light' ? '#f4f5f7' : '#000000');
}

/** Toggle between light and dark, persist, and re-render. */
function toggleTheme() {
  currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
  try {
    localStorage.setItem(THEME_LS_KEY, currentTheme);
  } catch {
    /* ignore */
  }
  applyTheme();
  renderApp();
}

/** Toggle UI language (id <-> en), persist (handled in i18n), and re-render. */
function toggleLanguage() {
  setLanguage(currentLang === 'id' ? 'en' : 'id');
  renderApp();
}

// ---- Per-view scroll memory ----------------------------------------------
// The whole window scrolls (there's no per-view scroll container), so without
// this every view would share one scroll position. We remember each view's
// scrollY and restore it when returning, so e.g. Home and Transaksi keep
// their own independent scroll positions.
/** @type {Record<string, number>} */
const scrollPositions = {};

/** Save the current window scroll under the currently active view. */
function saveScroll() {
  scrollPositions[activeView] = window.scrollY || window.pageYOffset || 0;
}

/**
 * Restore the saved scroll for the active view (0 if none). Done after render,
 * on the next frame so layout is in place first.
 * @param {number} [forced] - if given, scroll to exactly this position
 */
function restoreScroll(forced) {
  const y = forced != null ? forced : scrollPositions[activeView] || 0;
  // Two rAFs: let the new DOM lay out before scrolling.
  requestAnimationFrame(() => {
    requestAnimationFrame(() => window.scrollTo(0, y));
  });
}

/**
 * Switch views. Saves the outgoing view's scroll and restores the incoming
 * view's scroll. Pass `{ toTop: true }` to force the new view to the top.
 * @param {string} view
 * @param {{ toTop?: boolean }} [opts]
 */
function setView(view, opts = {}) {
  saveScroll();
  if (opts.toTop) scrollPositions[view] = 0;
  activeView = view;
  renderApp();
  restoreScroll();
}

/**
 * Bottom-nav tap on a primary tab. If already on that tab, scroll to the top
 * (common app convention). Otherwise switch to it and restore its scroll —
 * except Home and Transaksi, which the user wants to always open at the top.
 * @param {string} view
 */
function tapPrimaryTab(view) {
  const alwaysTop = view === 'beranda' || view === 'transaksi';
  if (activeView === view) {
    // Re-tapping the current tab: jump to top.
    scrollPositions[view] = 0;
    restoreScroll(0);
    return;
  }
  setView(view, { toTop: alwaysTop });
}

/**
 * Handle a tap on the "Lainnya" bottom-nav tab. Per the latest preference,
 * this always goes to the Lainnya hub (even from inside a sub-feature).
 */
function openLainnyaTab() {
  if (activeView === 'lainnya') {
    scrollPositions['lainnya'] = 0;
    restoreScroll(0);
    return;
  }
  setView('lainnya', { toTop: true });
}

/** Go back from a secondary view to the Lainnya hub (clears memory). */
function backToLainnya() {
  setView('lainnya', { toTop: true });
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

  // Theme + language toggles appear only on the primary tabs (Beranda, Dompet,
  // Transaksi, Lainnya). On the Lainnya sub-pages they're hidden so the
  // "Kembali" button stays cleanly on the left.
  const themeToggle = isSecondary
    ? null
    : el(
        'button',
        {
          class: 'header-toggle theme-toggle',
          type: 'button',
          onClick: () => toggleTheme(),
          'aria-label': currentTheme === 'dark' ? t.settings.toggleThemeToLight : t.settings.toggleThemeToDark,
          title: currentTheme === 'dark' ? t.settings.themeLight : t.settings.themeDark,
        },
        icon(currentTheme === 'dark' ? 'sun' : 'moon', { size: 20 })
      );

  const langToggle = isSecondary
    ? null
    : el(
        'button',
        {
          class: 'header-toggle lang-toggle',
          type: 'button',
          onClick: () => toggleLanguage(),
          'aria-label': t.settings.toggleLanguage,
          title: t.settings.language,
        },
        el('span', { class: 'lang-code' }, currentLang === 'id' ? 'ID' : 'EN')
      );

  const headerLeft = el('div', { class: 'header-left' }, [
    themeToggle,
    isSecondary
      ? el(
          'button',
          {
            class: 'back-btn',
            onClick: () => backToLainnya(),
            'aria-label': t.app.back,
          },
          [icon('chevronLeft', { size: 20 }), el('span', {}, t.app.back)]
        )
      : null,
  ]);

  const header = el('header', { class: 'app-header' + (isSecondary ? ' with-back' : '') }, [
    headerLeft,
    el('h1', {}, headerTitle(activeView)),
    el('div', { class: 'header-right' }, [langToggle]),
  ]);

  const main = el('main', { class: 'main', id: 'view-root' });
  renderActiveView(main);

  const nav = el('nav', { class: 'bottom-nav', 'aria-label': t.nav.beranda }, [
    // Home & Transaksi: tapping scrolls to the top (and opens at top); each
    // tab keeps its own independent scroll position otherwise.
    navButton('beranda', 'home', t.nav.beranda, { onClick: () => tapPrimaryTab('beranda') }),
    navButton('dompet', 'wallet', t.nav.dompet, { onClick: () => tapPrimaryTab('dompet') }),
    fabButton(),
    navButton('transaksi', 'transactions', t.nav.transaksi, { onClick: () => tapPrimaryTab('transaksi') }),
    // Lainnya tab: active for the hub AND any of its sub-features; tapping it
    // always returns to the Lainnya hub.
    navButton('lainnya', 'more', t.nav.lainnya, {
      active: activeView === 'lainnya' || isSecondary,
      onClick: openLainnyaTab,
    }),
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
      renderBeranda(main, setView);
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
    case 'investasi':
      renderInvestments(main);
      break;
    case 'laporan':
      renderLaporan(main);
      break;
    case 'kategori':
      renderCategoryManager(main);
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
function navButton(view, iconName, label, opts = {}) {
  const active = opts.active != null ? opts.active : activeView === view;
  const onClick = opts.onClick || (() => setView(view));
  return el(
    'button',
    {
      class: 'nav-btn' + (active ? ' active' : ''),
      onClick,
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

/**
 * Edge-swipe-to-go-back gesture (like native/Gojek): on a secondary (Lainnya
 * sub-feature) view, a swipe starting from the left screen edge and dragging
 * right returns to the Lainnya hub. The page follows the finger and either
 * completes (past threshold) or snaps back on release.
 */
function setupEdgeSwipeBack() {
  const EDGE = 28; // px from the left edge where a back-swipe may start
  const COMPLETE_RATIO = 0.35; // fraction of screen width to trigger back
  const COMPLETE_VELOCITY = 0.5; // px/ms flick that also triggers back

  let tracking = false;
  let startX = 0;
  let startY = 0;
  let startT = 0;
  let dx = 0;
  let decidedHoriz = false; // locked into horizontal drag
  let cancelled = false;

  /** The nodes we translate during the drag. */
  function panels() {
    return /** @type {HTMLElement[]} */ (
      [root.querySelector('.app-header'), root.querySelector('.main')].filter(Boolean)
    );
  }

  function setOffset(x, animate) {
    for (const p of panels()) {
      p.style.transition = animate ? 'transform 0.2s ease' : '';
      p.style.transform = x ? `translateX(${x}px)` : '';
    }
  }

  function reset() {
    tracking = false;
    decidedHoriz = false;
    cancelled = false;
    dx = 0;
  }

  document.addEventListener(
    'touchstart',
    (e) => {
      // Only on secondary views, single touch starting at the left edge, and
      // not while a modal is open.
      if (!SECONDARY.has(activeView)) return;
      if (document.querySelector('.modal-backdrop')) return;
      if (e.touches.length !== 1) return;
      const tch = e.touches[0];
      if (tch.clientX > EDGE) return;
      tracking = true;
      cancelled = false;
      decidedHoriz = false;
      startX = tch.clientX;
      startY = tch.clientY;
      startT = Date.now();
      dx = 0;
    },
    { passive: true }
  );

  document.addEventListener(
    'touchmove',
    (e) => {
      if (!tracking || cancelled) return;
      const tch = e.touches[0];
      dx = tch.clientX - startX;
      const dy = tch.clientY - startY;
      if (!decidedHoriz) {
        // Decide gesture intent: horizontal → drag; vertical → let it scroll.
        if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
        if (Math.abs(dy) > Math.abs(dx)) {
          cancelled = true;
          return;
        }
        decidedHoriz = true;
      }
      if (dx < 0) dx = 0; // only drag rightward
      // Resist a little so it feels anchored.
      setOffset(dx, false);
      if (e.cancelable) e.preventDefault();
    },
    { passive: false }
  );

  document.addEventListener('touchend', () => {
    if (!tracking) return;
    const dt = Math.max(1, Date.now() - startT);
    const velocity = dx / dt;
    const width = window.innerWidth || 360;
    const shouldComplete = dx > width * COMPLETE_RATIO || velocity > COMPLETE_VELOCITY;
    if (decidedHoriz && !cancelled && shouldComplete) {
      // Slide the rest of the way out, then navigate back to the hub.
      setOffset(width, true);
      setTimeout(() => {
        setOffset(0, false);
        backToLainnya();
      }, 180);
    } else {
      // Snap back into place.
      setOffset(0, true);
      setTimeout(() => setOffset(0, false), 220);
    }
    reset();
  });

  document.addEventListener('touchcancel', () => {
    if (!tracking) return;
    setOffset(0, true);
    reset();
  });
}

// Re-render whenever the store changes. Preserve the current scroll position
// across these re-renders (they rebuild the DOM) so adding/editing data or
// toggling things doesn't jump the page to the top.
store.subscribe(() => {
  const y = window.scrollY || window.pageYOffset || 0;
  renderApp();
  requestAnimationFrame(() => window.scrollTo(0, y));
});

// Boot.
applyTheme(); // apply persisted theme before first paint
store.init();
renderApp();
setupEdgeSwipeBack();

// Register the service worker (non-blocking, graceful failure) (Req 10.4, 10.5).
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch((err) => {
      console.warn('Service worker registration failed:', err);
    });
  });
}
