/** All money is stored as integer cents to avoid floating point drift. */

const brl = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** 12345 -> "R$ 123,45" (non-breaking space normalized to a regular one). */
export function formatBRL(cents: number): string {
  return brl.format(cents / 100).replace(/ /g, ' ');
}

/** 12345 -> "123,45" — without the currency symbol. */
export function formatAmount(cents: number): string {
  return formatBRL(cents).replace(/^-?R\$\s?/, (m) => (m.startsWith('-') ? '-' : ''));
}

/** Compact for tight spots: 152340 -> "R$ 1,5 mil". */
export function formatCompact(cents: number): string {
  const value = cents / 100;
  if (Math.abs(value) < 1000) return formatBRL(cents);
  const thousands = value / 1000;
  const digits = Math.abs(thousands) < 10 ? 1 : 0;
  return `R$ ${thousands.toFixed(digits).replace('.', ',')} mil`;
}

/**
 * Parse a user typed BRL string into cents.
 * Accepts "1.234,56", "1234,5", "1234.56", "R$ 12", "12".
 */
export function parseBRL(input: string): number | null {
  const cleaned = input.replace(/[R$\s]/g, '');
  if (!cleaned) return null;
  let normalized = cleaned;
  if (cleaned.includes(',')) {
    normalized = cleaned.replace(/\./g, '').replace(',', '.');
  }
  if (!/^-?\d+(\.\d{0,2})?$/.test(normalized)) return null;
  return Math.round(Number(normalized) * 100);
}

/** Largest amount the masked fields accept: R$ 999.999.999,99 (11 digits). */
export const MAX_MASKED_DIGITS = 11;

/**
 * Bank-style mask (the way ATMs and banking apps type money). Only the digits of
 * the text count, and they are read as cents: the number is always filled from the
 * right. "1" -> 1 (R$ 0,01); "1.234,56" -> 123456; "R$ 12,3" -> 123; "" -> 0.
 * Digits beyond MAX_MASKED_DIGITS are ignored.
 */
export function centsFromMaskedText(text: string): number {
  const digits = text.replace(/\D/g, '').slice(0, MAX_MASKED_DIGITS);
  return digits ? Number(digits) : 0;
}

/**
 * Text shown in a masked field for a value in cents: "1.234,56", or "" when there is
 * no value (zero included), so the field's placeholder stays visible.
 */
export function maskAmount(cents: number | null): string {
  return cents ? formatAmount(cents) : '';
}

/**
 * Keypad entry works like a cash register: digits shift in from the right.
 * appendDigit(0, '5') -> 5 (R$ 0,05); appendDigit(5, '0') -> 50 (R$ 0,50).
 */
export function appendDigit(cents: number, digit: string): number {
  const next = cents * 10 + Number(digit);
  return next > 99_999_999_99 ? cents : next;
}

export function removeDigit(cents: number): number {
  return Math.floor(cents / 10);
}

/** Split a total into N installments; remainder cents go to the first one. */
export function splitInstallments(totalCents: number, count: number): number[] {
  if (count < 1) throw new Error('count must be >= 1');
  const base = Math.floor(totalCents / count);
  const remainder = totalCents - base * count;
  return Array.from({ length: count }, (_, i) => base + (i === 0 ? remainder : 0));
}
