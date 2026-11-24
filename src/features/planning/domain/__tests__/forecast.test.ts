import { monthForecast } from '../forecast';

describe('monthForecast', () => {
  it('sums paid and pending bills of the month, ignoring other months', () => {
    const result = monthForecast({
      month: '2026-11',
      expectedIncomeCents: 500000,
      bills: [
        { dueDate: '2026-11-05', amountCents: 150000 }, // paga
        { dueDate: '2026-11-20', amountCents: 80000 }, // pendente
        { dueDate: '2026-10-30', amountCents: 99999 }, // vencida de outro mês: fora
        { dueDate: '2026-12-01', amountCents: 12345 }, // do mês seguinte: fora
      ],
      invoices: [],
    });
    expect(result.billsCents).toBe(230000);
    expect(result.spendingCents).toBe(230000);
  });

  it('counts only the remaining balance of the current month invoices', () => {
    const result = monthForecast({
      month: '2026-11',
      expectedIncomeCents: 0,
      bills: [],
      invoices: [
        { month: '2026-11', totalCents: 100000, paidCents: 40000 }, // resta 60000
        { month: '2026-10', totalCents: 50000, paidCents: 0 }, // outro mês: fora
        { month: '2026-11', totalCents: 20000, paidCents: 30000 }, // paga a mais: resta 0
      ],
    });
    expect(result.cardsCents).toBe(60000);
  });

  it('does not double count income: expected already includes received', () => {
    const result = monthForecast({
      month: '2026-11',
      expectedIncomeCents: 300000,
      bills: [],
      invoices: [],
    });
    expect(result.incomeCents).toBe(300000);
    expect(result.balanceCents).toBe(300000);
  });

  it('returns a surplus when income covers bills and cards', () => {
    const result = monthForecast({
      month: '2026-11',
      expectedIncomeCents: 500000,
      bills: [{ dueDate: '2026-11-10', amountCents: 200000 }],
      invoices: [{ month: '2026-11', totalCents: 100000, paidCents: 0 }],
    });
    expect(result.spendingCents).toBe(300000);
    expect(result.balanceCents).toBe(200000);
  });

  it('returns a negative balance when spending exceeds income', () => {
    const result = monthForecast({
      month: '2026-11',
      expectedIncomeCents: 100000,
      bills: [{ dueDate: '2026-11-10', amountCents: 150000 }],
      invoices: [],
    });
    expect(result.balanceCents).toBe(-50000);
  });

  it('counts variable bills without amount as unpriced and leaves them out of the total', () => {
    const result = monthForecast({
      month: '2026-11',
      expectedIncomeCents: 0,
      bills: [
        { dueDate: '2026-11-08', amountCents: null },
        { dueDate: '2026-11-09', amountCents: 5000 },
      ],
      invoices: [],
    });
    expect(result.unpricedBills).toBe(1);
    expect(result.billsCents).toBe(5000);
  });
});
