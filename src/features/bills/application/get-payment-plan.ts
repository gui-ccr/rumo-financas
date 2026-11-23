import { availableBalance } from '@/features/accounts/domain/account';
import type { AccountRepository } from '@/features/accounts/domain/repositories';
import type { GetIncomes } from '@/features/incomes/application/get-incomes';
import { today, monthKey, monthRange, type ISODate } from '@/shared/domain/dates';

import type { BillRepository } from '../domain/bill-repository';
import { buildPaymentPlan, type PaymentPlan, type PlanOccurrence } from '../domain/payment-plan';

/**
 * Builds the payment plan from what is really due: the spendable balance, the open bills
 * of this month plus the overdue ones, and the pending expected incomes. Bills of later
 * months are materialized for reminders and the agenda, but they are not paid from this
 * month's balance, so they are not in the plan. Card invoices are not part of the plan yet.
 * Read-only: occurrences are materialized elsewhere.
 */
export class GetPaymentPlan {
  constructor(
    private readonly accounts: AccountRepository,
    private readonly bills: BillRepository,
    private readonly incomes: GetIncomes,
  ) {}

  async execute(ref: ISODate = today()): Promise<PaymentPlan<PlanOccurrence & { billName: string }>> {
    const { start, end } = monthRange(monthKey(ref));
    const [balances, billsDue, pendingIncomes] = await Promise.all([
      this.accounts.balances(ref),
      // Overdue (open, before this month) and this month's items, in one read.
      this.bills.occurrencesWithOverdue(start, end),
      this.incomes.pending(),
    ]);
    const pendingBills = billsDue.filter((o) => o.status === 'pending');

    return buildPaymentPlan({
      ref,
      availableCents: availableBalance(balances),
      pending: pendingBills.map((o) => ({
        id: o.id,
        billName: o.billName,
        amountCents: o.amountCents,
        dueDate: o.dueDate,
        priority: o.priority,
        overdue: o.dueDate < ref,
      })),
      // Dated receipts already in the past are not "next" anymore; undated ones are kept.
      expectedIncomes: pendingIncomes
        .filter((i) => i.expectedDate === null || i.expectedDate >= ref)
        .map((i) => ({
          id: i.id,
          name: i.incomeName,
          expectedCents: i.expectedCents,
          expectedDate: i.expectedDate,
        })),
    });
  }
}
