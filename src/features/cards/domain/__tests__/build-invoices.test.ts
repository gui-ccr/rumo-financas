import type { CreditCard } from '@/features/accounts/domain/account';

import { buildInvoices, isPayable, remaining } from '../invoice';

const card: CreditCard = {
  id: 1,
  name: 'Cartão Nubank',
  type: 'credit_card',
  initialBalanceCents: 0,
  closingDay: 3,
  dueDay: 10,
  color: '#7C83FD',
  archived: false,
};

describe('buildInvoices', () => {
  // Today is Nov 14: the November invoice closed on the 3rd, December is open.
  const ref = '2026-11-14';

  it('always includes the open invoice, newest first', () => {
    const list = buildInvoices(card, [], ref);
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({ month: '2026-12', status: 'open', totalCents: 0 });
  });

  it('marks past invoices closed until fully paid', () => {
    const list = buildInvoices(
      card,
      [
        { month: '2026-11', totalCents: 50000, paidCents: 20000 },
        { month: '2026-10', totalCents: 30000, paidCents: 30000 },
        { month: '2027-01', totalCents: 10000, paidCents: 0 },
      ],
      ref,
    );
    expect(list.map((i) => [i.month, i.status])).toEqual([
      ['2027-01', 'future'],
      ['2026-12', 'open'],
      ['2026-11', 'closed'],
      ['2026-10', 'paid'],
    ]);
    const nov = list.find((i) => i.month === '2026-11')!;
    expect(remaining(nov)).toBe(30000);
    expect(isPayable(nov)).toBe(true);
    expect(nov.dueDate).toBe('2026-11-10');
  });
});
