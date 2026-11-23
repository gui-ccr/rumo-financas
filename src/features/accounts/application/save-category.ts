import { parseInput } from '@/shared/application/parse-input';

import type { CategoryRepository } from '../domain/repositories';
import { CategoryInputSchema, type CategoryInput } from './schemas';

export class SaveCategory {
  constructor(private readonly categories: CategoryRepository) {}

  async execute(input: CategoryInput, id?: number): Promise<number> {
    const data = parseInput(CategoryInputSchema, input);
    if (id) {
      await this.categories.update(id, data);
      return id;
    }
    return this.categories.create(data);
  }
}

export class ArchiveCategory {
  constructor(private readonly categories: CategoryRepository) {}

  execute(id: number) {
    return this.categories.archive(id);
  }
}
