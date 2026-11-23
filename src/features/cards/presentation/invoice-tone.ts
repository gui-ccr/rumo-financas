import type { ISODate } from '@/shared/domain/dates';

import type { Invoice } from '../domain/invoice';

/**
 * Pill tone for an invoice status (presentation only).
 * paid = income, past due = expense, closed and still to pay = warning, open or upcoming = neutral.
 */
export function invoiceTone(inv: Pick<Invoice, 'status' | 'dueDate'>, ref: ISODate): 'neutral' | 'income' | 'expense' | 'warning' {
  if (inv.status === 'paid') return 'income';
  if (inv.status === 'closed') return inv.dueDate < ref ? 'expense' : 'warning';
  return 'neutral';
}
