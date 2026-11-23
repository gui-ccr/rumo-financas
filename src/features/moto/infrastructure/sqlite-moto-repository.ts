import type { SQLiteDatabase } from 'expo-sqlite';

import type { ISODate } from '@/shared/domain/dates';

import type { MotoRepository } from '../domain/moto-repository';

export class SqliteMotoRepository implements MotoRepository {
  constructor(private readonly db: SQLiteDatabase) {}

  async entries(start: ISODate, end: ISODate) {
    const rows = await this.db.getAllAsync<{
      date: string;
      kind: 'income' | 'expense';
      id: number;
      name: string;
      icon: string;
      color: string;
      total: number;
    }>(
      `SELECT t.date, t.type AS kind, c.id, c.name, c.icon, c.color, SUM(t.amount_cents) AS total
       FROM transactions t JOIN categories c ON c.id = t.category_id
       WHERE c.grp = 'moto' AND t.type IN ('income', 'expense') AND t.date BETWEEN ? AND ?
       GROUP BY t.date, t.type, c.id ORDER BY t.date`,
      [start, end],
    );
    return rows.map((r) => ({
      date: r.date,
      kind: r.kind,
      categoryId: r.id,
      name: r.name,
      icon: r.icon,
      color: r.color,
      totalCents: r.total,
    }));
  }
}
