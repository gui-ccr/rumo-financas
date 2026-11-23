import type { UnitOfWork } from '@/shared/application/unit-of-work';

import type { CaptureRepository } from '../domain/capture-repository';
import type { NewCapture } from '../domain/notification-capture';
import type { RawCapture } from '../domain/notification-source';
import type { NotificationRuleRepository } from '../domain/notification-rule-repository';
import { parsePixNotification } from '../domain/parse-pix-notification';
import type { ShiftRepository } from '../domain/shift-repository';

/**
 * Stores the notifications that reach the app. Only apps with an active rule are kept (nothing else
 * is written). A payment received during the active shift is `in_shift`; one outside any shift is
 * `outside_shift`; anything else from those apps is `unmatched`, kept so the user can calibrate the rules.
 * Re-delivered notifications (same key) are skipped.
 */
export class IngestCaptures {
  constructor(
    private readonly rules: NotificationRuleRepository,
    private readonly shifts: ShiftRepository,
    private readonly captures: CaptureRepository,
    private readonly uow: UnitOfWork,
  ) {}

  /** Returns how many captures were new. */
  async execute(raw: RawCapture[]): Promise<number> {
    if (raw.length === 0) return 0;

    const rules = await this.rules.listActive();
    const watched = new Set(rules.map((r) => r.packageName));
    const active = await this.shifts.findActive();
    const startedMs = active ? Date.parse(active.startedAt) : null;

    return this.uow.transaction(async () => {
      let added = 0;
      for (const c of raw) {
        if (!watched.has(c.packageName)) continue;

        const receipt = parsePixNotification(c, rules);
        const inShift = receipt !== null && active !== null && startedMs !== null && c.postedAt >= startedMs;
        const status = !receipt ? 'unmatched' : inShift ? 'in_shift' : 'outside_shift';

        const row: NewCapture = {
          captureKey: c.key,
          packageName: c.packageName,
          title: c.title,
          text: c.bigText || c.text,
          postedAt: new Date(c.postedAt).toISOString(),
          ruleId: receipt?.ruleId ?? null,
          amountCents: receipt?.amountCents ?? null,
          payer: receipt?.payer ?? null,
          status,
          shiftId: inShift ? active.id : null,
        };
        if (await this.captures.insertIfNew(row)) added++;
      }
      return added;
    });
  }
}
