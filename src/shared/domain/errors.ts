/** A broken business rule. Its message is safe to show to the user. */
export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DomainError';
  }
}

export class NotFoundError extends DomainError {
  constructor(what: string) {
    super(`${what} não encontrado(a)`);
    this.name = 'NotFoundError';
  }
}
