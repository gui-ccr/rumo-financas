import type { ISODate } from '@/shared/domain/dates';

import type { Account, AccountBalance, AccountType } from './account';
import type { Category, CategoryGroup, CategoryKind } from './category';

export type AccountData = {
  name: string;
  type: AccountType;
  initialBalanceCents: number;
  closingDay: number | null;
  dueDay: number | null;
  color: string;
};

export type CategoryData = {
  name: string;
  kind: CategoryKind;
  group: CategoryGroup;
  icon: string;
  color: string;
};

export interface AccountRepository {
  list(): Promise<Account[]>;
  findById(id: number): Promise<Account | null>;
  create(data: AccountData): Promise<number>;
  update(id: number, data: AccountData): Promise<void>;
  archive(id: number): Promise<void>;
  balances(upTo: ISODate): Promise<AccountBalance[]>;
}

export interface CategoryRepository {
  list(): Promise<Category[]>;
  create(data: CategoryData): Promise<number>;
  update(id: number, data: CategoryData): Promise<void>;
  archive(id: number): Promise<void>;
  /** category id -> number of uses in the last 90 days */
  usage(): Promise<Map<number, number>>;
}
