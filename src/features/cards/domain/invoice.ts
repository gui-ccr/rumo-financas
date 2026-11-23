import type { CreditCard } from '@/features/accounts/domain/account';
import { addMonths, dateInMonth, monthKey, type ISODate, type MonthKey } from '@/shared/domain/dates';
import { splitInstallments } from '@/shared/domain/money';

/**
 * Credit card invoice ("fatura") rules, Brazilian style:
 * - The invoice named after month M closes on `closingDay` of M and is due on
 *   `dueDay` (of M, or of M+1 when dueDay <= closingDay).
 * - A purchase made ON or AFTER the closing day goes to the next invoice.
 */
export function invoiceMonthFor(purchase: ISODate, closingDay: number): MonthKey {
  const key = monthKey(purchase);
  return purchase >= dateInMonth(key, closingDay) ? addMonths(key, 1) : key;
}

export function invoiceDueDate(invoice: MonthKey, closingDay: number, dueDay: number): ISODate {
  const dueMonth = dueDay <= closingDay ? addMonths(invoice, 1) : invoice;
  return dateInMonth(dueMonth, dueDay);
}

export function invoiceClosingDate(invoice: MonthKey, closingDay: number): ISODate {
  return dateInMonth(invoice, closingDay);
}

export type InstallmentPlan = {
  number: number;
  total: number;
  amountCents: number;
  /** Day the installment counts as spent: the purchase day, shifted month by month. */
  date: ISODate;
  invoiceMonth: MonthKey;
};

/** Expand a card purchase into one entry per installment. */
export function planInstallments(
  totalCents: number,
  count: number,
  purchase: ISODate,
  closingDay: number,
): InstallmentPlan[] {
  const amounts = splitInstallments(totalCents, count);
  const firstInvoice = invoiceMonthFor(purchase, closingDay);
  const purchaseDay = Number(purchase.slice(8, 10));
  return amounts.map((amountCents, i) => ({
    number: i + 1,
    total: count,
    amountCents,
    date: i === 0 ? purchase : dateInMonth(addMonths(monthKey(purchase), i), purchaseDay),
    invoiceMonth: addMonths(firstInvoice, i),
  }));
}

/* ---------- Invoice aggregate ---------- */

export type InvoiceStatus = 'open' | 'closed' | 'paid' | 'future';

export type Invoice = {
  cardId: number;
  cardName: string;
  cardColor: string;
  month: MonthKey;
  totalCents: number;
  paidCents: number;
  closingDate: ISODate;
  dueDate: ISODate;
  status: InvoiceStatus;
};

/** Raw sums per invoice month, as stored. */
export type InvoiceTotals = { month: MonthKey; totalCents: number; paidCents: number };

export const INVOICE_STATUS_LABEL: Record<InvoiceStatus, string> = {
  open: 'Aberta',
  closed: 'Fechada',
  paid: 'Paga',
  future: 'Próxima',
};

export function remaining(invoice: Pick<Invoice, 'totalCents' | 'paidCents'>): number {
  return Math.max(invoice.totalCents - invoice.paidCents, 0);
}

function statusOf(card: CreditCard, t: InvoiceTotals, ref: ISODate): InvoiceStatus {
  const current = invoiceMonthFor(ref, card.closingDay);
  if (t.month > current) return 'future';
  if (t.month === current) return 'open';
  return t.paidCents >= t.totalCents ? 'paid' : 'closed';
}

/** Build the invoice list for a card, newest first, always including the current one. */
export function buildInvoices(card: CreditCard, totals: InvoiceTotals[], ref: ISODate): Invoice[] {
  const byMonth = new Map(totals.map((t) => [t.month, t]));
  const current = invoiceMonthFor(ref, card.closingDay);
  if (!byMonth.has(current)) byMonth.set(current, { month: current, totalCents: 0, paidCents: 0 });

  return [...byMonth.values()]
    .sort((a, b) => (a.month < b.month ? 1 : -1))
    .map((t) => ({
      cardId: card.id,
      cardName: card.name,
      cardColor: card.color,
      month: t.month,
      totalCents: t.totalCents,
      paidCents: t.paidCents,
      closingDate: invoiceClosingDate(t.month, card.closingDay),
      dueDate: invoiceDueDate(t.month, card.closingDay, card.dueDay),
      status: statusOf(card, t, ref),
    }));
}

/** Invoices that need money: closed and not fully paid. */
export function isPayable(invoice: Invoice): boolean {
  return invoice.status === 'closed' && remaining(invoice) > 0;
}
