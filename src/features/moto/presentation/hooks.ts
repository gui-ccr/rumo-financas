import { useQuery } from '@tanstack/react-query';

import { useContainer } from '@/core/container-context';

import type { MotoPeriod } from '../domain/moto-summary';

export function useMotoSummary(period: MotoPeriod) {
  const { useCases } = useContainer();
  return useQuery({ queryKey: ['moto', period], queryFn: () => useCases.getMotoSummary.execute(period) });
}
