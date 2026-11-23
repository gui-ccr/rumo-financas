/**
 * Runs several repository calls atomically.
 * Nested calls join the outer transaction, so use cases can compose freely.
 */
export interface UnitOfWork {
  transaction<T>(work: () => Promise<T>): Promise<T>;
}
