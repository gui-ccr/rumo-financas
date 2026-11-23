import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { View, type ViewProps } from 'react-native';

import { cn } from './cn';
import { Text } from './text';
import { elevation, useIsDark, useThemeColors } from './theme';

/**
 * Card surface (kit "Top Card"/"Stat card").
 *   plain  flat graphite tile, the default container for grouped content
 *   raised top-lit gradient (kit surface/card-top → card-bottom); one per screen,
 *          for the figure the screen is about (balance, invoice total)
 *   brand  indigo field with lavender text, for the single identity moment
 * Never nest surfaces.
 */
export function Surface({
  tone = 'plain',
  className,
  children,
  style,
  ...props
}: ViewProps & { tone?: 'plain' | 'raised' | 'brand'; className?: string; children?: ReactNode }) {
  const colors = useThemeColors();
  const dark = useIsDark();
  const shape = cn('overflow-hidden rounded-xl', className);

  if (tone === 'plain') {
    return (
      <View className={cn('bg-card', shape)} style={[{ borderCurve: 'continuous' }, style]} {...props}>
        {children}
      </View>
    );
  }

  const gradient: [string, string] =
    tone === 'brand' ? [dark ? '#3745AF' : '#34449E', colors.primary] : [colors.cardTop, colors.cardBottom];
  return (
    <View
      className={shape}
      style={[{ borderCurve: 'continuous' }, !dark && tone === 'raised' ? { boxShadow: elevation.card } : null, style]}
      {...props}>
      <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 0.4, y: 1 }} style={{ position: 'absolute', inset: 0 }} />
      {/* Hairline top highlight: reads as a lit edge on dark graphite. */}
      {dark && <View className="absolute left-0 right-0 top-0 h-px bg-white/5" />}
      {children}
    </View>
  );
}

/** Small status pill (kit "Chip/Gain", "Badge"). */
export function Pill({
  label,
  tone = 'neutral',
  className,
}: {
  label: string;
  tone?: 'neutral' | 'income' | 'expense' | 'warning' | 'accent';
  className?: string;
}) {
  const box = {
    neutral: 'bg-muted',
    income: 'bg-income-soft',
    expense: 'bg-expense-soft',
    warning: 'bg-warning-soft',
    accent: 'bg-secondary',
  }[tone];
  const text = {
    neutral: 'text-muted-foreground',
    income: 'text-income',
    expense: 'text-expense',
    warning: 'text-warning',
    accent: 'text-secondary-foreground',
  }[tone];
  return (
    <View className={cn('h-6 flex-row items-center self-start rounded-full px-2.5', box, className)}>
      <Text className={cn('font-sans-semibold text-xs', text)}>{label}</Text>
    </View>
  );
}
