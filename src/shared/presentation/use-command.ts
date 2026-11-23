import { useMutation, useQueryClient, type QueryClient, type QueryKey } from '@tanstack/react-query';

import { DomainError } from '@/shared/domain/errors';

export type CommandOptions = {
  /** Query roots this command changes. Only queries under these roots are refetched. */
  keys: QueryKey[];
  /** Runs after the keys are invalidated (for example, re-scheduling reminders). */
  after?: () => void;
};

/** Refetches the active queries under each key. Inactive ones are only marked stale. */
export function invalidateKeys(qc: QueryClient, keys: QueryKey[]): Promise<unknown> {
  return Promise.all(keys.map((queryKey) => qc.invalidateQueries({ queryKey })));
}

/**
 * Wraps a write use case. On success, only the query roots named in `keys` are
 * invalidated, so a command refetches what it can change and nothing else.
 */
export function useCommand<TArgs, TResult>(run: (args: TArgs) => Promise<TResult>, options: CommandOptions) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: run,
    onSuccess: async () => {
      await invalidateKeys(qc, options.keys);
      options.after?.();
    },
  });
}

/** User-facing message for any thrown error. */
export function errorMessage(error: unknown): string {
  if (error instanceof DomainError) return error.message;
  return 'Não foi possível salvar. Tente de novo.';
}
