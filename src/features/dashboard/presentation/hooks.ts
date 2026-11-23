import { useQuery } from '@tanstack/react-query';

import { useContainer } from '@/core/container-context';
import type { MonthKey } from '@/shared/domain/dates';

export function useMonthOverview(month: MonthKey) {
  const { useCases } = useContainer();
  return useQuery({ queryKey: ['overview', month], queryFn: () => useCases.getMonthOverview.execute(month) });
}
