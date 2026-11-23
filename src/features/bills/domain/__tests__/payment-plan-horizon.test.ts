import { buildPaymentPlan, type PlanOccurrence } from '../payment-plan';

/**
 * The plan only sums what is due now: overdue items and items due by the last day of the
 * reference month. Later months are materialized for reminders, never summed into the plan.
 */
const occ = (over: Partial<PlanOccurrence> & { id: number; dueDate: string }): PlanOccurrence => ({
  amountCents: 36_000,
  priority: 'essential',
  overdue: false,
  ...over,
});

const plan = (ref: string, pending: PlanOccurrence[], availableCents = 0) =>
  buildPaymentPlan({ ref, availableCents, pending, expectedIncomes: [] });

describe('payment plan horizon', () => {
  it('a monthly bill with three occurrences (this month, +1, +2) counts only this month', () => {
    const pending = [
      occ({ id: 1, dueDate: '2026-11-10' }),
      occ({ id: 2, dueDate: '2026-12-10' }),
      occ({ id: 3, dueDate: '2027-01-10' }),
    ];

    const result = plan('2026-11-15', pending);

    expect(result.items.map((i) => i.occurrence.id)).toEqual([1]);
    expect(result.shortfallCents).toBe(36_000);
  });

  it('keeps the overdue items of earlier months, and nothing from later months', () => {
    const pending = [
      occ({ id: 1, dueDate: '2026-10-10', overdue: true }),
      occ({ id: 2, dueDate: '2026-11-10' }),
      occ({ id: 3, dueDate: '2026-12-10' }),
    ];

    const result = plan('2026-11-15', pending);

    expect(result.items.map((i) => i.occurrence.id).sort()).toEqual([1, 2]);
    expect(result.shortfallCents).toBe(72_000);
  });

  it('includes an item due on the last day of the month, and excludes the first day of the next one', () => {
    const pending = [occ({ id: 1, dueDate: '2026-11-30' }), occ({ id: 2, dueDate: '2026-12-01' })];

    const result = plan('2026-11-15', pending);

    expect(result.items.map((i) => i.occurrence.id)).toEqual([1]);
  });

  it('moves with the month: on 1 Dec, the Nov item is overdue and counts, while Jan still does not', () => {
    const pending = [
      occ({ id: 1, dueDate: '2026-11-10', overdue: true }),
      occ({ id: 2, dueDate: '2026-12-10' }),
      occ({ id: 3, dueDate: '2027-01-10' }),
    ];

    const result = plan('2026-12-01', pending);

    expect(result.items.map((i) => i.occurrence.id).sort()).toEqual([1, 2]);
  });

  it('reports the balance the plan spends from', () => {
    expect(plan('2026-11-15', [], 123_456).availableCents).toBe(123_456);
  });
});
