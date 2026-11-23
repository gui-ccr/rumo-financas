import { useMemo } from 'react';
import { Pressable, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';

import { addDays, formatDayHeader, parseISODate, type ISODate } from '@/shared/domain/dates';
import { cn } from '@/shared/ui/cn';
import { Text } from '@/shared/ui/text';

import { daysInRange } from '../../domain/agenda';

/** Sunday-first letters, indexed by Date.getDay(). */
const LETTERS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

/** A horizontal Monday-to-Sunday strip. Swipe left or right to move a week. */
export function WeekStrip({
  selected,
  weekStart,
  marked,
  onSelect,
  onSwipe,
}: {
  selected: ISODate;
  weekStart: ISODate;
  /** Days that have at least one item. */
  marked: Set<ISODate>;
  onSelect: (day: ISODate) => void;
  /** +1 for the next week, -1 for the previous one. */
  onSwipe: (direction: 1 | -1) => void;
}) {
  const days = daysInRange({ start: weekStart, end: addDays(weekStart, 6) });

  const swipe = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX([-16, 16])
        .failOffsetY([-12, 12])
        .onEnd((e) => {
          if (e.translationX < -48) runOnJS(onSwipe)(1);
          else if (e.translationX > 48) runOnJS(onSwipe)(-1);
        }),
    [onSwipe],
  );

  return (
    <GestureDetector gesture={swipe}>
      <View className="flex-row">
        {days.map((day) => {
          const on = day === selected;
          const letter = LETTERS[parseISODate(day).getDay()];
          return (
            <Pressable
              key={day}
              onPress={() => onSelect(day)}
              accessibilityRole="button"
              accessibilityLabel={formatDayHeader(day)}
              accessibilityState={{ selected: on }}
              className={cn('flex-1 items-center gap-1.5 rounded-full py-2', on && 'bg-foreground')}>
              <Text className={cn('font-sans-medium text-xs', on ? 'text-background' : 'text-muted-foreground')}>{letter}</Text>
              <Text className={cn('font-mono-semibold text-base', on ? 'text-background' : 'text-foreground')}>
                {String(parseISODate(day).getDate())}
              </Text>
              <View className={cn('h-1 w-1 rounded-full', marked.has(day) ? 'bg-accent' : 'bg-transparent')} />
            </Pressable>
          );
        })}
      </View>
    </GestureDetector>
  );
}
