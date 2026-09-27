// @ts-check
/**
 * Add / edit transaction form (Req 1, 2.1, 2.2). Opened in a modal.
 *
 * The Jenis (type) toggle has three options: Pengeluaran, Pemasukan, and
 * Scan Struk. "Scan Struk" adds an image picker above the normal fields:
 * the user picks (or shares) a receipt screenshot, the app attempts on-device
 * OCR where supported (Chrome/Edge `TextDetector`), and pre-fills amount, date
 * and merchant. On browsers without OCR (e.g. iOS Safari) the user fills the
 * fields manually with the screenshot shown for reference. A scanned receipt
 * is saved as a normal expense transaction.
 *
 * @typedef {import('../types.js').Transaction} Transaction
 */
import { el } from '../lib/dom.js';
import { openModal, closeModal } from './modal.js';
import * as store from '../state/store.js';
import { validateTransaction } from '../lib/validation.js';
import { parseAmount, groupDigits } from '../lib/format.js';
import { todayISO } from '../lib/dates.js';
import { t } from '../lib/i18n.js';
import { parseReceiptText, ocrImage, canOcr } from '../lib/receipt.js';

/**
 * Open the transaction form. Pass a transaction to edit; omit to add.
 * @param {Transaction} [existing]
 */
export function openTransactionForm(existing) {
  const isEdit = !!existing;
  const state = store.getState();
  const categories = state.categories;
  const wallets = state.wallets;

  // Default wallet: the transaction's own (edit), else the primary (UTAMA)
  // wallet, else the first wallet.
  const primary = store.primaryWallet();
  const defaultWalletId =
    (existing && existing.walletId) ||
    (primary ? primary.id : '') ||
    (wallets[0] ? wallets[0].id : '');

  // Working copy of form values. Amount is stored as a grouped display string.
  const form = {
    amount: existing ? groupDigits(String(existing.amount)) : '',
    type: /** @type {'income'|'expense'} */ (existing ? existing.type : 'expense'),
    categoryId: existing ? existing.categoryId : '',
    date: existing ? existing.date : todayISO(),
    note: existing && existing.note ? existing.note : '',
    walletId: defaultWalletId,
  };

  // UI mode for the Jenis toggle. 'scan' is a data-entry mode that ultimately
  // produces an expense transaction; editing an existing tx never uses scan.
  /** @type {'expense'|'income'|'scan'} */
  let mode = 'expense';
  // Scan state: object URL for the preview image + a transient status message.
  /** @type {{ url: string|null, status: string|null, busy: boolean }} */
  const scan = { url: null, status: null, busy: false };

  /** @type {Record<string,string>} */
  let errors = {};

  const content = el('form', { class: 'stack', novalidate: 'true' });

  function rebuild() {
    content.textContent = '';

    // Type / mode segmented control. Editing keeps just income/expense.
    const segButtons = [
      typeButton('expense', t.tx.expense),
      typeButton('income', t.tx.income),
    ];
    if (!isEdit) segButtons.push(typeButton('scan', t.tx.scan));
    const seg = el('div', { class: 'segmented', role: 'group', 'aria-label': t.tx.type }, segButtons);

    // Amount (whole Rupiah, live-grouped with dots)
    const amountInput = el('input', {
      type: 'text',
      inputmode: 'numeric',
      placeholder: t.tx.amountPlaceholder,
      value: form.amount,
      class: errors.amount ? 'invalid' : '',
      onInput: (e) => {
        e.target.value = groupDigits(e.target.value);
        form.amount = e.target.value;
      },
    });

    // In scan mode the type is always expense (a receipt is an expense).
    const effectiveType = mode === 'income' ? 'income' : 'expense';

    // Category select — only categories matching the effective type.
    const kindCategories = store.categoriesByKind(effectiveType);
    const catSelect = el(
      'select',
      {
        class: errors.categoryId ? 'invalid' : '',
        onChange: (e) => (form.categoryId = e.target.value),
      },
      [
        el('option', { value: '', disabled: true, selected: !form.categoryId }, t.tx.selectCategory),
        ...kindCategories.map((c) =>
          el('option', { value: c.id, selected: c.id === form.categoryId }, store.categoryName(c.id))
        ),
      ]
    );

    // Wallet select
    const walletSelect = el(
      'select',
      {
        class: errors.walletId ? 'invalid' : '',
        onChange: (e) => (form.walletId = e.target.value),
      },
      [
        wallets.length === 0
          ? el('option', { value: '', selected: true }, t.wallet.selectWallet)
          : null,
        ...wallets.map((w) =>
          el('option', { value: w.id, selected: w.id === form.walletId }, w.name)
        ),
      ]
    );

    // Date
    const dateInput = el('input', {
      type: 'date',
      value: form.date,
      class: errors.date ? 'invalid' : '',
      onInput: (e) => (form.date = e.target.value),
    });

    // Note
    const noteInput = el('textarea', {
      placeholder: t.tx.notePlaceholder,
      value: form.note,
      onInput: (e) => (form.note = e.target.value),
    });

    content.append(field(t.tx.type, seg, errors.type));

    // Scan picker block appears only in scan mode.
    if (mode === 'scan') content.append(scanBlock());

    content.append(
      field(t.tx.amount, amountInput, errors.amount),
      field(t.tx.category, catSelect, errors.categoryId),
      field(t.wallet.walletLabel, walletSelect, errors.walletId),
      field(t.tx.date, dateInput, errors.date),
      field(t.tx.note, noteInput),
      el('div', { class: 'btn-row' }, [
        el('button', { type: 'button', class: 'btn ghost', onClick: () => closeModal() }, t.app.cancel),
        el('button', { type: 'submit', class: 'btn primary' }, isEdit ? t.app.save : t.app.add),
      ])
    );
  }

  /** The image-picker + preview + status block shown in scan mode. */
  function scanBlock() {
    const fileInput = el('input', {
      type: 'file',
      accept: 'image/*',
      class: 'scan-file',
      onChange: (e) => {
        const file = e.target.files && e.target.files[0];
        if (file) handleImage(file);
      },
    });

    const wrap = el('div', { class: 'scan-block' });

    if (scan.url) {
      wrap.append(
        el('img', { class: 'scan-preview', src: scan.url, alt: t.tx.scanImageAlt }),
        el(
          'button',
          {
            type: 'button',
            class: 'btn ghost scan-change',
            onClick: () => fileInput.click(),
          },
          t.tx.scanChangeImage
        )
      );
    } else {
      wrap.append(
        el(
          'button',
          {
            type: 'button',
            class: 'btn scan-pick',
            onClick: () => fileInput.click(),
          },
          t.tx.scanPick
        ),
        el('span', { class: 'scan-hint' }, t.tx.scanPickHint)
      );
    }

    // Status line (reading / result / no-ocr note).
    const statusText =
      scan.status != null ? scan.status : canOcr() ? '' : t.tx.scanNoOcr;
    if (statusText) {
      wrap.append(el('div', { class: 'scan-status' + (scan.busy ? ' busy' : '') }, statusText));
    }

    wrap.append(fileInput);
    return wrap;
  }

  /**
   * Load the picked image: show a preview, run best-effort OCR, and pre-fill
   * amount/date/note. Always leaves the form editable.
   * @param {File} file
   */
  async function handleImage(file) {
    // Revoke any previous preview URL to avoid leaks.
    if (scan.url) URL.revokeObjectURL(scan.url);
    scan.url = URL.createObjectURL(file);

    if (!canOcr()) {
      scan.status = t.tx.scanNoOcr;
      scan.busy = false;
      rebuild();
      return;
    }

    scan.busy = true;
    scan.status = t.tx.scanReading;
    rebuild();

    const text = await ocrImage(file);
    const parsed = parseReceiptText(text);

    let filled = 0;
    if (parsed.amount != null && Number.isFinite(parsed.amount)) {
      form.amount = groupDigits(String(parsed.amount));
      filled++;
    }
    if (parsed.date) {
      form.date = parsed.date;
      filled++;
    }
    if (parsed.merchant) {
      // Merchant goes into the note (there is no dedicated merchant field).
      form.note = form.note ? form.note : parsed.merchant;
      filled++;
    }

    scan.busy = false;
    if (filled === 0) {
      scan.status = t.tx.scanReadNone;
    } else if (filled >= 3 || (parsed.amount != null && parsed.date)) {
      scan.status = t.tx.scanReadOk;
    } else {
      scan.status = t.tx.scanReadPartial;
    }
    rebuild();
  }

  function typeButton(m, label) {
    return el(
      'button',
      {
        type: 'button',
        dataset: { type: m },
        class: mode === m ? 'active' : '',
        'aria-pressed': mode === m ? 'true' : 'false',
        onClick: () => {
          if (mode === m) return;
          mode = m;
          // Keep the persisted transaction type in sync: scan ⇒ expense.
          form.type = m === 'income' ? 'income' : 'expense';
          // Clear category if it no longer matches the effective type.
          const effectiveType = m === 'income' ? 'income' : 'expense';
          const cat = store.getState().categories.find((c) => c.id === form.categoryId);
          if (!cat || (cat.kind || 'expense') !== effectiveType) form.categoryId = '';
          rebuild();
        },
      },
      label
    );
  }

  function field(labelText, control, error) {
    return el('label', { class: 'field' }, [
      el('span', { class: 'field-label' }, labelText),
      control,
      el('span', { class: 'field-error', role: error ? 'alert' : undefined }, error || ''),
    ]);
  }

  content.addEventListener('submit', async (e) => {
    e.preventDefault();
    errors = validateTransaction(
      {
        amount: form.amount,
        type: form.type,
        categoryId: form.categoryId,
        date: form.date,
        note: form.note,
      },
      categories
    );
    if (Object.keys(errors).length > 0) {
      rebuild();
      return;
    }
    const payload = {
      amount: parseAmount(form.amount),
      type: form.type,
      categoryId: form.categoryId,
      date: form.date,
      note: form.note.trim() || undefined,
      walletId: form.walletId || undefined,
    };
    if (isEdit && existing) {
      await store.editTransaction(existing.id, payload);
    } else {
      await store.addTransaction(payload);
    }
    // Release the preview object URL now that we're done.
    if (scan.url) URL.revokeObjectURL(scan.url);
    closeModal();
  });

  rebuild();
  openModal(isEdit ? t.tx.editTitle : t.tx.addTitle, content);
}
