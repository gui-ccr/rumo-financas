import { today, type ISODate } from '@/shared/domain/dates';

import type { MotoRepository } from '../domain/moto-repository';
import { periodRange, summarize, type MotoPeriod, type MotoSummary } from '../domain/moto-summary';

export class GetMotoSummary {
  constructor(private readonly moto: MotoRepository) {}

  async execute(period: MotoPeriod, ref: ISODate = today()): Promise<MotoSummary> {
    const { start, end } = periodRange(period, ref);
    return summarize(await this.moto.entries(start, end), start, end);
  }
}
