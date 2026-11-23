import type { SQLiteDatabase } from 'expo-sqlite';

import type { CategoryGroup } from '@/features/accounts/domain/category';
import { monthRange, type MonthKey } from '@/shared/domain/dates';

import type { OverviewRepository } from '../domain/overview-repository';

export class SqliteOverviewRepository implements OverviewRepository {
  constructor(private readonly db: SQLiteDatabase) {}

  async monthTotals(month: MonthKey) {
    const { start, end } = monthRange(month);
    const row = await this.db.getFirstAsync<{ income: number | null; expense: number | null }>(
      `SELECT
         SUM(CASE WHEN type = 'income' THEN amount_cents END) AS income,
         SUM(CASE WHEN type = 'expense' THEN amount_cents END) AS expense
       FROM transactions WHERE date BETWEEN ? AND ?`,
      [start, end],
    );
    return { incomeCents: row?.income ?? 0, expenseCents: row?.expense ?? 0 };
  }

  async spendByCategory(month: MonthKey) {
    const { start, end } = monthRange(month);
    const rows = await this.db.getAllAsync<{
      id: number;
      name: string;
      icon: string;
      color: string;
      grp: CategoryGroup;
      total: number;
    }>(
      `SELECT c.id, c.name, c.icon, c.color, c.grp, SUM(t.amount_cents) AS total
       FROM transactions t JOIN categories c ON c.id = t.category_id
       WHERE t.type = 'expense' AND t.date BETWEEN ? AND ?
       GROUP BY c.id ORDER BY total DESC`,
      [start, end],
    );
    return rows.map((r) => ({
      categoryId: r.id,
      name: r.name,
      icon: r.icon,
      color: r.color,
      group: r.grp,
      totalCents: r.total,
    }));
  }

  async dailyFlow(month: MonthKey) {
    const { start, end } = monthRange(month);
    const rows = await this.db.getAllAsync<{ date: string; income: number; expense: number }>(
      `SELECT date,
         COALESCE(SUM(CASE WHEN type = 'income' THEN amount_cents END), 0) AS income,
         COALESCE(SUM(CASE WHEN type = 'expense' THEN amount_cents END), 0) AS expense
       FROM transactions WHERE date BETWEEN ? AND ? AND type != 'transfer'
       GROUP BY date ORDER BY date`,
      [start, end],
    );
    return rows.map((r) => ({ date: r.date, incomeCents: r.income, expenseCents: r.expense }));
  }
}
