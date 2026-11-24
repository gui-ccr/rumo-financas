import { router } from 'expo-router';
import { Receipt, Search, X } from 'lucide-react-native';
import { useDeferredValue, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { currentMonth, formatDayHeader, formatMonth } from '@/shared/domain/dates';
import { Button } from '@/shared/ui/button';
import { Chip } from '@/shared/ui/form';
import { Skeleton } from '@/shared/ui/feedback';
import { Input } from '@/shared/ui/input';
import { Money } from '@/shared/ui/money';
import { MonthSwitcher } from '@/shared/ui/month-switcher';
import { Screen } from '@/shared/ui/screen';
import { Text } from '@/shared/ui/text';
import { useThemeColors } from '@/shared/ui/theme';

import { groupByDay, signedAmount, type TransactionType } from '../../domain/transaction';
import { TransactionRow } from '../components/transaction-row';
import { useTransactions } from '../hooks';

type Filter = 'all' | TransactionType;

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'expense', label: 'Saídas' },
  { value: 'income', label: 'Entradas' },
  { value: 'transfer', label: 'Transferências' },
];

export function TransactionsScreen({ embedded = false }: { embedded?: boolean } = {}) {
  const colors = useThemeColors();
  const [month, setMonth] = useState(currentMonth());
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);

  const { data, isLoading, refetch, isRefetching } = useTransactions({
    month,
    type: filter === 'all' ? undefined : filter,
    search: deferredSearch,
  });

  const list = data ?? [];
  const days = groupByDay(list);
  const income = list.filter((t) => t.type === 'income').reduce((s, t) => s + t.amountCents, 0);
  const expense = list.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amountCents, 0);

  return (
    <Screen title="Atividade" embedded={embedded} onRefresh={refetch} refreshing={isRefetching}>
      <View className="gap-3">
        <View className="justify-center">
          <View className="absolute left-4 z-10">
            <Search size={16} color={colors.mutedForeground} />
          </View>
          <Input
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar descrição ou categoria"
            className="pl-11 pr-12"
            returnKeyType="search"
            autoCorrect={false}
          />
          {search.length > 0 && (
            <Pressable
              onPress={() => setSearch('')}
              accessibilityRole="button"
              accessibilityLabel="Limpar busca"
              hitSlop={8}
              className="absolute right-3 z-10 h-8 w-8 items-center justify-center rounded-full active:opacity-70">
              <X size={16} color={colors.mutedForeground} />
            </Pressable>
          )}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
          {FILTERS.map((f) => (
            <Chip key={f.value} label={f.label} selected={filter === f.value} onPress={() => setFilter(f.value)} />
          ))}
        </ScrollView>

        <View className="items-start">
          <MonthSwitcher month={month} onChange={setMonth} />
        </View>
      </View>

      {list.length > 0 && filter !== 'transfer' && (
        <View className="flex-row gap-6">
          {filter !== 'expense' && <Total label="Entradas" cents={income} tone="income" />}
          {filter !== 'income' && <Total label="Saídas" cents={expense} />}
        </View>
      )}

      {isLoading && (
        <View className="gap-3">
          <Skeleton className="h-40" />
          <Skeleton className="h-28" />
        </View>
      )}

      {days.map((day) => {
        const net = day.items.reduce((s, t) => s + signedAmount(t), 0);
        return (
          <View key={day.date} className="gap-1">
            <View className="flex-row items-center justify-between px-1 pb-1">
              <Text className="font-sans-medium text-sm text-muted-foreground">{formatDayHeader(day.date)}</Text>
              {net !== 0 && <Money cents={net} sign className="text-sm" tone="muted" />}
            </View>
            {day.items.map((t, i) => (
              <View key={t.id}>
                {i > 0 && <View className="ml-[52px] border-t-hairline border-border" />}
                <TransactionRow transaction={t} />
              </View>
            ))}
          </View>
        );
      })}

      {data && list.length === 0 && (
        <View className="items-center gap-2 py-10">
          <View className="mb-2 h-14 w-14 items-center justify-center rounded-full bg-secondary">
            <Receipt size={24} color={colors.accent} strokeWidth={1.9} />
          </View>
          <Text className="text-center font-sans-semibold text-lg">
            {deferredSearch ? 'Nada encontrado' : `Sem lançamentos em ${formatMonth(month).toLowerCase()}`}
          </Text>
          <Text variant="muted" className="max-w-[300px] text-center">
            {deferredSearch
              ? 'Tente outra palavra ou outro mês.'
              : 'Gastos e entradas registrados aparecem aqui, organizados por dia.'}
          </Text>
          {!deferredSearch && (
            <View className="mt-4 w-full">
              <Button size="lg" className="w-full" onPress={() => router.push({ pathname: '/lancamento/novo' })}>
                <Text>Registrar lançamento</Text>
              </Button>
            </View>
          )}
        </View>
      )}
    </Screen>
  );
}

function Total({ label, cents, tone }: { label: string; cents: number; tone?: 'income' }) {
  return (
    <View className="gap-0.5">
      <Text variant="caption">{label}</Text>
      <Money cents={cents} tone={tone ?? 'default'} />
    </View>
  );
}
