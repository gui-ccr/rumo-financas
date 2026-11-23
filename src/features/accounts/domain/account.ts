export type AccountType = 'checking' | 'credit_card' | 'cash';

export type Account = {
  id: number;
  name: string;
  type: AccountType;
  initialBalanceCents: number;
  closingDay: number | null;
  dueDay: number | null;
  color: string;
  archived: boolean;
};

export type CreditCard = Account & { type: 'credit_card'; closingDay: number; dueDay: number };

export function isCreditCard(account: Account): account is CreditCard {
  return account.type === 'credit_card' && account.closingDay !== null && account.dueDay !== null;
}

export type AccountBalance = Pick<Account, 'id' | 'name' | 'type' | 'color'> & { balanceCents: number };

export const ACCOUNT_TYPE_LABEL: Record<AccountType, string> = {
  checking: 'Conta',
  credit_card: 'Cartão de crédito',
  cash: 'Dinheiro',
};

/** Money you can actually spend: bank accounts and cash, not card limits. */
export function availableBalance(balances: AccountBalance[]): number {
  return balances.filter((b) => b.type !== 'credit_card').reduce((sum, b) => sum + b.balanceCents, 0);
}

/** Card balances are negative while there is spending not yet paid. */
export function cardDebt(balances: AccountBalance[]): number {
  return balances.filter((b) => b.type === 'credit_card').reduce((sum, b) => sum + Math.min(b.balanceCents, 0), 0);
}
