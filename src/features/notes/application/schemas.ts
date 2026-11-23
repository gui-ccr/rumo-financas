import { z } from 'zod';

export const NoteInputSchema = z
  .object({
    title: z.string().trim().max(120, 'O título tem no máximo 120 letras').default(''),
    body: z.string().max(5000, 'A nota tem no máximo 5000 letras').default(''),
    remindAt: z.iso.datetime({ message: 'Data de lembrete inválida' }).nullable().default(null),
  })
  .refine((v) => v.title.length > 0 || v.body.trim().length > 0, {
    message: 'Escreva alguma coisa na nota',
    path: ['title'],
  });

export type NoteInput = z.input<typeof NoteInputSchema>;
