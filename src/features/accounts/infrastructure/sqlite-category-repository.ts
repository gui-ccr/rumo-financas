import type { SQLiteDatabase } from 'expo-sqlite';

import { toBool } from '@/shared/infrastructure/database/sql';

import type { Category, CategoryGroup, CategoryKind } from '../domain/category';
import type { CategoryData, CategoryRepository } from '../domain/repositories';

type CategoryRow = {
  id: number;
  name: string;
  kind: CategoryKind;
  grp: CategoryGroup;
  icon: string;
  color: string;
  archived: number;
};

const toCategory = (r: CategoryRow): Category => ({
  id: r.id,
  name: r.name,
  kind: r.kind,
  group: r.grp,
  icon: r.icon,
  color: r.color,
  archived: toBool(r.archived),
});

export class SqliteCategoryRepository implements CategoryRepository {
  constructor(private readonly db: SQLiteDatabase) {}

  async list() {
    const rows = await this.db.getAllAsync<CategoryRow>('SELECT * FROM categories WHERE archived = 0 ORDER BY grp, name');
    return rows.map(toCategory);
  }

  async create(c: CategoryData) {
    const res = await this.db.runAsync('INSERT INTO categories (name, kind, grp, icon, color) VALUES (?, ?, ?, ?, ?)', [
      c.name,
      c.kind,
      c.group,
      c.icon,
      c.color,
    ]);
    return res.lastInsertRowId;
  }

  async update(id: number, c: CategoryData) {
    await this.db.runAsync('UPDATE categories SET name = ?, kind = ?, grp = ?, icon = ?, color = ? WHERE id = ?', [
      c.name,
      c.kind,
      c.group,
      c.icon,
      c.color,
      id,
    ]);
  }

  async archive(id: number) {
    await this.db.runAsync('UPDATE categories SET archived = 1 WHERE id = ?', [id]);
  }

  async usage() {
    const rows = await this.db.getAllAsync<{ category_id: number; uses: number }>(
      `SELECT category_id, COUNT(*) AS uses FROM transactions
       WHERE category_id IS NOT NULL AND date >= date('now', 'localtime', '-90 day')
       GROUP BY category_id`,
    );
    return new Map(rows.map((r) => [r.category_id, r.uses]));
  }
}
