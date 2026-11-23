import { parseInput } from '@/shared/application/parse-input';
import { NotFoundError } from '@/shared/domain/errors';

import type { NotificationRuleContent } from '../domain/notification-rule';
import type { NotificationRuleRepository } from '../domain/notification-rule-repository';
import type { NotificationSource } from '../domain/notification-source';
import { NotificationRuleInputSchema, type NotificationRuleInput } from './schemas';

/**
 * Hands the active rules' apps to the native reader, so it only delivers their notifications.
 * Every rule change calls it; the hooks also call it at startup.
 */
export class SyncWatchedPackages {
  constructor(
    private readonly rules: NotificationRuleRepository,
    private readonly source: NotificationSource,
  ) {}

  async execute(): Promise<string[]> {
    const packages = [...new Set((await this.rules.listActive()).map((r) => r.packageName))];
    this.source.setWatchedPackages(packages);
    return packages;
  }
}

export class SaveNotificationRule {
  constructor(
    private readonly rules: NotificationRuleRepository,
    private readonly sync: SyncWatchedPackages,
  ) {}

  /** Creates or edits a rule. Returns its id. */
  async execute(input: NotificationRuleInput, id?: number): Promise<number> {
    const v = parseInput(NotificationRuleInputSchema, input);
    const content: NotificationRuleContent = {
      name: v.name,
      packageName: v.packageName,
      titlePattern: v.titlePattern?.trim() || null,
      textPattern: v.textPattern,
    };

    let ruleId: number;
    if (id !== undefined) {
      if (!(await this.rules.findById(id))) throw new NotFoundError('Regra');
      await this.rules.update(id, content);
      ruleId = id;
    } else {
      ruleId = await this.rules.create(content);
    }
    await this.sync.execute();
    return ruleId;
  }
}

export class DeleteNotificationRule {
  constructor(
    private readonly rules: NotificationRuleRepository,
    private readonly sync: SyncWatchedPackages,
  ) {}

  async execute(id: number): Promise<void> {
    await this.rules.delete(id);
    await this.sync.execute();
  }
}

/** Turns a rule on or off. Without `active`, flips it. */
export class ToggleNotificationRule {
  constructor(
    private readonly rules: NotificationRuleRepository,
    private readonly sync: SyncWatchedPackages,
  ) {}

  async execute(id: number, active?: boolean): Promise<void> {
    const rule = await this.rules.findById(id);
    if (!rule) throw new NotFoundError('Regra');
    await this.rules.setActive(id, active ?? !rule.active);
    await this.sync.execute();
  }
}
