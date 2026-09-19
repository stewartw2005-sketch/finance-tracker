// @ts-check
/**
 * Monochrome line-style icons as inline SVG. One consistent set so the whole
 * app (nav, actions, cards) shares a single visual language — no emoji.
 * Icons inherit color via `stroke="currentColor"`.
 */

/** Raw SVG path/markup for each icon (24×24 viewBox, 1.8 stroke). */
const PATHS = {
  // Bottom nav
  home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/>',
  wallet:
    '<rect x="3" y="6" width="18" height="14" rx="2.5"/><path d="M3 9h18"/><circle cx="16.5" cy="13.5" r="1.3" fill="currentColor" stroke="none"/>',
  transactions: '<path d="M7 7h13l-3-3"/><path d="M17 17H4l3 3"/>',
  more: '<circle cx="5" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.5" fill="currentColor" stroke="none"/>',

  // Actions / affordances
  plus: '<path d="M12 5v14"/><path d="M5 12h14"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16v4Z"/><path d="M13.5 6.5l4 4"/>',
  trash:
    '<path d="M4 7h16"/><path d="M9 7V5h6v2"/><path d="M6 7l1 13h10l1-13"/>',
  dots: '<circle cx="12" cy="5" r="1.6" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none"/><circle cx="12" cy="19" r="1.6" fill="currentColor" stroke="none"/>',
  copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M6 15H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1"/>',
  star: '<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 17.9 6.8 19.6l1-5.8L3.5 9.7l5.9-.9L12 3.5Z"/>',
  starFilled:
    '<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 17.9 6.8 19.6l1-5.8L3.5 9.7l5.9-.9L12 3.5Z" fill="currentColor"/>',
  lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  unlock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 7.4-2"/>',
  close: '<path d="M6 6l12 12"/><path d="M18 6 6 18"/>',
  chevronDown: '<path d="M6 9l6 6 6-6"/>',

  // Wallet types (used as small leading glyphs)
  bank: '<path d="M4 10h16"/><path d="M12 3 4 7h16l-8-4Z"/><path d="M6 10v7"/><path d="M10 10v7"/><path d="M14 10v7"/><path d="M18 10v7"/><path d="M4 20h16"/>',
  ewallet: '<rect x="6" y="3" width="12" height="18" rx="2.5"/><path d="M10.5 18h3"/>',
  cash: '<rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/>',
  credit:
    '<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M3 9.5h18"/><path d="M6.5 14.5h4"/>',
};

/**
 * Build an inline SVG icon element.
 * @param {keyof typeof PATHS} name
 * @param {Object} [opts]
 * @param {number} [opts.size=24]
 * @param {string} [opts.className]
 * @returns {SVGSVGElement}
 */
export function icon(name, opts = {}) {
  const { size = 24, className } = opts;
  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('width', String(size));
  svg.setAttribute('height', String(size));
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '1.8');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  if (className) svg.setAttribute('class', className);
  svg.innerHTML = PATHS[name] || '';
  return svg;
}

/**
 * Icon name for a wallet type.
 * @param {import('../types.js').WalletType} type
 * @returns {keyof typeof PATHS}
 */
export function walletTypeIcon(type) {
  return type in PATHS ? /** @type {any} */ (type) : 'wallet';
}
