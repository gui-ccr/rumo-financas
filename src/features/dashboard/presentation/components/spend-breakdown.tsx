import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';

import { Money } from '@/shared/ui/money';
import { motion } from '@/shared/ui/motion';
import { Text } from '@/shared/ui/text';

import type { SpendSlice } from '../../domain/month-overview';

/** "Where the money went": one proportional bar and the categories behind it. */
export function SpendBreakdown({ slices, totalCents }: { slices: SpendSlice[]; totalCents: number }) {
  return (
    <View className="gap-3">
      <View className="flex-row items-baseline justify-between px-1">
        <Text variant="section">Para onde foi</Text>
        <Text className="font-mono-medium text-sm text-muted-foreground">{formatShort(totalCents)}</Text>
      </View>
      <View className="gap-5 rounded-xl bg-card p-5">
        <View
          className="h-3 flex-row gap-[3px] overflow-hidden rounded-full bg-muted"
          accessible
          accessibilityLabel={`Gastos por categoria: ${slices.map((s) => `${s.name} ${Math.round(s.share * 100)}%`).join(', ')}`}>
          {slices.map((s, i) => (
            <Segment key={s.categoryId} slice={s} index={i} />
          ))}
        </View>
        <View className="gap-3.5">
          {slices.map((s) => (
            <View key={s.categoryId} className="flex-row items-center gap-3">
              <View className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
              <Text className="flex-1 text-sm" numberOfLines={1}>
                {s.name}
              </Text>
              <Text className="w-10 text-right font-mono text-xs text-muted-foreground">
                {Math.round(s.share * 100)}%
              </Text>
              <View className="w-[104px] items-end">
                <Money cents={s.totalCents} />
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

function formatShort(cents: number) {
  return `R$ ${Math.round(cents / 100).toLocaleString('pt-BR')}`;
}

/** Segments grow in once; skipped entirely when the OS asks for reduced motion. */
function Segment({ slice, index }: { slice: SpendSlice; index: number }) {
  const reduceMotion = useReducedMotion();
  const grow = useSharedValue(reduceMotion ? 1 : 0);
  useEffect(() => {
    if (reduceMotion) return;
    grow.set(withTiming(1, { duration: motion.slow + index * 40, easing: Easing.out(Easing.cubic) }));
  }, [grow, index, reduceMotion]);
  const style = useAnimatedStyle(() => ({ flexGrow: slice.share * grow.get() + 0.0001 }));
  return <Animated.View style={[{ backgroundColor: slice.color, flexBasis: 0 }, style]} />;
}
