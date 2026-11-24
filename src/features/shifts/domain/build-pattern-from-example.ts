import { parseBrlToCents } from './parse-pix-notification';

/**
 * Builds a rule's text pattern from a notification the user pasted, so nobody writes a regex.
 * The amount becomes the group `valor`. The name after " de " becomes the group `pagador`, and runs up
 * to the first punctuation or the end of the text. Everything else in the example is matched literally,
 * ignoring case and accepting any run of spaces. Pure: the same example always gives the same result.
 */

export type PatternFromExample =
  | { ok: true; pattern: string; amountText: string; payer: string | null }
  | { ok: false; error: string };

export const NO_AMOUNT_MESSAGE = 'Não achei um valor em reais nesse texto';
export const EMPTY_EXAMPLE_MESSAGE = 'Cole o texto de um Pix recebido';

/** "1.234,56", "25,00" or "25" (after R$). */
const VALUE = String.raw`\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?|\d+(?:,\d{1,2})?`;
const WITH_SYMBOL = new RegExp(String.raw`R\$\s*(${VALUE})`, 'i');
/** Without R$, only a value with a decimal comma or a thousands dot counts, so "2 vezes" is not an amount. */
const BARE_AMOUNT = new RegExp(String.raw`(\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?|\d+,\d{1,2})(?!\d)`);

/** Escapes regex metacharacters, and turns each run of spaces into \s+. */
function literal(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/ +/g, String.raw`\s+`);
}

export function buildPatternFromExample(example: string): PatternFromExample {
  const text = example.replace(/\s+/g, ' ').trim();
  if (!text) return { ok: false, error: EMPTY_EXAMPLE_MESSAGE };

  const symbol = WITH_SYMBOL.exec(text);
  const found = symbol ?? BARE_AMOUNT.exec(text);
  if (!found) return { ok: false, error: NO_AMOUNT_MESSAGE };

  const amountText = found[1];
  if (!parseBrlToCents(amountText)) return { ok: false, error: NO_AMOUNT_MESSAGE };

  const before = text.slice(0, found.index);
  const after = text.slice(found.index + found[0].length);

  // " de Fulano de Tal." -> payer "Fulano de Tal": the name stops at the first . , ; ! ? or at the end.
  const payerMatch = /^\s+de\s+(.+)$/i.exec(after);
  const payerRaw = payerMatch ? payerMatch[1].split(/[.,;!?]/)[0] : '';
  const payer = payerRaw.trim() || null;

  const symbolPart = symbol ? String.raw`R\$\s*` : '';
  let pattern = literal(before) + symbolPart + String.raw`(?<valor>[\d.,]*\d)`;
  if (payer) pattern += String.raw`\s+de\s+(?<pagador>.+?)(?=[.,;!?]|\s*$)`;

  return { ok: true, pattern, amountText, payer };
}
