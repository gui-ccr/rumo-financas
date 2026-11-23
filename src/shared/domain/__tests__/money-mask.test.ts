import { centsFromMaskedText, maskAmount, MAX_MASKED_DIGITS } from '../money';

/** What the field does on a keystroke: the new text is the shown text plus the key. */
const type = (cents: number | null, key: string) => centsFromMaskedText(`${maskAmount(cents)}${key}`);
/** Backspace removes the last character of the shown text. */
const backspace = (cents: number | null) => centsFromMaskedText(maskAmount(cents).slice(0, -1));

describe('centsFromMaskedText', () => {
  it('reads only the digits, from the right: 1 is R$ 0,01', () => {
    expect(centsFromMaskedText('1')).toBe(1);
    expect(centsFromMaskedText('12')).toBe(12);
  });

  it('ignores the mask characters of a formatted value', () => {
    expect(centsFromMaskedText('1.234,56')).toBe(123456);
    expect(centsFromMaskedText('R$ 12,30')).toBe(1230);
  });

  it('is zero for empty or non-numeric text', () => {
    expect(centsFromMaskedText('')).toBe(0);
    expect(centsFromMaskedText('R$ ')).toBe(0);
  });

  it('ignores digits beyond the maximum length instead of changing the amount', () => {
    const max = '9'.repeat(MAX_MASKED_DIGITS);
    expect(centsFromMaskedText(max)).toBe(Number(max));
    expect(centsFromMaskedText(`${max}5`)).toBe(Number(max));
  });
});

describe('maskAmount', () => {
  it('formats cents as pt-BR without the currency symbol', () => {
    expect(maskAmount(1)).toBe('0,01');
    expect(maskAmount(123456)).toBe('1.234,56');
    expect(maskAmount(100000000)).toBe('1.000.000,00');
  });

  it('is empty for no value and for zero, so the placeholder shows', () => {
    expect(maskAmount(null)).toBe('');
    expect(maskAmount(0)).toBe('');
  });
});

describe('typing and backspace, as the field does them', () => {
  it('fills from the right: typing 1 2 3 4 5 6 gives 1.234,56', () => {
    let cents: number | null = null;
    for (const key of ['1', '2', '3', '4', '5', '6']) {
      cents = type(cents, key) || null;
    }
    expect(cents).toBe(123456);
    expect(maskAmount(cents)).toBe('1.234,56');
  });

  it('a single digit becomes cents: 1 is 0,01 and 15 is 0,15', () => {
    expect(maskAmount(type(null, '1') || null)).toBe('0,01');
    expect(maskAmount(type(1, '5') || null)).toBe('0,15');
  });

  it('backspace removes the last digit, and clears back to empty', () => {
    expect(backspace(123456)).toBe(12345); // "1.234,56" -> "1.234,5"
    expect(maskAmount(backspace(123456) || null)).toBe('123,45');
    expect(backspace(1)).toBe(0); // "0,01" -> "0,0"
    expect(maskAmount(backspace(1) || null)).toBe('');
  });

  it('typing zeros first does not show a leading zero amount', () => {
    expect(maskAmount(type(null, '0') || null)).toBe('');
    expect(maskAmount(type(0, '7') || null)).toBe('0,07');
  });
});
