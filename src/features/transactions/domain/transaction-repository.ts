import type { NewTransaction, TransactionFilters, TransactionView } from './transaction';

export type TransactionChanges = Pick<
  NewTransaction,
  'amountCents' | 'date' | 'description' | 'categoryId' | 'accountId' | 'invoiceMonth'
>;

export interface TransactionRepository {
  list(filters: TransactionFilters): Promise<TransactionView[]>;
  recent(limit: number): Promise<TransactionView[]>;
  findById(id: number): Promise<TransactionView | null>;
  idsInInstallmentGroup(groupId: string): Promise<number[]>;
  insert(data: NewTransaction): Promise<number>;
  update(id: number, changes: TransactionChanges): Promise<void>;
  delete(ids: number[]): Promise<void>;
}
