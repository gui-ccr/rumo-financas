import { buildPatternFromExample, EMPTY_EXAMPLE_MESSAGE, NO_AMOUNT_MESSAGE } from '../build-pattern-from-example';
import type { NotificationRule } from '../notification-rule';
import { parsePixNotification } from '../parse-pix-notification';

const NUBANK = 'com.nu.production';

/** Builds the rule the app would save from the example, then reads a notification with it. */
function readWithGenerated(example: string, text: string, packageName = NUBANK) {
  const built = buildPatternFromExample(example);
  if (!built.ok) throw new Error(`o exemplo não gerou padrão: ${built.error}`);
  const rule: NotificationRule = {
    id: 1,
    name: 'Pix',
    packageName,
    titlePattern: null,
    textPattern: built.pattern,
    active: true,
  };
  return parsePixNotification({ packageName, title: null, text, bigText: null }, [rule]);
}

describe('buildPatternFromExample: exemplos reais de Pix recebido', () => {
  it.each([
    {
      app: 'Nubank com pagador',
      pkg: NUBANK,
      example: 'Você recebeu uma transferência de R$ 25,00 de Fulano de Tal.',
      cents: 2500,
      payer: 'Fulano de Tal',
    },
    {
      app: 'Nubank sem pagador, com ponto final',
      pkg: NUBANK,
      example: 'Você recebeu um Pix de R$ 25,50.',
      cents: 2550,
      payer: null,
    },
    {
      app: 'Inter',
      pkg: 'br.com.intermedium',
      example: 'Pix recebido: R$ 120,00 de MARIA SILVA.',
      cents: 12000,
      payer: 'MARIA SILVA',
    },
    {
      app: 'PicPay, valor sem espaço depois do R$',
      pkg: 'com.picpay',
      example: 'PicPay: você recebeu R$25,50 de João Souza.',
      cents: 2550,
      payer: 'João Souza',
    },
    {
      app: 'valor com separador de milhar',
      pkg: NUBANK,
      example: 'Você recebeu um Pix de R$ 1.234,56 de Empresa XYZ.',
      cents: 123456,
      payer: 'Empresa XYZ',
    },
    {
      app: 'valor sem R$, com vírgula decimal',
      pkg: NUBANK,
      example: 'Pix recebido de 30,00 de Ana.',
      cents: 3000,
      payer: 'Ana',
    },
    {
      app: 'texto com caracteres de regex',
      pkg: NUBANK,
      example: 'Recebido (Pix) + taxa [R$ 10,00].',
      cents: 1000,
      payer: null,
    },
    {
      app: 'nome do pagador com ponto final no meio, cortado na pontuação',
      pkg: NUBANK,
      example: 'Você recebeu um Pix de R$ 9,00 de Ana Maria. Obrigado.',
      cents: 900,
      payer: 'Ana Maria',
    },
  ])('lê o valor e o pagador de: $app', ({ example, pkg, cents, payer }) => {
    const receipt = readWithGenerated(example, example, pkg);
    expect(receipt).toMatchObject({ amountCents: cents, payer });
  });

  it('o padrão gerado de um exemplo vale para outros valores e nomes com o mesmo texto', () => {
    const receipt = readWithGenerated(
      'Você recebeu um Pix de R$ 25,00 de Fulano.',
      'Você recebeu um Pix de R$ 80,90 de Beltrano Costa.',
    );
    expect(receipt).toMatchObject({ amountCents: 8090, payer: 'Beltrano Costa' });
  });

  it('aceita maiúsculas, minúsculas e espaços a mais na notificação real', () => {
    const receipt = readWithGenerated(
      'Você recebeu um Pix de R$ 25,00.',
      'VOCÊ   RECEBEU  um Pix de  R$25,00.',
    );
    expect(receipt).toMatchObject({ amountCents: 2500, payer: null });
  });
});

describe('buildPatternFromExample: resultado', () => {
  it('informa o valor e o pagador reconhecidos', () => {
    expect(buildPatternFromExample('Você recebeu uma transferência de R$ 25,00 de Fulano de Tal.')).toMatchObject({
      ok: true,
      amountText: '25,00',
      payer: 'Fulano de Tal',
    });
  });

  it('pede um exemplo quando o texto está vazio', () => {
    expect(buildPatternFromExample('   ')).toEqual({ ok: false, error: EMPTY_EXAMPLE_MESSAGE });
  });

  it.each([
    'Você recebeu um Pix de Fulano.',
    'Você recebeu 2 Pix hoje.',
  ])('recusa um texto sem valor em reais: "%s"', (example) => {
    expect(buildPatternFromExample(example)).toEqual({ ok: false, error: NO_AMOUNT_MESSAGE });
  });
});
