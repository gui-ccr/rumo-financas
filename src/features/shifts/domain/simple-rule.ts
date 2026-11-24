import { buildPatternFromExample, type PatternFromExample } from './build-pattern-from-example';
import { bankForPackage, KNOWN_BANKS, type KnownBank } from './known-banks';

/** Chip id of "Outro app": the package is typed by hand. */
export const OTHER_APP = 'other';

/** What the simple form holds. Everything else (name, pattern, package) is derived from it. */
export type SimpleRuleDraft = {
  /** A KnownBank id, OTHER_APP, or null while nothing is picked. */
  bankId: string | null;
  /** The package typed for "Outro app". */
  customPackage: string;
  /** A notification of Pix received, as the user pasted it. */
  example: string;
  /** The name typed by the user; empty means the suggested name. */
  name: string;
};

export type SimpleRule = {
  name: string;
  packageName: string;
  textPattern: string;
  /** Why the rule cannot be saved yet, in plain Portuguese; null when it can. */
  error: string | null;
  /** Result for the example, to show the amount the rule reads (or why it cannot). */
  example: PatternFromExample;
};

/** "Pix do Nubank" for a known bank, "Pix recebido" otherwise. */
export function suggestRuleName(bank: KnownBank | null): string {
  return bank ? `Pix do ${bank.name}` : 'Pix recebido';
}

/**
 * A draft for a package and an example text: the chip of its bank, or "Outro app" with the package typed.
 * Used to open the form from an unrecognized notification, or to start from an existing rule's package.
 */
export function draftForPackage(packageName: string, example: string): SimpleRuleDraft {
  const bank = bankForPackage(packageName);
  const pkg = packageName.trim();
  return {
    bankId: bank?.id ?? (pkg ? OTHER_APP : null),
    customPackage: bank ? '' : pkg,
    example,
    name: '',
  };
}

/** The rule the simple form saves: package from the bank (or the typed package), pattern from the example. */
export function buildSimpleRule(draft: SimpleRuleDraft): SimpleRule {
  const bank = KNOWN_BANKS.find((b) => b.id === draft.bankId) ?? null;
  const packageName = bank ? bank.packageName : draft.bankId === OTHER_APP ? draft.customPackage.trim() : '';
  const example = buildPatternFromExample(draft.example);

  let error: string | null = null;
  if (!packageName) error = 'Escolha o banco ou informe o pacote do app.';
  else if (!example.ok) error = example.error;

  return {
    name: draft.name.trim() || suggestRuleName(bank),
    packageName,
    textPattern: example.ok ? example.pattern : '',
    error,
    example,
  };
}
