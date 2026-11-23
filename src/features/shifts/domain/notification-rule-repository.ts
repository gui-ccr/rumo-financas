import type { NotificationRule, NotificationRuleContent } from './notification-rule';

export interface NotificationRuleRepository {
  /** All rules, by name. */
  list(): Promise<NotificationRule[]>;
  listActive(): Promise<NotificationRule[]>;
  findById(id: number): Promise<NotificationRule | null>;
  create(content: NotificationRuleContent): Promise<number>;
  update(id: number, content: NotificationRuleContent): Promise<void>;
  setActive(id: number, active: boolean): Promise<void>;
  delete(id: number): Promise<void>;
}
