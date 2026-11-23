import type { NotificationRule } from '../notification-rule';
import { parseBrlToCents, parsePixNotification } from '../parse-pix-notification';

/** The same pattern the migration seeds for Nubank. */
const NUBANK_TEXT =
  'voc[êe]\\s+recebeu\\s+.*?R\\$\\s*(?<valor>\\d{1,3}(?:\\.\\d{3})*(?:,\\d{1,2})?|\\d+(?:,\\d{1,2})?)(?:\\s+de\\s+(?<pagador>.+?))?\\.?\\s*$';

const NUBANK_RULE: NotificationRule = {
  id: 1,
  name: 'Nubank — Pix recebido',
  packageName: 'com.nu.production',
  titlePattern: 'Pix recebido|Transfer[êe]ncia recebida',
  textPattern: NUBANK_TEXT,
  active: true,
};

const NUBANK = 'com.nu.production';

/** Builds a capture; `text` is the collapsed text, `bigText` the expanded one (null by default). */
const capture = (title: string | null, text: string | null, extra: { bigText?: string | null; packageName?: string } = {}) => ({
  packageName: extra.packageName ?? NUBANK,
  title,
  text,
  bigText: extra.bigText ?? null,
});

describe('parseBrlToCents', () => {
  it.each([
    ['1.234,56', 123456],
    ['25,00', 2500],
    ['25,5', 2550],
    ['25', 2500],
    ['1234', 123400],
    ['1.234', 123400],
    ['0,99', 99],
    ['1.000.000,01', 100000001],
  ])('reads "%s" as %i cents', (text, cents) => {
    expect(parseBrlToCents(text)).toBe(cents);
  });

  it.each(['', 'abc', '1,000', '12,345', '1.23', ',50'])('rejects "%s"', (text) => {
    expect(parseBrlToCents(text)).toBeNull();
  });
});

describe('parsePixNotification (Nubank rule)', () => {
  it('reads a transfer received with a payer', () => {
    const r = parsePixNotification(
      capture('Transferência recebida', 'Você recebeu uma transferência de R$ 50,00 de FULANO DE TAL.'),
      [NUBANK_RULE],
    );
    expect(r).toEqual({ ruleId: 1, amountCents: 5000, payer: 'FULANO DE TAL' });
  });

  it('reads a Pix received, dropping the final full stop from the payer', () => {
    const r = parsePixNotification(capture('Pix recebido', 'Você recebeu um Pix de R$ 32,90 de Maria S.'), [NUBANK_RULE]);
    expect(r).toEqual({ ruleId: 1, amountCents: 3290, payer: 'Maria S' });
  });

  it('reads an amount with thousands separator', () => {
    const r = parsePixNotification(capture('Pix recebido', 'Você recebeu um Pix de R$ 1.234,56 de João Pedro.'), [NUBANK_RULE]);
    expect(r).toEqual({ ruleId: 1, amountCents: 123456, payer: 'João Pedro' });
  });

  it('reads an amount without cents', () => {
    const r = parsePixNotification(capture('Pix recebido', 'Você recebeu um Pix de R$25 de Ana.'), [NUBANK_RULE]);
    expect(r).toEqual({ ruleId: 1, amountCents: 2500, payer: 'Ana' });
  });

  it('accepts a non-breaking space between R$ and the amount', () => {
    const r = parsePixNotification(
      capture('Pix recebido', 'Você recebeu um Pix de R$ 25,00 de Carlos.'),
      [NUBANK_RULE],
    );
    expect(r).toEqual({ ruleId: 1, amountCents: 2500, payer: 'Carlos' });
  });

  it('reads a receipt with no payer as null payer', () => {
    const r = parsePixNotification(capture('Pix recebido', 'Você recebeu R$ 25,00.'), [NUBANK_RULE]);
    expect(r).toEqual({ ruleId: 1, amountCents: 2500, payer: null });
  });

  it('is case-insensitive on title and text', () => {
    const r = parsePixNotification(capture('PIX RECEBIDO', 'VOCÊ RECEBEU UM PIX DE R$ 10,00 DE X.'), [NUBANK_RULE]);
    expect(r).toEqual({ ruleId: 1, amountCents: 1000, payer: 'X' });
  });

  it('prefers the expanded text when the notification has one', () => {
    const r = parsePixNotification(
      capture('Pix recebido', 'Você recebeu um Pix…', { bigText: 'Você recebeu um Pix de R$ 40,00 de Lúcia.' }),
      [NUBANK_RULE],
    );
    expect(r).toEqual({ ruleId: 1, amountCents: 4000, payer: 'Lúcia' });
  });

  it('reads a multi-line expanded text', () => {
    const r = parsePixNotification(
      capture('Pix recebido', null, { bigText: 'Você recebeu um Pix\nde R$ 12,00 de Beto.' }),
      [NUBANK_RULE],
    );
    expect(r).toEqual({ ruleId: 1, amountCents: 1200, payer: 'Beto' });
  });

  it.each([
    ['Compra aprovada', 'Compra aprovada de R$ 30,00 em IFOOD.'],
    ['Transferência enviada', 'Você transferiu R$ 100,00 para FULANO.'],
    ['Pix enviado', 'Você enviou um Pix de R$ 15,00 para Maria.'],
    ['Pix enviado', 'Você recebeu um Pix de R$ 15,00 de Maria.'],
    ['Fatura', 'Você recebeu uma fatura de R$ 80,00.'],
    ['Pix recebido', 'Seu Pix foi enviado de R$ 9,00.'],
    [null, 'Você recebeu um Pix de R$ 10,00 de Ana.'],
    ['Pix recebido', null],
    ['Pix recebido', 'Você recebeu um Pix de R$ 0,00 de Ana.'],
  ])('returns null for "%s" / "%s"', (title, text) => {
    expect(parsePixNotification(capture(title, text), [NUBANK_RULE])).toBeNull();
  });

  it('ignores notifications from another app even when the text matches', () => {
    const r = parsePixNotification(
      capture('Pix recebido', 'Você recebeu um Pix de R$ 10,00 de Ana.', { packageName: 'com.whatsapp' }),
      [NUBANK_RULE],
    );
    expect(r).toBeNull();
  });

  it('ignores inactive rules', () => {
    const r = parsePixNotification(capture('Pix recebido', 'Você recebeu um Pix de R$ 10,00 de Ana.'), [
      { ...NUBANK_RULE, active: false },
    ]);
    expect(r).toBeNull();
  });

  it('uses the first rule that matches, in the order given', () => {
    const second: NotificationRule = { ...NUBANK_RULE, id: 2, textPattern: '(?<valor>\\d+)' };
    const r = parsePixNotification(capture('Pix recebido', 'Você recebeu um Pix de R$ 10,00 de Ana.'), [
      NUBANK_RULE,
      second,
    ]);
    expect(r?.ruleId).toBe(1);
  });

  it('skips a rule whose pattern is invalid instead of throwing', () => {
    const broken: NotificationRule = { ...NUBANK_RULE, id: 9, textPattern: '(' };
    const r = parsePixNotification(capture('Pix recebido', 'Você recebeu um Pix de R$ 10,00 de Ana.'), [broken, NUBANK_RULE]);
    expect(r?.ruleId).toBe(1);
  });

  it('matches a rule that has no title pattern on any title', () => {
    const anyTitle: NotificationRule = { ...NUBANK_RULE, titlePattern: null };
    const r = parsePixNotification(capture(null, 'Você recebeu R$ 7,00 de Ana.'), [anyTitle]);
    expect(r).toEqual({ ruleId: 1, amountCents: 700, payer: 'Ana' });
  });

  it('reads the amount from group 1 and the payer from group 2 when the groups are not named', () => {
    const plain: NotificationRule = {
      ...NUBANK_RULE,
      titlePattern: null,
      textPattern: 'recebeu R\\$ ([\\d.,]+) de (.+)',
    };
    const r = parsePixNotification(capture('x', 'Você recebeu R$ 8,50 de Dani'), [plain]);
    expect(r).toEqual({ ruleId: 1, amountCents: 850, payer: 'Dani' });
  });
});
