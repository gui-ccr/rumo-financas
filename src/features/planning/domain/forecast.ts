import { remaining } from '@/features/cards/domain/invoice';
import { monthKey, type ISODate, type MonthKey } from '@/shared/domain/dates';

/** The part of a bill occurrence the forecast reads. */
export type ForecastBill = { dueDate: ISODate; amountCents: number | null };

/** The part of a card invoice the forecast reads. */
export type ForecastInvoice = { month: MonthKey; totalCents: number; paidCents: number };

export type MonthForecast = {
  /** Entradas previstas do mês. Já inclui as recebidas (sumExpected não separa por status). */
  incomeCents: number;
  /** Contas com vencimento no mês, pagas e pendentes. Vencidas de meses anteriores ficam de fora. */
  billsCents: number;
  /** Saldo ainda não pago das faturas do mês. */
  cardsCents: number;
  spendingCents: number;
  /** Entradas menos gastos. Negativo quando falta dinheiro. */
  balanceCents: number;
  /** Contas do mês sem valor definido (variáveis, ainda não digitadas). Não entram no total. */
  unpricedBills: number;
};

/**
 * Previsão de um mês: quanto entra (já previsto, inclui o que caiu) e quanto sai
 * (contas do mês mais o saldo restante das faturas do mês). Função pura.
 */
export function monthForecast({
  month,
  expectedIncomeCents,
  bills,
  invoices,
}: {
  month: MonthKey;
  expectedIncomeCents: number;
  bills: ForecastBill[];
  invoices: ForecastInvoice[];
}): MonthForecast {
  const monthBills = bills.filter((b) => monthKey(b.dueDate) === month);
  const billsCents = monthBills.reduce((sum, b) => sum + (b.amountCents ?? 0), 0);
  const unpricedBills = monthBills.filter((b) => b.amountCents === null).length;
  const cardsCents = invoices.filter((i) => i.month === month).reduce((sum, i) => sum + remaining(i), 0);
  const spendingCents = billsCents + cardsCents;

  return {
    incomeCents: expectedIncomeCents,
    billsCents,
    cardsCents,
    spendingCents,
    balanceCents: expectedIncomeCents - spendingCents,
    unpricedBills,
  };
}
