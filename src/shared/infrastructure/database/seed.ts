import type { SQLiteDatabase } from 'expo-sqlite';

import type { CategoryGroup, CategoryKind } from '@/features/accounts/domain/category';

/**
 * Default accounts and categories. `icon` is a key of the icon registry in
 * src/shared/ui/icon.tsx — never an emoji.
 */
const ACCOUNTS = [
  { name: 'Nubank', type: 'checking', color: '#7C83FD' },
  { name: 'Santander', type: 'checking', color: '#E5484D' },
  { name: 'Cartão Nubank', type: 'credit_card', color: '#7C83FD', closing: 3, due: 10 },
  { name: 'Dinheiro', type: 'cash', color: '#C7D2FE' },
] as const;

type SeedCategory = [name: string, kind: CategoryKind, grp: CategoryGroup, icon: string, color: string];

const CATEGORIES: SeedCategory[] = [
  // Moto — income per app
  ['iFood', 'income', 'moto', 'bike', '#E5484D'],
  ['Uber', 'income', 'moto', 'car', '#0D74CE'],
  ['99', 'income', 'moto', 'navigation', '#F5A524'],
  ['Lalamove', 'income', 'moto', 'package', '#F76B15'],
  ['Outros apps', 'income', 'moto', 'smartphone', '#7C83FD'],
  // Moto — costs
  ['Combustível', 'expense', 'moto', 'fuel', '#F76B15'],
  ['Manutenção', 'expense', 'moto', 'wrench', '#8E8C99'],
  ['Pneus e peças', 'expense', 'moto', 'cog', '#5B5BD6'],
  ['Documentos e IPVA', 'expense', 'moto', 'file-text', '#978365'],
  ['Alimentação na rua', 'expense', 'moto', 'sandwich', '#E5484D'],
  // Dev
  ['Freela', 'income', 'dev', 'code', '#30A46C'],
  ['Salário', 'income', 'dev', 'briefcase', '#12A594'],
  ['Ferramentas e SaaS', 'expense', 'dev', 'cloud', '#7C83FD'],
  ['Equipamento', 'expense', 'dev', 'laptop', '#6E56CF'],
  // Casa
  ['Aluguel', 'expense', 'casa', 'home', '#3E63DD'],
  ['Luz', 'expense', 'casa', 'zap', '#F5A524'],
  ['Água', 'expense', 'casa', 'droplet', '#0090FF'],
  ['Internet', 'expense', 'casa', 'wifi', '#7C83FD'],
  ['Celular', 'expense', 'casa', 'smartphone', '#5B5BD6'],
  ['Mercado', 'expense', 'casa', 'shopping-cart', '#30A46C'],
  // Pessoal
  ['Restaurante', 'expense', 'pessoal', 'utensils', '#E5484D'],
  ['Lazer', 'expense', 'pessoal', 'gamepad', '#8E4EC6'],
  ['Saúde', 'expense', 'pessoal', 'heart-pulse', '#E54666'],
  ['Transporte', 'expense', 'pessoal', 'bus', '#0090FF'],
  ['Compras', 'expense', 'pessoal', 'shopping-bag', '#D6409F'],
  ['Assinaturas', 'expense', 'pessoal', 'repeat', '#7C83FD'],
  ['Outros gastos', 'expense', 'pessoal', 'circle-dashed', '#8E8C99'],
  ['Outras entradas', 'income', 'pessoal', 'plus-circle', '#30A46C'],
];

export async function seed(db: SQLiteDatabase) {
  for (const [i, a] of ACCOUNTS.entries()) {
    await db.runAsync(
      'INSERT INTO accounts (name, type, color, closing_day, due_day, sort) VALUES (?, ?, ?, ?, ?, ?)',
      a.name,
      a.type,
      a.color,
      'closing' in a ? a.closing : null,
      'due' in a ? a.due : null,
      i,
    );
  }
  for (const [name, kind, grp, icon, color] of CATEGORIES) {
    await db.runAsync(
      'INSERT INTO categories (name, kind, grp, icon, color) VALUES (?, ?, ?, ?, ?)',
      name,
      kind,
      grp,
      icon,
      color,
    );
  }
}
