import type { QueryKey } from '@tanstack/react-query';

/**
 * Roots of every query key in the app. A query key starts with one of these,
 * so invalidating a root refetches every query under it.
 * The home/dashboard reads `overview`; `plan` is the payment plan.
 */
export const QK = {
  accounts: ['accounts'],
  categories: ['categories'],
  transactions: ['transactions'],
  bills: ['bills'],
  incomes: ['incomes'],
  invoices: ['invoices'],
  overview: ['overview'],
  moto: ['moto'],
  plan: ['plan'],
  notes: ['notes'],
  agenda: ['agenda'],
} as const satisfies Record<string, QueryKey>;

/**
 * Whatever a money movement changes: a transaction, a bill payment, a receipt,
 * an invoice payment. Commands that move money name these roots plus their own.
 */
export const MONEY_KEYS: QueryKey[] = [
  QK.transactions,
  QK.accounts,
  QK.overview,
  QK.invoices,
  QK.categories, // "most used" ordering counts transactions
  QK.moto,
  QK.plan,
  QK.agenda, // the agenda lists due bills, expected incomes and their payments
];

/** Every root. Only for operations that replace all data, such as restoring a backup. */
export const ALL_KEYS: QueryKey[] = Object.values(QK);
