import { appendDigit, formatBRL, parseBRL, removeDigit, splitInstallments } from '../money';

describe('money', () => {
  it('formats cents as BRL', () => {
    expect(formatBRL(123456)).toBe('R$ 1.234,56');
    expect(formatBRL(5)).toBe('R$ 0,05');
    expect(formatBRL(-2500)).toBe('-R$ 25,00');
  });

  it('parses user input', () => {
    expect(parseBRL('1.234,56')).toBe(123456);
    expect(parseBRL('R$ 12')).toBe(1200);
    expect(parseBRL('12,5')).toBe(1250);
    expect(parseBRL('19.90')).toBe(1990);
    expect(parseBRL('abc')).toBeNull();
    expect(parseBRL('')).toBeNull();
  });

  it('keypad shifts digits in from the right', () => {
    let v = 0;
    for (const d of ['4', '5', '9', '0']) v = appendDigit(v, d);
    expect(v).toBe(4590);
    expect(removeDigit(v)).toBe(459);
  });

  it('splits installments without losing cents', () => {
    expect(splitInstallments(10000, 3)).toEqual([3334, 3333, 3333]);
    expect(splitInstallments(10000, 3).reduce((a, b) => a + b)).toBe(10000);
    expect(splitInstallments(500, 1)).toEqual([500]);
  });
});
