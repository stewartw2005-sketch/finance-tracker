// @ts-check
/**
 * Receipt parsing (Scan Struk feature). Extracts amount, date, and merchant
 * from receipt text, tuned for BCA QRIS payment receipt screenshots such as:
 *
 *   Pembayaran ke
 *   WRG GULING PAK MADE
 *   Rp214.500,00
 *   24/09/2026 - 12:33:35 WIB
 *
 * The text is produced by on-device OCR where the browser supports it
 * (Chrome/Edge `TextDetector`); on browsers without OCR (e.g. iOS Safari) the
 * user types/edits the values manually, so this parser is a best-effort
 * convenience, never a hard dependency.
 */
import { parseAmount } from './format.js';

/**
 * @typedef {Object} ReceiptParseResult
 * @property {number} [amount]     Whole-rupiah integer, if found.
 * @property {string} [date]       ISO date `YYYY-MM-DD`, if found.
 * @property {string} [merchant]   Merchant/recipient name, if found.
 * @property {string} rawText      The full text that was parsed (for debugging/notes).
 */

/**
 * Parse raw receipt text (from OCR) into best-effort transaction fields.
 * Everything is optional — callers show a confirm form pre-filled with
 * whatever was found.
 * @param {string} text
 * @returns {ReceiptParseResult}
 */
export function parseReceiptText(text) {
  const raw = String(text || '');
  /** @type {ReceiptParseResult} */
  const result = { rawText: raw };

  const amount = extractAmount(raw);
  if (amount != null) result.amount = amount;

  const date = extractDate(raw);
  if (date) result.date = date;

  const merchant = extractMerchant(raw);
  if (merchant) result.merchant = merchant;

  return result;
}

/**
 * Find the payment amount. BCA QRIS receipts print it as `Rp214.500,00`
 * (Indonesian format: `.` thousands, `,` decimals). We take the LARGEST
 * `Rp`-prefixed value on the receipt, which is the total paid (avoids picking
 * up smaller fee/admin lines).
 * @param {string} text
 * @returns {number|null}
 */
function extractAmount(text) {
  // Match "Rp" (optionally spaced) followed by a grouped number, with an
  // optional ",dd" decimal part. Case-insensitive, tolerant of spaces.
  const re = /rp\s*([0-9]{1,3}(?:[.\s][0-9]{3})*(?:,[0-9]{1,2})?|[0-9]+(?:,[0-9]{1,2})?)/gi;
  let m;
  let best = null;
  while ((m = re.exec(text)) !== null) {
    const numeric = wholeRupiahFromID(m[1]);
    if (Number.isFinite(numeric) && (best == null || numeric > best)) {
      best = numeric;
    }
  }
  return best;
}

/**
 * Convert an Indonesian-formatted money string like "214.500,00" to a whole
 * rupiah integer (214500). Drops any decimal part after the comma.
 * @param {string} s
 * @returns {number}
 */
function wholeRupiahFromID(s) {
  const intPart = String(s).split(',')[0]; // drop decimals
  return parseAmount(intPart);
}

/**
 * Find a date. BCA QRIS receipts print `24/09/2026 - 12:33:35 WIB`
 * (DD/MM/YYYY). Also tolerates DD-MM-YYYY and 2-digit years.
 * @param {string} text
 * @returns {string|null} ISO `YYYY-MM-DD` or null
 */
function extractDate(text) {
  const re = /\b([0-3]?\d)[/\-.]([01]?\d)[/\-.](\d{2,4})\b/;
  const m = re.exec(text);
  if (!m) return null;
  let [, d, mo, y] = m;
  let day = parseInt(d, 10);
  let month = parseInt(mo, 10);
  let year = parseInt(y, 10);
  if (year < 100) year += 2000;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const iso = `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  return iso;
}

/**
 * Find the merchant/recipient. BCA QRIS receipts print a "Pembayaran ke" (or
 * "Kepada"/"Merchant"/"Penerima") label followed by the name on the next
 * non-empty line. Falls back to null when no label is found.
 * @param {string} text
 * @returns {string|null}
 */
function extractMerchant(text) {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const labelRe = /^(pembayaran ke|kepada|penerima|merchant|toko|nama merchant)\b/i;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Inline form: "Pembayaran ke: WRG GULING PAK MADE"
    const inline = line.match(/^(?:pembayaran ke|kepada|penerima|merchant|toko|nama merchant)\s*[:\-]\s*(.+)$/i);
    if (inline && inline[1].trim()) {
      return cleanMerchant(inline[1]);
    }
    // Label on its own line → take the next meaningful line.
    if (labelRe.test(line)) {
      for (let j = i + 1; j < lines.length; j++) {
        const cand = lines[j];
        if (looksLikeName(cand)) return cleanMerchant(cand);
      }
    }
  }
  return null;
}

/**
 * Heuristic: a merchant name line shouldn't be a money/date/time/label line.
 * @param {string} line
 * @returns {boolean}
 */
function looksLikeName(line) {
  if (!line) return false;
  if (/rp\s*[0-9]/i.test(line)) return false; // money
  if (/\b[0-3]?\d[/\-.][01]?\d[/\-.]\d{2,4}\b/.test(line)) return false; // date
  if (/\b\d{1,2}:\d{2}(:\d{2})?\b/.test(line)) return false; // time
  if (/^(pembayaran|status|berhasil|sukses|ref|no\.?|tanggal|waktu|jumlah|total|nominal)\b/i.test(line)) return false;
  // Must contain at least one letter.
  return /[a-z]/i.test(line);
}

/**
 * Tidy a merchant string: collapse whitespace, trim trailing punctuation,
 * title-case ALL-CAPS names for readability (WRG GULING PAK MADE → Wrg Guling
 * Pak Made) while leaving mixed-case names as-is.
 * @param {string} s
 * @returns {string}
 */
function cleanMerchant(s) {
  let out = String(s).replace(/\s+/g, ' ').replace(/[.,;:\-\s]+$/, '').trim();
  const letters = out.replace(/[^a-z]/gi, '');
  if (letters.length > 0 && letters === letters.toUpperCase()) {
    out = out
      .toLowerCase()
      .replace(/\b([a-z])/g, (c) => c.toUpperCase());
  }
  return out;
}

/**
 * Whether the current browser can extract text from images on-device.
 * Uses the Shape Detection API's `TextDetector` (Chrome/Edge). Returns false
 * on browsers without it (e.g. iOS Safari), where the user types values.
 * @returns {boolean}
 */
export function canOcr() {
  return typeof globalThis !== 'undefined' && 'TextDetector' in globalThis;
}

/**
 * Best-effort OCR of an image using the Shape Detection API. Resolves to the
 * detected text, or '' if OCR is unavailable or fails. Never throws.
 * @param {Blob} blob
 * @returns {Promise<string>}
 */
export async function ocrImage(blob) {
  try {
    if (!canOcr()) return '';
    // @ts-ignore - TextDetector is not in the TS lib yet.
    const detector = new globalThis.TextDetector();
    let bitmap;
    if (typeof createImageBitmap === 'function') {
      bitmap = await createImageBitmap(blob);
    } else {
      return '';
    }
    const blocks = await detector.detect(bitmap);
    if (typeof bitmap.close === 'function') bitmap.close();
    if (!Array.isArray(blocks)) return '';
    // Preserve reading order roughly top-to-bottom by bounding box.
    blocks.sort((a, b) => (a.boundingBox?.top || 0) - (b.boundingBox?.top || 0));
    return blocks.map((b) => b.rawValue || '').join('\n');
  } catch {
    return '';
  }
}
