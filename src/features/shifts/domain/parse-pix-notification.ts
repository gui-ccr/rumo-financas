import type { NotificationRule } from './notification-rule';
import type { RawCapture } from './notification-source';

export type PixReceipt = { ruleId: number; amountCents: number; payer: string | null };

export type CaptureText = Pick<RawCapture, 'packageName' | 'title' | 'text' | 'bigText'>;

const FLAGS = 'is';

/** Compiles a rule pattern. An invalid pattern matches nothing instead of throwing. */
export function compilePattern(pattern: string): RegExp | null {
  try {
    return new RegExp(pattern, FLAGS);
  } catch {
    return null;
  }
}

/**
 * Brazilian amount text to cents. The dot is a thousands separator and the comma the decimal one:
 * "1.234,56" -> 123456, "25,00" -> 2500, "25,5" -> 2550, "25" -> 2500, "1.234" -> 123400.
 * Returns null when the text is not an amount.
 */
export function parseBrlToCents(value: string): number | null {
  const m = /^(\d{1,3}(?:\.\d{3})*|\d+)(?:,(\d{1,2}))?$/.exec(value.trim());
  if (!m) return null;
  const reais = Number(m[1].replace(/\./g, ''));
  const cents = m[2] === undefined ? 0 : Number(m[2].padEnd(2, '0'));
  return reais * 100 + cents;
}

/** "Maria S." -> "Maria S": no trailing full stop, single spaces. */
function cleanPayer(raw: string | undefined): string | null {
  if (!raw) return null;
  const payer = raw.replace(/\.+$/, '').replace(/\s+/g, ' ').trim();
  return payer || null;
}

/**
 * Finds the first active rule of the capture's app that recognizes a payment received.
 * Returns null for anything else (purchases, payments sent, and so on).
 * Pure: the same capture and rules always give the same result.
 */
export function parsePixNotification(capture: CaptureText, rules: NotificationRule[]): PixReceipt | null {
  const title = capture.title ?? '';
  // The expanded text carries the whole message when the notification is collapsed.
  const body = (capture.bigText || capture.text || '').trim();

  for (const rule of rules) {
    if (!rule.active || rule.packageName !== capture.packageName) continue;

    if (rule.titlePattern) {
      const titleRe = compilePattern(rule.titlePattern);
      if (!titleRe || !titleRe.test(title)) continue;
    }

    const match = compilePattern(rule.textPattern)?.exec(body);
    if (!match) continue;

    const amountCents = parseBrlToCents(match.groups?.valor ?? match[1] ?? '');
    if (!amountCents) continue; // not an amount, or zero

    return {
      ruleId: rule.id,
      amountCents,
      payer: cleanPayer(match.groups?.pagador ?? match[2]),
    };
  }
  return null;
}
