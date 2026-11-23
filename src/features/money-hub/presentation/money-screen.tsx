import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BillsScreen } from '@/features/bills/presentation/screens/bills-screen';
import { PlanScreen } from '@/features/planning/presentation/screens/plan-screen';
import { TransactionsScreen } from '@/features/transactions/presentation/screens/transactions-screen';
import { cn } from '@/shared/ui/cn';
import { Text } from '@/shared/ui/text';

export const MONEY_TABS = [
  { key: 'atividade', label: 'Atividade' },
  { key: 'contas', label: 'Contas' },
  { key: 'planejar', label: 'Planejar' },
] as const;

export type MoneyTab = (typeof MONEY_TABS)[number]['key'];

/** Reads ?tab=… from the URL. Unknown or missing values fall back to Atividade. */
export function parseMoneyTab(value: unknown): MoneyTab {
  return MONEY_TABS.some((t) => t.key === value) ? (value as MoneyTab) : 'atividade';
}

/**
 * Dinheiro: one tab of the bottom bar that groups everything about money. The
 * active section lives in the URL (?tab=), so other screens can deep-link to it.
 */
export function MoneyScreen() {
  const insets = useSafeAreaInsets();
  const { tab } = useLocalSearchParams<{ tab?: string }>();
  const active = parseMoneyTab(tab);

  return (
    <View className="flex-1 bg-background">
      <View className="gap-4 px-5" style={{ paddingTop: insets.top + 8 }}>
        <Text variant="title">Dinheiro</Text>
        <View className="flex-row items-center gap-5" accessibilityRole="tablist">
          {MONEY_TABS.map((t) => (
            <MoneyTabButton
              key={t.key}
              label={t.label}
              active={active === t.key}
              onPress={() => router.setParams({ tab: t.key })}
            />
          ))}
        </View>
      </View>

      <View className="mt-5 flex-1">
        {active === 'atividade' && <TransactionsScreen embedded />}
        {active === 'contas' && <BillsScreen embedded />}
        {active === 'planejar' && <PlanScreen embedded />}
      </View>
    </View>
  );
}

/** Text tab, same look as the Home feed tabs: active = foreground + accent underline. */
function MoneyTabButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="tab" accessibilityState={{ selected: active }} className="gap-1.5 py-1">
      <Text className={cn('font-sans-semibold text-lg', active ? 'text-foreground' : 'text-muted-foreground')}>{label}</Text>
      <View className={cn('h-0.5 rounded-full', active ? 'bg-accent' : 'bg-transparent')} />
    </Pressable>
  );
}
