import * as Haptics from 'expo-haptics';
import { Minus, Plus } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { cn } from './cn';
import { Text } from './text';
import { useThemeColors } from './theme';

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <View className="gap-2">
      <Text variant="label">{label}</Text>
      {children}
      {hint && <Text variant="caption">{hint}</Text>}
    </View>
  );
}

/** − value + stepper for small integers such as a due day. */
export function NumberStepper({
  value,
  onChange,
  min,
  max,
  format = String,
  label,
}: {
  value: number;
  onChange: (n: number) => void;
  min: number;
  max: number;
  format?: (n: number) => string;
  label: string;
}) {
  const colors = useThemeColors();
  const step = (d: number) => {
    const next = Math.min(max, Math.max(min, value + d));
    if (next !== value) Haptics.selectionAsync().catch(() => {});
    onChange(next);
  };
  return (
    <View className="h-[54px] flex-row items-center rounded-lg bg-card" accessibilityLabel={label}>
      <Pressable
        onPress={() => step(-1)}
        disabled={value <= min}
        accessibilityLabel={`Diminuir ${label}`}
        className="h-[54px] w-[54px] items-center justify-center rounded-lg active:opacity-60">
        <Minus size={16} color={colors.mutedForeground} />
      </Pressable>
      <Text className="flex-1 text-center font-mono-semibold" style={{ fontVariant: ['tabular-nums'] }}>
        {format(value)}
      </Text>
      <Pressable
        onPress={() => step(1)}
        disabled={value >= max}
        accessibilityLabel={`Aumentar ${label}`}
        className="h-[54px] w-[54px] items-center justify-center rounded-lg active:opacity-60">
        <Plus size={16} color={colors.mutedForeground} />
      </Pressable>
    </View>
  );
}

/** Selectable chip used for accounts, filters and small option sets. */
export function Chip({
  label,
  selected,
  onPress,
  leading,
  color,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  leading?: ReactNode;
  /** Optional dot color shown before the label. */
  color?: string;
}) {
  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync().catch(() => {});
        onPress();
      }}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      className={cn(
        'h-[38px] flex-row items-center gap-2 rounded-full px-4',
        selected ? 'bg-foreground' : 'bg-muted active:opacity-70',
      )}>
      {color && <View className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />}
      {leading}
      <Text className={cn('font-sans-semibold text-xs', selected ? 'text-background' : 'text-foreground')}>{label}</Text>
    </Pressable>
  );
}
