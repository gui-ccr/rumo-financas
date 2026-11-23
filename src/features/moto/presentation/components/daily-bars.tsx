import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';

import { today } from '@/shared/domain/dates';
import { formatBRL } from '@/shared/domain/money';
import { cn } from '@/shared/ui/cn';
import { motion } from '@/shared/ui/motion';
import { Surface } from '@/shared/ui/surface';
import { Text } from '@/shared/ui/text';
import { useThemeColors } from '@/shared/ui/theme';

import type { MotoSummary } from '../../domain/moto-summary';

const WEEKDAY = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

/** Profit per day with Brankas styling. */
export function DailyBars({ days }: { days: MotoSummary['days'] }) {
  const max = Math.max(...days.map((d) => Math.abs(d.profitCents)), 1);
  const dense = days.length > 10;
  const gap = dense ? 2 : 8;
  const todayIso = today();
  const hasToday = days.some((d) => d.date === todayIso);
  const highlightDate = hasToday
    ? todayIso
    : (days.reduce((best, d) => (d.profitCents > best.profitCents ? d : best), days[0])?.date ?? '');

  return (
    <View className="gap-3">
      <Text variant="section" className="px-1">
        Lucro por dia
      </Text>
      <Surface
        tone="plain"
        className="gap-3 p-4"
        accessible
        accessibilityLabel={`Lucro por dia: ${days
          .filter((d) => d.profitCents !== 0)
          .map((d) => `dia ${Number(d.date.slice(8))}, ${formatBRL(d.profitCents)}`)
          .join('; ')}`}>
        <View className="relative h-28 justify-between">
          <View pointerEvents="none" className="absolute inset-0 justify-between">
            <View className="border-t-hairline border-border" />
            <View className="border-t-hairline border-border" />
            <View className="border-t-hairline border-border" />
          </View>
          <View className="flex-1 flex-row items-end" style={{ gap }}>
            {days.map((d) => (
              <Bar
                key={d.date}
                ratio={Math.abs(d.profitCents) / max}
                negative={d.profitCents < 0}
                isHighlight={d.date === highlightDate}
              />
            ))}
          </View>
        </View>
        <View className="flex-row" style={{ gap }}>
          {days.map((d, i) => {
            const day = Number(d.date.slice(8));
            const show = !dense || i === 0 || day % 5 === 0;
            const weekday = new Date(`${d.date}T12:00:00`).getDay();
            const isHighlight = d.date === highlightDate;
            return (
              <Text
                key={d.date}
                className={cn(
                  'flex-1 text-center font-mono text-2xs text-muted-foreground',
                  isHighlight && 'font-mono-semibold text-foreground',
                )}>
                {show ? (dense ? day : WEEKDAY[weekday]) : ''}
              </Text>
            );
          })}
        </View>
      </Surface>
    </View>
  );
}

function Bar({ ratio, negative, isHighlight }: { ratio: number; negative: boolean; isHighlight: boolean }) {
  const colors = useThemeColors();
  const reduceMotion = useReducedMotion();
  const target = ratio === 0 ? 0 : Math.max(ratio * 100, 4);
  const height = useSharedValue(reduceMotion ? target : 0);

  useEffect(() => {
    height.set(reduceMotion ? target : withTiming(target, { duration: motion.slow, easing: Easing.out(Easing.cubic) }));
  }, [height, target, reduceMotion]);

  const style = useAnimatedStyle(() => ({ height: `${height.get()}%` }));
  const barColor = negative ? colors.expense : isHighlight ? colors.accent : colors.iconMuted;

  return (
    <View className="flex-1 justify-end" style={{ height: '100%' }}>
      <Animated.View
        style={[
          style,
          {
            backgroundColor: barColor,
            borderTopLeftRadius: 9999,
            borderTopRightRadius: 9999,
          },
        ]}
      />
    </View>
  );
}
