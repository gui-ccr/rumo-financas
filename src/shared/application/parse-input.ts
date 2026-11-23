import type { z } from 'zod';

import { DomainError } from '../domain/errors';

/** Validate input at the application boundary; the first issue becomes a user-facing error. */
export function parseInput<S extends z.ZodType>(schema: S, input: unknown): z.output<S> {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw new DomainError(result.error.issues[0]?.message ?? 'Dados inválidos');
  }
  return result.data;
}
