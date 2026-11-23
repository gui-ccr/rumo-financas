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
});
export type BillInput = z.input<typeof BillInputSchema>;

export const PayBillInputSchema = z.object({
  amountCents: z.number().int().positive('Informe quanto foi pago'),
  accountId: z.number().int({ message: 'Escolha a conta que pagou' }),
  categoryId: z.number().int().nullable(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});
export type PayBillInput = z.input<typeof PayBillInputSchema>;
