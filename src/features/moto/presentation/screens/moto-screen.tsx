import { router } from 'expo-router';
import { Fuel, Plus } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/shared/ui/button';
import { CategoryBadge } from '@/shared/ui/category-badge';
import { EmptyState, Skeleton } from '@/shared/ui/feedback';
import { Illustration } from '@/shared/ui/illustration';
import { ListRow, ListSection } from '@/shared/ui/list';
import { Money } from '@/shared/ui/money';
import { Screen } from '@/shared/ui/screen';
import { Segmented } from '@/shared/ui/segmented';
import { Surface } from '@/shared/ui/surface';
import { Text } from '@/shared/ui/text';
import { useThemeColors } from '@/shared/ui/theme';

import { MOTO_PERIOD_LABEL, type CategoryTotal, type MotoPeriod } from '../../domain/moto-summary';
import { DailyBars } from '../components/daily-bars';
import { useMotoSummary } from '../hooks';

const PERIODS = (['day', 'week', 'month'] as const).map((value) => ({ value, label: MOTO_PERIOD_LABEL[value] }));
const PERIOD_TEXT: Record<MotoPeriod, string> = { day: 'de hoje', week: 'da semana', month: 'do mês' };

export function MotoScreen() {
  const colors = useThemeColors();
  const [period, setPeriod] = useState<MotoPeriod>('week');
  const { data, isLoading, refetch, isRefetching } = useMotoSummary(period);
  const empty = !!data && data.earnedCents + data.costCents === 0;

  const add = (type: 'income' | 'expense') => router.push({ pathname: '/lancamento/novo', params: { type, group: 'moto' } });

  return (
    <Screen back title="Moto" onRefresh={refetch} refreshing={isRefetching}>
      {isLoading || !data ? (
        <Skeleton className="h-[92px]" />
      ) : (
        <Surface tone="raised" className="flex-row items-center justify-between p-5">
          <View className="flex-1 gap-1">
            <Text variant="muted">Lucro {PERIOD_TEXT[period]}</Text>
            <Money cents={data.profitCents} size="xl" tone={data.profitCents < 0 ? 'expense' : 'default'} />
          </View>
          <Illustration name="moto" size={80} />
        </Surface>
      )}

      <Segmented options={PERIODS} value={period} onChange={setPeriod} />

      {isLoading || !data ? (
        <View className="gap-3">
          <View className="flex-row gap-3">
            <Skeleton className="h-[76px] flex-1" />
            <Skeleton className="h-[76px] flex-1" />
          </View>
          <View className="flex-row gap-3">
            <Skeleton className="h-[76px] flex-1" />
            <Skeleton className="h-[76px] flex-1" />
          </View>
        </View>
      ) : (
        <View className="gap-3">
          <View className="flex-row gap-3">
            <Surface tone="plain" className="flex-1 gap-1.5 p-4">
              <Text variant="muted">Ganhos</Text>
              <Money cents={data.earnedCents} size="md" tone="income" />
            </Surface>
            <Surface tone="plain" className="flex-1 gap-1.5 p-4">
              <Text variant="muted">Custos</Text>
              <Money cents={data.costCents} size="md" />
            </Surface>
          </View>
          <View className="flex-row gap-3">
            <Surface tone="plain" className="flex-1 gap-1.5 p-4">
              <Text variant="muted">Dias rodados</Text>
              <Text className="font-mono-semibold text-xl text-foreground">{data.workedDays}</Text>
            </Surface>
            <Surface tone="plain" className="flex-1 gap-1.5 p-4">
              <Text variant="muted">Por dia rodado</Text>
              <Money cents={data.profitPerDayCents} size="md" tone={data.profitPerDayCents < 0 ? 'expense' : 'default'} />
            </Surface>
          </View>
        </View>
      )}

      <View className="flex-row gap-3">
        <Button variant="secondary" className="flex-1" onPress={() => add('income')}>
          <Plus size={18} color={colors.foreground} strokeWidth={2} />
          <Text>Registrar ganho</Text>
        </Button>
        <Button variant="secondary" className="flex-1" onPress={() => add('expense')}>
          <Fuel size={18} color={colors.foreground} strokeWidth={2} />
          <Text>Registrar custo</Text>
        </Button>
      </View>

      {data && period !== 'day' && !empty && <DailyBars days={data.days} />}

      {data && data.byApp.length > 0 && <Breakdown title="Ganhos por app" items={data.byApp} total={data.earnedCents} />}
      {data && data.byCost.length > 0 && <Breakdown title="Custos da moto" items={data.byCost} total={data.costCents} />}

      {empty && (
        <EmptyState
          illustration="moto"
          title="Nenhuma corrida no período"
          description="Registre o que cada app pagou como ganho, e combustível ou manutenção como custo. O lucro real aparece aqui."
        />
      )}
    </Screen>
  );
}

function Breakdown({ title, items, total }: { title: string; items: CategoryTotal[]; total: number }) {
  return (
    <ListSection title={title}>
      {items.map((c) => (
        <ListRow
          key={c.categoryId}
          leading={<CategoryBadge icon={c.icon} color={c.color} />}
          title={c.name}
          subtitle={`${Math.round((c.totalCents / total) * 100)}% do total`}
          trailing={<Money cents={c.totalCents} />}
        />
      ))}
    </ListSection>
  );
}
