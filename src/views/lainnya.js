// @ts-check
/**
 * Lainnya (More) — hub linking to secondary sections. In Phase 1 only
 * "Kelola Kategori" is wired; the rest are placeholders that will be
 * activated in later phases. Sections are also reachable from the Dashboard
 * quick-access menu (Req 13.6, 22.9).
 */
import { el } from '../lib/dom.js';
import { t } from '../lib/i18n.js';
import { openCategoryManager } from './categoryManager.js';

/**
 * Render the Lainnya hub.
 * @param {HTMLElement} container
 * @param {(view: string) => void} navigate - router callback for future sections
 */
export function renderLainnya(container, navigate) {
  /** @type {{ id: string, icon: string, label: string, ready?: boolean, onClick?: () => void }[]} */
  const items = [
    { id: 'budget', icon: '🎯', label: t.lainnya.budget },
    { id: 'aset', icon: '💎', label: t.lainnya.aset },
    { id: 'utang', icon: '📉', label: t.lainnya.utang },
    { id: 'investasi', icon: '📈', label: t.lainnya.investasi },
    { id: 'laporan', icon: '🧾', label: t.lainnya.laporan },
    {
      id: 'kategori',
      icon: '🏷️',
      label: t.lainnya.kategori,
      ready: true,
      onClick: () => openCategoryManager(),
    },
  ];

  const list = el(
    'ul',
    { class: 'menu-list' },
    items.map((item) =>
      el(
        'li',
        {},
        el(
          'button',
          {
            class: 'menu-row' + (item.ready ? '' : ' disabled'),
            disabled: item.ready ? undefined : true,
            onClick: item.onClick
              ? item.onClick
              : item.ready && navigate
              ? () => navigate(item.id)
              : undefined,
          },
          [
            el('span', { class: 'menu-icon', 'aria-hidden': 'true' }, item.icon),
            el('span', { class: 'menu-label' }, item.label),
            item.ready
              ? el('span', { class: 'menu-chevron', 'aria-hidden': 'true' }, '›')
              : el('span', { class: 'badge' }, t.lainnya.soon),
          ]
        )
      )
    )
  );

  container.append(
    el('div', { class: 'section-title' }, t.lainnya.subtitle),
    list
  );
}
