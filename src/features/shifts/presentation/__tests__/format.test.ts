import { formatClock, formatDuration, formatShiftStart, pluralPix } from '../format';

describe('formatDuration', () => {
  it('shows hours and two-digit minutes once an hour has passed', () => {
    expect(formatDuration(134)).toBe('2h14');
    expect(formatDuration(60)).toBe('1h00');
  });

  it('shows minutes under an hour', () => {
    expect(formatDuration(45)).toBe('45 min');
    expect(formatDuration(0)).toBe('0 min');
  });
});

describe('formatClock and formatShiftStart', () => {
  // Built from local time so the assertion holds in any timezone.
  const local = new Date(2026, 10, 23, 19, 5).toISOString();

  it('formats the local clock with two digits', () => {
    expect(formatClock(local)).toBe('19:05');
  });

  it('formats day and clock', () => {
    expect(formatShiftStart(local)).toBe('23 nov · 19:05');
  });
});

describe('pluralPix', () => {
  it('pluralizes Pix', () => {
    expect(pluralPix(1)).toBe('1 Pix');
    expect(pluralPix(7)).toBe('7 Pix');
  });
});
