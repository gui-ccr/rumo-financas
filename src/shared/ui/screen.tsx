import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { cn } from './cn';
import { Text } from './text';
import { useThemeColors } from './theme';

/**
 * Tab screen shell: header row (title or custom content, plus actions) and
 * scrolling content. Respects the top safe area; the tab bar handles the bottom.
 */
export function Screen({
  title,
  header,
  actions,
  children,
  onRefresh,
  refreshing = false,
  contentClassName,
  back = false,
  embedded = false,
}: {
  /** Pushed (non-tab) screens: round back button before the title (or callback). */
  back?: boolean | (() => void);
  title?: string;
  /** Custom header content, replaces the title. */
  header?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  onRefresh?: () => void;
  refreshing?: boolean;
  contentClassName?: string;
  /**
   * Shown inside another screen (for example, a tab of the Dinheiro hub): hides the
   * big title and the top safe-area padding, since the host already draws its header.
   * Actions stay, so the screen keeps its own controls.
   */
  embedded?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  // The header row only exists when it has something to show. An embedded screen without
  // actions would otherwise leave an empty line under the host's own header.
  const hasHeaderRow = Boolean(back) || header != null || Boolean(title && !embedded) || Boolean(actions);
  return (
    <View className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingTop: embedded ? 0 : insets.top + 8, paddingBottom: 40 }}
        refreshControl={
          onRefresh ? (
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />
          ) : undefined
        }>
        {hasHeaderRow && (
          <View className="mb-5 min-h-[44px] flex-row items-center justify-between gap-3 px-5">
            {Boolean(back) && (
              <HeaderIconButton label="Voltar" onPress={typeof back === 'function' ? back : () => router.back()}>
                <ArrowLeft size={20} color={colors.foreground} strokeWidth={1.9} />
              </HeaderIconButton>
            )}
            <View className="flex-1">{header ?? (title && !embedded ? <Text variant="title">{title}</Text> : null)}</View>
            {actions && <View className="flex-row items-center gap-1">{actions}</View>}
          </View>
        )}
        <View className={cn('gap-7 px-5', contentClassName)}>{children}</View>
      </ScrollView>
    </View>
  );
}

/** Round icon button for headers (kit top bar): 40pt graphite circle, 44 hit area. */
export function HeaderIconButton({ onPress, label, children }: { onPress: () => void; label: string; children: ReactNode }) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={4}
      accessibilityRole="button"
      accessibilityLabel={label}
      className="h-10 w-10 items-center justify-center rounded-full bg-muted active:opacity-70">
      {children}
    </Pressable>
  );
}
