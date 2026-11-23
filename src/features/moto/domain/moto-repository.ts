import type { ISODate } from '@/shared/domain/dates';

import type { MotoEntry } from './moto-summary';

export interface MotoRepository {
  entries(start: ISODate, end: ISODate): Promise<MotoEntry[]>;
}
