import { buildPaymentPlan, type PlanIncome, type PlanOccurrence } from '../payment-plan';
const REF = '2026-11-15';

const occ = (over: Partial<PlanOccurrence> & { id: number }): PlanOccurrence => ({
  amountCents: 10_000,
  dueDate: '2026-11-10',
  priority: 'important',
  overdue: false,
  ...over,
});

const ids = (plan: ReturnType<typeof buildPaymentPlan>) => plan.items.map((i) => i.occurrence.id);

describe('buildPaymentPlan', () => {
  it('orders by overdue first, then priority, then due date', () => {
    const plan = buildPaymentPlan({ ref: REF,
      availableCents: 1_000_000,
      pending: [
        occ({ id: 1, priority: 'flexible', dueDate: '2026-11-01' }),
        occ({ id: 2, priority: 'essential', dueDate: '2026-11-20' }),
        occ({ id: 3, priority: 'important', dueDate: '2026-11-05' }),
        occ({ id: 4, priority: 'essential', dueDate: '2026-11-03', overdue: true }),
        occ({ id: 5, priority: 'flexible', dueDate: '2026-11-02', overdue: true }),
      ],
      expectedIncomes: [],
    });
    // overdue (4 essential, then 5 flexible), then essential, important, flexible by date
    expect(ids(plan)).toEqual([4, 5, 2, 3, 1]);
    expect(plan.items.map((i) => i.order)).toEqual([1, 2, 3, 4, 5]);
    expect(plan.coveredCount).toBe(5);
    expect(plan.shortfallCents).toBe(0);
  });

  it('covers a prefix in order and reports the shortfall when the balance runs out', () => {
    const plan = buildPaymentPlan({ ref: REF,
      availableCents: 25_000,
      pending: [
        occ({ id: 1, priority: 'essential', amountCents: 10_000 }),
        occ({ id: 2, priority: 'essential', amountCents: 10_000, dueDate: '2026-11-12' }),
        occ({ id: 3, priority: 'flexible', amountCents: 6_000, dueDate: '2026-11-15' }),
        occ({ id: 4, priority: 'flexible', amountCents: 1_000, dueDate: '2026-11-20' }),
      ],
      expectedIncomes: [],
    });
    // 5.000 is left after the essentials. The flexible 6.000 does not fit, and the
    // flexible 1.000 that would fit is not paid either: strict order, no skipping ahead.
    expect(plan.items.map((i) => i.coveredByBalance)).toEqual([true, true, false, false]);
    expect(plan.items.map((i) => i.runningBalanceCents)).toEqual([15_000, 5_000, 5_000, 5_000]);
    expect(plan.coveredCount).toBe(2);
    // Known amounts 27.000 minus the 25.000 balance. The 6.000 misses 1.000, the 1.000 misses the other 1.000.
    expect(plan.shortfallCents).toBe(2_000);
    expect(plan.items.map((i) => i.missingCents)).toEqual([0, 0, 1_000, 1_000]);
  });

  it('covers nothing when the balance is zero and the whole amount is shortfall', () => {
    const plan = buildPaymentPlan({ ref: REF,
      availableCents: 0,
      pending: [occ({ id: 1, amountCents: 7_000 }), occ({ id: 2, amountCents: 3_000, priority: 'flexible' })],
      expectedIncomes: [],
    });
    expect(plan.items.every((i) => !i.coveredByBalance)).toBe(true);
    expect(plan.items.map((i) => i.runningBalanceCents)).toEqual([0, 0]);
    expect(plan.coveredCount).toBe(0);
    expect(plan.shortfallCents).toBe(10_000);
    expect(plan.items.map((i) => i.missingCents)).toEqual([7_000, 3_000]);
  });

  it('reports the missing money of one bill larger than the balance: R$ 40 against R$ 125 leaves R$ 85', () => {
    const plan = buildPaymentPlan({ ref: REF,
      availableCents: 4_000,
      pending: [occ({ id: 1, amountCents: 12_500 })],
      expectedIncomes: [],
    });
    expect(plan.items[0]).toMatchObject({ coveredByBalance: false, missingCents: 8_500 });
    expect(plan.shortfallCents).toBe(8_500);
  });

  it('has no missing money for a covered item, and none for an item with no amount', () => {
    const plan = buildPaymentPlan({ ref: REF,
      availableCents: 5_000,
      pending: [
        occ({ id: 1, priority: 'essential', amountCents: null }),
        occ({ id: 2, priority: 'important', amountCents: 5_000 }),
      ],
      expectedIncomes: [],
    });
    expect(plan.items.map((i) => i.missingCents)).toEqual([0, 0]);
  });

  it('is empty when there are no pending bills, and still reports the next income', () => {
    const incomes: PlanIncome[] = [
      { id: 9, name: 'Bolsa', expectedCents: 50_000, expectedDate: null },
      { id: 8, name: 'Freela', expectedCents: 80_000, expectedDate: '2026-12-05' },
      { id: 7, name: 'Salário', expectedCents: 300_000, expectedDate: '2026-11-30' },
    ];
    const plan = buildPaymentPlan({ ref: REF, availableCents: 123, pending: [], expectedIncomes: incomes });
    expect(plan.items).toEqual([]);
    expect(plan.coveredCount).toBe(0);
    expect(plan.shortfallCents).toBe(0);
    expect(plan.nextIncome?.id).toBe(7);
  });

  it('returns no next income when no pending income has a date', () => {
    const plan = buildPaymentPlan({ ref: REF,
      availableCents: 0,
      pending: [],
      expectedIncomes: [{ id: 1, name: 'Bolsa', expectedCents: 1_000, expectedDate: null }],
    });
    expect(plan.nextIncome).toBeNull();
  });

  it('puts an overdue essential bill first even when a non-overdue essential is due sooner', () => {
    const plan = buildPaymentPlan({ ref: REF,
      availableCents: 10_000,
      pending: [
        occ({ id: 1, priority: 'essential', dueDate: '2026-11-15' }),
        occ({ id: 2, priority: 'essential', dueDate: '2026-10-28', overdue: true }),
      ],
      expectedIncomes: [],
    });
    expect(ids(plan)).toEqual([2, 1]);
    expect(plan.items[0].coveredByBalance).toBe(true);
    expect(plan.items[1].coveredByBalance).toBe(false);
  });

  it('breaks ties on the same priority and date by id', () => {
    const plan = buildPaymentPlan({ ref: REF,
      availableCents: 1_000_000,
      pending: [
        occ({ id: 12, priority: 'important', dueDate: '2026-11-10' }),
        occ({ id: 4, priority: 'important', dueDate: '2026-11-10' }),
        occ({ id: 7, priority: 'important', dueDate: '2026-11-10' }),
      ],
      expectedIncomes: [],
    });
    expect(ids(plan)).toEqual([4, 7, 12]);
  });

  it('skips variable bills without an amount: no balance consumed, no shortfall, plan keeps going', () => {
    const plan = buildPaymentPlan({ ref: REF,
      availableCents: 5_000,
      pending: [
        occ({ id: 1, priority: 'essential', amountCents: null }),
        occ({ id: 2, priority: 'important', amountCents: 5_000 }),
      ],
      expectedIncomes: [],
    });
    expect(plan.items[0]).toMatchObject({ coveredByBalance: false, runningBalanceCents: 5_000 });
    expect(plan.items[1]).toMatchObject({ coveredByBalance: true, runningBalanceCents: 0 });
    expect(plan.coveredCount).toBe(1);
    expect(plan.shortfallCents).toBe(0);
  });
});
