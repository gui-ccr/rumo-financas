/** "?, ?, ?" for an IN clause. */
export function placeholders(count: number): string {
  return Array.from({ length: count }, () => '?').join(', ');
}

export const toBool = (v: number | null | undefined) => v === 1;
export const fromBool = (v: boolean) => (v ? 1 : 0);
