import { KNOWN_BANKS, bankNameForPackage } from '../known-banks';
import { buildSimpleRule, draftForPackage, OTHER_APP, suggestRuleName } from '../simple-rule';

const EXAMPLE = 'Você recebeu um Pix de R$ 25,00 de Fulano de Tal.';

describe('known-banks', () => {
  it('lista os 11 bancos do modo simples, cada um com pacote único', () => {
    expect(KNOWN_BANKS).toHaveLength(11);
    expect(new Set(KNOWN_BANKS.map((b) => b.packageName)).size).toBe(11);
  });

  it('dá o nome amigável do banco pelo pacote, sem diferenciar maiúsculas', () => {
    expect(bankNameForPackage('com.nu.production')).toBe('Nubank');
    expect(bankNameForPackage('br.com.gabba.caixa')).toBe('Caixa');
    expect(bankNameForPackage('br.com.gabba.Caixa')).toBe('Caixa');
  });

  it('devolve null para um app que não é banco conhecido', () => {
    expect(bankNameForPackage('com.whatsapp')).toBeNull();
  });
});

describe('buildSimpleRule', () => {
  it('monta pacote do banco, nome sugerido e padrão do exemplo', () => {
    const built = buildSimpleRule({ bankId: 'nubank', customPackage: '', example: EXAMPLE, name: '' });
    expect(built).toMatchObject({ name: 'Pix do Nubank', packageName: 'com.nu.production', error: null });
    expect(built.textPattern).not.toBe('');
  });

  it('usa o nome digitado no lugar do sugerido', () => {
    const built = buildSimpleRule({ bankId: 'inter', customPackage: '', example: EXAMPLE, name: '  Minha conta  ' });
    expect(built.name).toBe('Minha conta');
  });

  it('em "Outro app" usa o pacote digitado, sem as bordas', () => {
    const built = buildSimpleRule({ bankId: OTHER_APP, customPackage: ' com.exemplo.app ', example: EXAMPLE, name: '' });
    expect(built).toMatchObject({ packageName: 'com.exemplo.app', name: 'Pix recebido', error: null });
  });

  it('bloqueia o salvamento sem banco escolhido', () => {
    expect(buildSimpleRule({ bankId: null, customPackage: '', example: EXAMPLE, name: '' }).error).toMatch(/banco/);
  });

  it('bloqueia o salvamento com um exemplo que não tem valor em reais', () => {
    const built = buildSimpleRule({ bankId: 'nubank', customPackage: '', example: 'Você recebeu um Pix.', name: '' });
    expect(built.error).toBe('Não achei um valor em reais nesse texto');
    expect(built.textPattern).toBe('');
  });

  it('abre o formulário de um app desconhecido com o pacote e o texto da notificação', () => {
    const draft = draftForPackage('com.exemplo.app', EXAMPLE);
    expect(draft).toEqual({ bankId: OTHER_APP, customPackage: 'com.exemplo.app', example: EXAMPLE, name: '' });
    expect(draftForPackage('com.nu.production', EXAMPLE)).toMatchObject({ bankId: 'nubank', customPackage: '' });
  });

  it('sem pacote no capture, fica sem banco escolhido e com o texto preenchido', () => {
    expect(draftForPackage('', EXAMPLE)).toEqual({ bankId: null, customPackage: '', example: EXAMPLE, name: '' });
  });

  it('suggestRuleName usa o banco ou "Pix recebido"', () => {
    expect(suggestRuleName(KNOWN_BANKS[0])).toBe('Pix do Nubank');
    expect(suggestRuleName(null)).toBe('Pix recebido');
  });
});
