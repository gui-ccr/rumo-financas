import { buildAgendaDays, daysInRange, lastDayOf, type AgendaSources } from '../agenda';

/** Local-time dates, so the tests hold in any timezone. */
const at = (day: number, hour: number, minute = 0) => new Date(2026, 10, day, hour, minute);
const iso = (day: number, hour: number, minute = 0) => at(day, hour, minute).toISOString();
const ISO = (day: number) => `2026-11-${String(day).padStart(2, '0')}`;

const EMPTY: AgendaSources = { events: [], bills: [], incomes: [], notes: [] };
const range = (from: number, to: number) => ({ start: ISO(from), end: ISO(to) });

describe('buildAgendaDays', () => {
  it('sorts a day with all-day items first, then by time, then by title', () => {
    const out = buildAgendaDays(range(19, 19), {
      ...EMPTY,
      events: [
        { id: 'e2', title: 'Almoço', start: at(19, 12, 30), end: at(19, 13, 30), allDay: false },
        { id: 'e1', title: 'Dentista', start: at(19, 8, 0), end: at(19, 9, 0), allDay: false },
        { id: 'e3', title: 'Academia', start: at(19, 12, 30), end: at(19, 13, 30), allDay: false },
      ],
      bills: [{ id: 7, billId: 7, name: 'Internet', dueDate: ISO(19), amountCents: 12000, paid: false }],
    });
    const titles = out.get(ISO(19))!.map((i) => `${i.allDay ? 'dia' : i.time} ${i.title}`);
    expect(titles).toEqual(['dia Internet', '08:00 Dentista', '12:30 Academia', '12:30 Almoço']);
  });

  it('gives every day of the range a key, empty days included', () => {
    const out = buildAgendaDays(range(19, 21), {
      ...EMPTY,
      bills: [{ id: 1, billId: 1, name: 'Luz', dueDate: ISO(20), amountCents: null, paid: false }],
    });
    expect([...out.keys()]).toEqual([ISO(19), ISO(20), ISO(21)]);
    expect(out.get(ISO(19))).toEqual([]);
    expect(out.get(ISO(21))).toEqual([]);
    expect(out.get(ISO(20))).toHaveLength(1);
  });

  it('marks bills and incomes as all-day, carries their amounts and links the bill to its payment screen', () => {
    const out = buildAgendaDays(range(25, 25), {
      ...EMPTY,
      bills: [{ id: 42, billId: 42, name: 'Aluguel', dueDate: ISO(25), amountCents: 180000, paid: false }],
      incomes: [{ id: 3, name: 'Freela site', expectedDate: ISO(25), expectedCents: 50000, received: false }],
    });
    const [bill, income] = out.get(ISO(25))!;
    expect(bill).toMatchObject({ kind: 'bill', allDay: true, amountCents: 180000, href: '/conta/detalhe/42' });
    expect(bill.time).toBeUndefined();
    expect(income).toMatchObject({ kind: 'income', allDay: true, amountCents: 50000 });
  });

  it('mixes every kind on one day and keeps each source in its own place', () => {
    const out = buildAgendaDays(range(22, 22), {
      events: [{ id: 'ev', title: 'Reunião', start: at(22, 14), end: at(22, 15), allDay: false, color: '#3F8F63' }],
      bills: [{ id: 1, billId: 1, name: 'Cartão', dueDate: ISO(22), amountCents: 9900, paid: false }],
      incomes: [{ id: 2, name: 'Salário', expectedDate: ISO(22), expectedCents: 800000, received: false }],
      notes: [{ id: 5, title: 'Ligar pro contador', remindAt: iso(22, 16, 45), done: false }],
    });
    expect(out.get(ISO(22))!.map((i) => i.kind)).toEqual(['bill', 'income', 'event', 'note']);
    const event = out.get(ISO(22))![2];
    expect(event).toMatchObject({ kind: 'event', time: '14:00', color: '#3F8F63', href: null });
    expect(out.get(ISO(22))![3]).toMatchObject({ kind: 'note', time: '16:45', href: '/nota/5' });
  });

  it('shows an event that crosses midnight on both days: start time first, then an all-day line', () => {
    const out = buildAgendaDays(range(19, 20), {
      ...EMPTY,
      events: [{ id: 'show', title: 'Show', start: at(19, 22), end: at(20, 1), allDay: false }],
    });
    expect(out.get(ISO(19))).toEqual([expect.objectContaining({ title: 'Show', time: '22:00', allDay: false })]);
    expect(out.get(ISO(20))).toEqual([expect.objectContaining({ title: 'Show', time: undefined, allDay: true })]);
  });

  it('spreads a multi-day all-day event over its days, excluding the exclusive end day', () => {
    const out = buildAgendaDays(range(18, 23), {
      ...EMPTY,
      events: [{ id: 'viagem', title: 'Viagem', start: at(19, 0), end: at(22, 0), allDay: true }],
    });
    const hasTrip = (day: number) => (out.get(ISO(day)) ?? []).some((i) => i.title === 'Viagem');
    expect([18, 19, 20, 21, 22, 23].map(hasTrip)).toEqual([false, true, true, true, false, false]);
  });

  it('ignores notes without a reminder, done notes, paid bills, received or undated incomes, and anything outside the range', () => {
    const out = buildAgendaDays(range(19, 19), {
      events: [],
      bills: [
        { id: 1, billId: 1, name: 'Paga', dueDate: ISO(19), amountCents: 100, paid: true },
        { id: 2, billId: 2, name: 'Fora', dueDate: ISO(26), amountCents: 100, paid: false },
      ],
      incomes: [
        { id: 3, name: 'Recebida', expectedDate: ISO(19), expectedCents: 100, received: true },
        { id: 4, name: 'Sem data', expectedDate: null, expectedCents: 100, received: false },
      ],
      notes: [
        { id: 5, title: 'Sem lembrete', remindAt: null, done: false },
        { id: 6, title: 'Feita', remindAt: iso(19, 9), done: true },
        { id: 7, title: 'Lembrete', remindAt: iso(19, 9), done: false },
      ],
    });
    expect(out.get(ISO(19))?.map((i) => i.title)).toEqual(['Lembrete']);
  });

  it('returns an empty map for an inverted range', () => {
    expect(buildAgendaDays(range(20, 19), EMPTY).size).toBe(0);
  });

  it('orders titles with Brazilian Portuguese collation', () => {
    const out = buildAgendaDays(range(19, 19), {
      ...EMPTY,
      bills: [
        { id: 1, billId: 1, name: 'Zelador', dueDate: ISO(19), amountCents: null, paid: false },
        { id: 2, billId: 2, name: 'Água', dueDate: ISO(19), amountCents: null, paid: false },
      ],
    });
    expect(out.get(ISO(19))!.map((i) => i.title)).toEqual(['Água', 'Zelador']);
  });
});

describe('day helpers', () => {
  it('treats an event ending exactly at midnight as ending the day before', () => {
    expect(lastDayOf(at(19, 20), at(20, 0))).toBe(ISO(19));
    expect(lastDayOf(at(19, 20), at(20, 0, 1))).toBe(ISO(20));
  });

  it('lists days from start to end, inclusive', () => {
    expect(daysInRange(range(19, 21))).toEqual([ISO(19), ISO(20), ISO(21)]);
    expect(daysInRange(range(21, 19))).toEqual([]);
  });
});
