import { parseInput } from '@/shared/application/parse-input';

import type { AccountRepository } from '../domain/repositories';
import { AccountInputSchema, type AccountInput } from './schemas';

export class SaveAccount {
  constructor(private readonly accounts: AccountRepository) {}

  async execute(input: AccountInput, id?: number): Promise<number> {
    const data = parseInput(AccountInputSchema, input);
    if (id) {
      await this.accounts.update(id, data);
      return id;
    }
    return this.accounts.create(data);
  }
}

/** Accounts with history are archived, never deleted, so old transactions keep their account. */
export class ArchiveAccount {
  constructor(private readonly accounts: AccountRepository) {}

  execute(id: number) {
    return this.accounts.archive(id);
  }
}
