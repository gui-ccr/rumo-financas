import { z } from 'zod';

import { compilePattern } from '../domain/parse-pix-notification';

/** A pattern must compile and, for the text pattern, have a group that holds the amount. */
const hasGroup = (pattern: string) => (compilePattern(`${pattern}|`)?.exec('')?.length ?? 0) > 1;

export const StartShiftInputSchema = z.object({
  categoryId: z.number().int({ message: 'Escolha a categoria de entrada' }),
  accountId: z.number().int({ message: 'Escolha a conta que recebe' }),
});
export type StartShiftInput = z.input<typeof StartShiftInputSchema>;

export const CaptureChangesInputSchema = z
  .object({
    amountCents: z.number().int().positive({ message: 'Informe um valor maior que zero' }).optional(),
    included: z.boolean().optional(),
  })
  .refine((v) => v.amountCents !== undefined || v.included !== undefined, { message: 'Nada para alterar' });
export type CaptureChangesInput = z.input<typeof CaptureChangesInputSchema>;

export const ReportedTotalInputSchema = z
  .number()
  .int({ message: 'Informe um valor em centavos' })
  .nonnegative({ message: 'O valor não pode ser negativo' })
  .nullable();

export const NotificationRuleInputSchema = z
  .object({
    name: z.string().trim().min(1, 'Dê um nome à regra').max(60, 'O nome tem no máximo 60 letras'),
    packageName: z
      .string()
      .trim()
      .regex(/^[A-Za-z][A-Za-z0-9_]*(\.[A-Za-z0-9_]+)+$/, 'Pacote inválido, por exemplo com.nu.production'),
    titlePattern: z.string().nullable().default(null),
    textPattern: z.string().trim().min(1, 'Informe o padrão do texto'),
  })
  .superRefine((v, ctx) => {
    if (v.titlePattern?.trim() && !compilePattern(v.titlePattern.trim())) {
      ctx.addIssue({ code: 'custom', message: 'Padrão do título inválido', path: ['titlePattern'] });
    }
    if (!compilePattern(v.textPattern)) {
      ctx.addIssue({ code: 'custom', message: 'Padrão do texto inválido', path: ['textPattern'] });
    } else if (!hasGroup(v.textPattern)) {
      ctx.addIssue({
        code: 'custom',
        message: 'O padrão do texto precisa de um grupo ( ) para o valor',
        path: ['textPattern'],
      });
    }
  });
export type NotificationRuleInput = z.input<typeof NotificationRuleInputSchema>;
