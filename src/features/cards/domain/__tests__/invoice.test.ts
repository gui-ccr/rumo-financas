import { invoiceDueDate, invoiceMonthFor, planInstallments } from '../invoice';

describe('invoice month', () => {
  // Card closes on day 3, due on day 10.
  it('purchase before closing goes to the current invoice', () => {
    expect(invoiceMonthFor('2026-11-02', 3)).toBe('2026-11');
  });

  it('purchase on or after closing goes to the next invoice', () => {
    expect(invoiceMonthFor('2026-11-03', 3)).toBe('2026-12');
    expect(invoiceMonthFor('2026-11-20', 3)).toBe('2026-12');
  });

  it('wraps the year', () => {
    expect(invoiceMonthFor('2026-12-15', 3)).toBe('2027-01');
  });

  it('clamps closing day 31 in short months', () => {
    expect(invoiceMonthFor('2026-02-27', 31)).toBe('2026-02');
    expect(invoiceMonthFor('2026-02-28', 31)).toBe('2026-03');
  });

  it('due date lands in the next month when due day <= closing day', () => {
    expect(invoiceDueDate('2026-11', 3, 10)).toBe('2026-11-10');
    expect(invoiceDueDate('2026-11', 25, 5)).toBe('2026-12-05');
  });
});

describe('installments', () => {
  it('spreads installments over consecutive invoices', () => {
    const plan = planInstallments(30000, 3, '2026-11-20', 3);
    expect(plan.map((p) => p.invoiceMonth)).toEqual(['2026-12', '2027-01', '2027-02']);
    expect(plan.map((p) => p.date)).toEqual(['2026-11-20', '2026-12-20', '2027-01-20']);
    expect(plan.map((p) => p.amountCents)).toEqual([10000, 10000, 10000]);
  });

  it('keeps the day valid at month end', () => {
    const plan = planInstallments(2000, 2, '2026-01-31', 10);
    expect(plan[1].date).toBe('2026-02-28');
  });
});
