import { hourlyCents, shiftDurationMinutes } from '../shift';

describe('shiftDurationMinutes', () => {
  const start = '2026-11-23T19:00:00.000Z';

  it('measures to the end when the shift is closed', () => {
    expect(shiftDurationMinutes(start, '2026-11-23T21:30:00.000Z', 0)).toBe(150);
  });

  it('measures to the given "now" while the shift is open', () => {
    expect(shiftDurationMinutes(start, null, Date.parse('2026-11-23T20:14:59.000Z'))).toBe(74);
  });

  it('is never negative', () => {
    expect(shiftDurationMinutes(start, null, Date.parse('2026-11-23T18:00:00.000Z'))).toBe(0);
  });
});

describe('hourlyCents', () => {
  it('divides the total by the hours worked, rounded to cents', () => {
    expect(hourlyCents(18640, 120)).toBe(9320);
    expect(hourlyCents(10000, 90)).toBe(6667);
  });

  it('is null under one minute, where the rate means nothing', () => {
    expect(hourlyCents(5000, 0)).toBeNull();
  });
});
