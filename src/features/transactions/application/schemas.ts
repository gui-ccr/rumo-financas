import { z } from 'zod';

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida');
const amount = z.number().int().positive('Informe um valor maior que zero');

export const NewTransactionInputSchema = z
  .object({
    type: z.enum(['expense', 'income', 'transfer']),
    amountCents: amount,
    date: isoDate,
    description: z.string().trim().max(120).default(''),
    categoryId: z.number().int().nullable(),
    accountId: z.number().int({ message: 'Escolha uma conta' }),
    toAccountId: z.number().int().nullable().default(null),
    installments: z.number().int().min(1).max(48).default(1),
    billOccurrenceId: z.number().int().nullable().default(null),
    /** "notification" for income captured from a bank notification (driving mode). */
    source: z.enum(['manual', 'notification']).default('manual'),
    rawText: z.string().max(2000).nullable().default(null),
  })
  .refine((v) => v.type === 'transfer' || v.categoryId !== null, {
    message: 'Escolha uma categoria',
    path: ['categoryId'],
  })
  .refine((v) => v.type !== 'transfer' || (v.toAccountId !== null && v.toAccountId !== v.accountId), {
    message: 'Escolha uma conta de destino diferente da origem',
    path: ['toAccountId'],
  });
export type NewTransactionInput = z.input<typeof NewTransactionInputSchema>;

export const EditTransactionInputSchema = z.object({
  amountCents: amount,
  date: isoDate,
  description: z.string().trim().max(120),
  categoryId: z.number().int().nullable(),
  accountId: z.number().int(),
});
export type EditTransactionInput = z.input<typeof EditTransactionInputSchema>;
