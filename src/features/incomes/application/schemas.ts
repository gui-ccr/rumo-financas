import { z } from 'zod';

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida');
const monthKey = z.string().regex(/^\d{4}-\d{2}$/, 'Mês inválido');

export const IncomeInputSchema = z.object({
  name: z.string().trim().min(1, 'Dê um nome para a renda').max(60),
  kind: z.enum(['fixed', 'uncertain']),
  expectedCents: z.number().int().positive('Valor esperado precisa ser maior que zero'),
  accountId: z.number().int({ message: 'Escolha a conta que recebe' }),
  categoryId: z.number().int({ message: 'Escolha uma categoria de entrada' }),
  recurrence: z.enum(['monthly', 'once']).nullable().default(null),
  dueDay: z.number().int().min(1, 'Dia inválido').max(31, 'Dia inválido').nullable().default(null),
  startMonth: monthKey.nullable().default(null),
  note: z.string().trim().max(200).nullable().default(null),
});
export type IncomeInput = z.input<typeof IncomeInputSchema>;

/** Adds a waiting occurrence to an uncertain income. Month is optional; amount defaults to the income's. */
export const ExpectedIncomeInputSchema = z.object({
  incomeId: z.number().int(),
  month: monthKey.nullable().default(null),
  expectedCents: z.number().int().positive('Valor precisa ser maior que zero').nullable().default(null),
});
export type ExpectedIncomeInput = z.input<typeof ExpectedIncomeInputSchema>;

export const ReceiveIncomeInputSchema = z.object({
  amountCents: z.number().int().positive('Informe quanto entrou'),
  date: isoDate,
  accountId: z.number().int({ message: 'Escolha a conta que recebeu' }),
});
export type ReceiveIncomeInput = z.input<typeof ReceiveIncomeInputSchema>;
