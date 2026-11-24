import { z } from 'zod';

export const BillInputSchema = z.object({
  name: z.string().trim().min(1, 'Dê um nome para a conta').max(60),
  amountCents: z.number().int().positive('Valor precisa ser maior que zero').nullable(),
  categoryId: z.number().int().nullable(),
  accountId: z.number().int().nullable(),
  dueDay: z.number().int().min(1, 'Dia de vencimento inválido').max(31, 'Dia de vencimento inválido'),
  recurrence: z.enum(['monthly', 'once']),
  startMonth: z.string().regex(/^\d{4}-\d{2}$/),
  priority: z.enum(['essential', 'important', 'flexible']).default('important'),
  /** Monthly bills only: how many months it lasts. null or absent = every month. */
  repeatCount: z
    .number()
    .int()
    .min(2, 'Use pelo menos 2 vezes')
    .max(120, 'No máximo 120 vezes')
    .nullable()
    .default(null),
  /** Optional free text. Blank means no notes. */
  notes: z
    .string()
    .trim()
    .max(500, 'A descrição passa de 500 caracteres')
    .transform((v) => (v === '' ? null : v))
    .nullable()
    .default(null),
});
export type BillInput = z.input<typeof BillInputSchema>;

export const PayBillInputSchema = z.object({
  amountCents: z.number().int().positive('Informe quanto foi pago'),
  accountId: z.number().int({ message: 'Escolha a conta que pagou' }),
  categoryId: z.number().int().nullable(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});
export type PayBillInput = z.input<typeof PayBillInputSchema>;
