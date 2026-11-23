import * as Haptics from 'expo-haptics';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { CalendarDays, House, Plus, StickyNote, Wallet, type LucideIcon } from 'lucide-react-native';
import { useRef } from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { cn } from '@/shared/ui/cn';
import { Sheet, type SheetRef } from '@/shared/ui/sheet';
import { Text } from '@/shared/ui/text';
import { elevation, useIsDark, useThemeColors } from '@/shared/ui/theme';

import { QuickCreateGrid } from './quick-create-sheet';

const TABS: Record<string, { label: string; icon: LucideIcon }> = {
  index: { label: 'Início', icon: House },
  agenda: { label: 'Agenda', icon: CalendarDays },
  dinheiro: { label: 'Dinheiro', icon: Wallet },
  notas: { label: 'Notas', icon: StickyNote },
};

/**
 * Bottom navigation: four destinations and, in the middle, the quick-create
 * button. Active = foreground + accent dot; the accent itself is spent only on
 * the center action, which opens the create sheet.
 */
export function TabBar({ state, navigateToTab }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const dark = useIsDark();
  const createRef = useRef<SheetRef>(null);
  const routes = state.routes.filter((r) => TABS[r.name]);
  const middle = Math.ceil(routes.length / 2);

  const item = (route: (typeof routes)[number]) => {
    const tab = TABS[route.name];
    const focused = state.routes[state.index]?.key === route.key;
    const Icon = tab.icon;
    return (
      <Pressable
        key={route.key}
        accessibilityRole="tab"
        accessibilityState={{ selected: focused }}
        accessibilityLabel={tab.label}
        onPress={() => {
          if (focused) return;
          Haptics.selectionAsync().catch(() => {});
          navigateToTab(route.key);
        }}
        className="flex-1 items-center justify-center gap-1 pt-2">
        <Icon size={22} strokeWidth={focused ? 2 : 1.7} color={focused ? colors.foreground : colors.iconMuted} />
        <Text className={cn('font-sans-medium text-2xs', focused ? 'text-foreground' : 'text-muted-foreground')}>
          {tab.label}
        </Text>
        <View className={cn('h-1 w-1 rounded-full', focused ? 'bg-accent' : 'bg-transparent')} />
      </Pressable>
    );
  };

  return (
    <>
      <View
        className={cn('flex-row bg-background px-3', dark && 'border-t-hairline border-border')}
        style={[
          { paddingBottom: Math.max(insets.bottom, 8), height: 68 + Math.max(insets.bottom, 8) },
          !dark && { boxShadow: elevation.sheet },
        ]}
        accessibilityRole="tablist">
        {routes.slice(0, middle).map(item)}
        <View className="flex-1 items-center justify-center">
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              createRef.current?.present();
            }}
            accessibilityRole="button"
            accessibilityLabel="Criar"
            className="h-11 w-16 items-center justify-center rounded-full bg-accent active:opacity-85">
            <Plus size={24} color={colors.accentForeground} strokeWidth={2.4} />
          </Pressable>
        </View>
        {routes.slice(middle).map(item)}
      </View>
      <Sheet ref={createRef} title="Criar">
        <QuickCreateGrid onPick={() => createRef.current?.dismiss()} />
      </Sheet>
    </>
  );
}
