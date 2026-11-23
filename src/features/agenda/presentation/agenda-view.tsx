import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { addDays, formatMonth, startOfWeek, today, type ISODate } from '@/shared/domain/dates';
import { Button } from '@/shared/ui/button';
import { EmptyState, Skeleton } from '@/shared/ui/feedback';
import { ListSection } from '@/shared/ui/list';
import { Screen } from '@/shared/ui/screen';
import { Text } from '@/shared/ui/text';

import { AgendaItemRow } from './components/agenda-item-row';
import { ConnectCalendarCard } from './components/connect-calendar-card';
import { WeekStrip } from './components/week-strip';
import { useAgendaWeek, useCalendarPermission } from './hooks';

/** "2026-11-19" -> "Novembro 2026": the month name and always the year. */
function monthYear(day: ISODate): string {
  const [year, month] = day.split('-');
  const name = formatMonth(`${year}-${month}`).replace(/ de \d{4}$/, '');
  return `${name} ${year}`;
}

/** The agenda tab: a week strip, the selected day's items, and the device calendar when allowed. */
export function AgendaView() {
  const [selected, setSelected] = useState<ISODate>(() => today());
  const weekStart = startOfWeek(selected);
  const week = useAgendaWeek(weekStart);
  const calendar = useCalendarPermission();

  const dayMap = week.data;
  const items = dayMap?.get(selected) ?? [];
  const marked = useMemo(() => new Set([...(dayMap?.entries() ?? [])].filter(([, v]) => v.length > 0).map(([k]) => k)), [dayMap]);

  const goToday = () => {
    const t = today();
    setSelected(t);
  };
  const swipeWeek = (direction: 1 | -1) => setSelected((day) => addDays(day, direction * 7));
  const isToday = selected === today();

  return (
    <Screen
      header={<Text variant="title">{monthYear(selected)}</Text>}
      actions={
        <Button size="sm" variant="secondary" disabled={isToday} onPress={goToday} accessibilityLabel="Ir para hoje">
          <Text className="text-sm">Hoje</Text>
        </Button>
      }
      onRefresh={() => week.refetch()}
      refreshing={week.isRefetching}>
      <WeekStrip selected={selected} weekStart={weekStart} marked={marked} onSelect={setSelected} onSwipe={swipeWeek} />

      {calendar.status !== 'granted' && <ConnectCalendarCard status={calendar.status} onConnect={calendar.request} />}

      {week.isLoading ? (
        <Skeleton className="h-28" />
      ) : items.length > 0 ? (
        <ListSection variant="plain">
          {items.map((item) => (
            <AgendaItemRow key={`${item.kind}-${item.id}`} item={item} />
          ))}
        </ListSection>
      ) : (
        <View>
          <EmptyState
            illustration="plan"
            title="Nada marcado neste dia"
            description="Eventos, contas que vencem, rendas previstas e lembretes de notas aparecem aqui."
          />
        </View>
      )}
    </Screen>
  );
}
