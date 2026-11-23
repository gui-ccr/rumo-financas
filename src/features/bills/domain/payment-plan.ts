import { monthKey, monthRange, type ISODate } from '@/shared/domain/dates';

import type { BillPriority } from './bill';

/** What the plan needs to know about an open bill occurrence. */
export type PlanOccurrence = {
  id: number;
  /** null = variable amount not typed yet: it cannot be covered by the balance. */
  amountCents: number | null;
  dueDate: ISODate;
  priority: BillPriority;
  /** Due date already passed while still open. */
  overdue: boolean;
};

/** What the plan needs to know about an expected income. */
export type PlanIncome = {
  id: number;
  name: string;
  expectedCents: number;
  /** null = no date (a grant or freelance with no date). */
  expectedDate: ISODate | null;
};

export type PaymentPlanItem<T extends PlanOccurrence> = {
  occurrence: T;
  /** 1-based position in the payment order. */
  order: number;
  coveredByBalance: boolean;
  /** Balance left after this item, when it is paid in order. */
  runningBalanceCents: number;
};

export type PaymentPlan<T extends PlanOccurrence> = {
  /** The balance the plan spends from. */
  availableCents: number;
  items: PaymentPlanItem<T>[];
  /** How many of the items with a known amount the balance covers. */
  coveredCount: number;
  /** Sum of the known amounts that the current balance does not reach. */
  shortfallCents: number;
  /** Earliest dated expected income still pending, or null. */
  nextIncome: PlanIncome | null;
};

const RANK: Record<BillPriority, number> = { essential: 0, important: 1, flexible: 2 };

/** Overdue first, then essential > important > flexible, then due date, then id for a stable order. */
function compare(a: PlanOccurrence, b: PlanOccurrence): number {
  return (
    Number(b.overdue) - Number(a.overdue) ||
    RANK[a.priority] - RANK[b.priority] ||
    a.dueDate.localeCompare(b.dueDate) ||
    a.id - b.id
  );
}

/**
 * Pays the pending occurrences in priority order with the available balance.
 * Strict order: once an item cannot be covered, the plan stops covering items,
 * so money is never spent on a lower priority bill while a higher one is open.
 * Variable bills without an amount are skipped: they neither consume balance nor
 * stop the plan, and they are not counted in the shortfall.
 * Expected incomes are informational; they are not added to the balance.
 *
 * Only what is due now enters the plan: the overdue ones and the ones that fall due by the
 * last day of the reference month. Occurrences of later months are never summed here, even
 * when they are open (they are materialized ahead for reminders and the agenda).
 */
export function buildPaymentPlan<T extends PlanOccurrence>(input: {
  /** The day the plan is made for. Decides which month is "this month". */
  ref: ISODate;
  availableCents: number;
  pending: T[];
  expectedIncomes: PlanIncome[];
}): PaymentPlan<T> {
  const monthEnd = monthRange(monthKey(input.ref)).end;
  const due = input.pending.filter((o) => o.overdue || o.dueDate <= monthEnd);
  const ordered = [...due].sort(compare);

  let balance = input.availableCents;
  let stopped = false;
  let coveredCount = 0;
  let shortfallCents = 0;

  const items: PaymentPlanItem<T>[] = ordered.map((occurrence, index) => {
    let covered = false;
    if (occurrence.amountCents !== null) {
      if (!stopped && balance >= occurrence.amountCents) {
        balance -= occurrence.amountCents;
        covered = true;
        coveredCount += 1;
      } else {
        stopped = true;
        shortfallCents += occurrence.amountCents;
      }
    }
    return { occurrence, order: index + 1, coveredByBalance: covered, runningBalanceCents: balance };
  });

  const nextIncome =
    input.expectedIncomes
      .filter((i): i is PlanIncome & { expectedDate: ISODate } => i.expectedDate !== null)
      .sort((a, b) => a.expectedDate.localeCompare(b.expectedDate) || a.id - b.id)[0] ?? null;

  return { availableCents: input.availableCents, items, coveredCount, shortfallCents, nextIncome };
}
