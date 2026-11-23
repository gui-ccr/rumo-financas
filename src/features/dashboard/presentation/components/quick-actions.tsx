import { router, type Href } from 'expo-router';
import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight, CalendarPlus, type LucideIcon } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { Text } from '@/shared/ui/text';
import { useThemeColors } from '@/shared/ui/theme';

const ACTIONS: { label: string; icon: LucideIcon; href: Href }[] = [
  { label: 'Gasto', icon: ArrowUpRight, href: { pathname: '/lancamento/novo', params: { type: 'expense' } } },
  { label: 'Entrada', icon: ArrowDownLeft, href: { pathname: '/lancamento/novo', params: { type: 'income' } } },
  { label: 'Transferir', icon: ArrowLeftRight, href: { pathname: '/lancamento/novo', params: { type: 'transfer' } } },
  { label: 'Conta', icon: CalendarPlus, href: { pathname: '/conta/[id]', params: { id: 'nova' } } },
];

/** Shortcuts straight into the right form (kit wallet actions): round graphite keys, label below. */
export function QuickActions() {
  const colors = useThemeColors();
  return (
    <View className="flex-row justify-between">
      {ACTIONS.map(({ label, icon: Icon, href }) => (
        <Pressable
          key={label}
          onPress={() => router.push(href)}
          accessibilityRole="button"
          accessibilityLabel={label === 'Conta' ? 'Nova conta a pagar' : `Registrar ${label.toLowerCase()}`}
          className="w-[72px] items-center gap-2 active:opacity-70">
          <View className="h-14 w-14 items-center justify-center rounded-full bg-muted">
            <Icon size={22} color={colors.foreground} strokeWidth={1.9} />
          </View>
          <Text className="font-sans-medium text-xs">{label}</Text>
        </Pressable>
      ))}
    </View>
  );
}
