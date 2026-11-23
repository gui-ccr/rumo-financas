import { z } from 'zod';

export const AccountInputSchema = z
  .object({
    name: z.string().trim().min(1, 'Dê um nome para a conta').max(40),
    type: z.enum(['checking', 'credit_card', 'cash']),
    initialBalanceCents: z.number().int().default(0),
    closingDay: z.number().int().min(1).max(31).nullable().default(null),
    dueDay: z.number().int().min(1).max(31).nullable().default(null),
    color: z.string(),
  })
  .refine((v) => v.type !== 'credit_card' || (v.closingDay && v.dueDay), {
    message: 'Cartão precisa do dia de fechamento e do vencimento',
    path: ['closingDay'],
  })
  .transform((v) => (v.type === 'credit_card' ? v : { ...v, closingDay: null, dueDay: null }));
export type AccountInput = z.input<typeof AccountInputSchema>;

export const CategoryInputSchema = z.object({
  name: z.string().trim().min(1, 'Dê um nome para a categoria').max(30),
  kind: z.enum(['expense', 'income']),
  group: z.enum(['moto', 'dev', 'casa', 'pessoal']),
  icon: z.string().min(1),
  color: z.string(),
});
export type CategoryInput = z.input<typeof CategoryInputSchema>;
