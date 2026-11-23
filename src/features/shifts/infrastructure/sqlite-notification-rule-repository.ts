import type { SQLiteDatabase } from 'expo-sqlite';

import { toBool } from '@/shared/infrastructure/database/sql';

import type { NotificationRule, NotificationRuleContent } from '../domain/notification-rule';
import type { NotificationRuleRepository } from '../domain/notification-rule-repository';

type RuleRow = {
  id: number;
  name: string;
  package_name: string;
  title_pattern: string | null;
  text_pattern: string;
  active: number;
};

const toRule = (r: RuleRow): NotificationRule => ({
  id: r.id,
  name: r.name,
  packageName: r.package_name,
  titlePattern: r.title_pattern,
  textPattern: r.text_pattern,
  active: toBool(r.active),
});

export class SqliteNotificationRuleRepository implements NotificationRuleRepository {
  constructor(private readonly db: SQLiteDatabase) {}

  async list() {
    const rows = await this.db.getAllAsync<RuleRow>('SELECT * FROM notification_rules ORDER BY name, id');
    return rows.map(toRule);
  }

  async listActive() {
    const rows = await this.db.getAllAsync<RuleRow>(
      'SELECT * FROM notification_rules WHERE active = 1 ORDER BY name, id',
    );
    return rows.map(toRule);
  }

  async findById(id: number) {
    const row = await this.db.getFirstAsync<RuleRow>('SELECT * FROM notification_rules WHERE id = ?', [id]);
    return row ? toRule(row) : null;
  }

  async create(c: NotificationRuleContent) {
    const res = await this.db.runAsync(
      'INSERT INTO notification_rules (name, package_name, title_pattern, text_pattern, active) VALUES (?, ?, ?, ?, 1)',
      [c.name, c.packageName, c.titlePattern, c.textPattern],
    );
    return res.lastInsertRowId;
  }

  async update(id: number, c: NotificationRuleContent) {
    await this.db.runAsync(
      'UPDATE notification_rules SET name = ?, package_name = ?, title_pattern = ?, text_pattern = ? WHERE id = ?',
      [c.name, c.packageName, c.titlePattern, c.textPattern, id],
    );
  }

  async setActive(id: number, active: boolean) {
    await this.db.runAsync('UPDATE notification_rules SET active = ? WHERE id = ?', [active ? 1 : 0, id]);
  }

  async delete(id: number) {
    await this.db.runAsync('DELETE FROM notification_rules WHERE id = ?', [id]);
  }
}
