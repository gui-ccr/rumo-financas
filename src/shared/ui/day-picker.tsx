import * as Haptics from 'expo-haptics';
import { Pressable, View } from 'react-native';

import { cn } from './cn';
import { Text } from './text';

const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);
const COLUMNS = 7;

/** Rows of 7 days; the last row is padded so every cell keeps the same width. */
const ROWS: (number | null)[][] = [];
for (let i = 0; i < DAYS.length; i += COLUMNS) {
  const row: (number | null)[] = DAYS.slice(i, i + COLUMNS);
  while (row.length < COLUMNS) row.push(null);
  ROWS.push(row);
}

/** Grid of days 1 to 31, one tap to choose. */
export function DayPicker({ value, onChange, label }: { value: number; onChange: (day: number) => void; label: string }) {
  return (
    <View className="gap-2" accessibilityRole="radiogroup" accessibilityLabel={label}>
      {ROWS.map((row, rowIndex) => (
        <View key={rowIndex} className="flex-row gap-2">
          {row.map((day, colIndex) =>
            day === null ? (
              <View key={`empty-${colIndex}`} className="h-11 flex-1" />
            ) : (
              <Pressable
                key={day}
                onPress={() => {
                  if (day !== value) Haptics.selectionAsync().catch(() => {});
                  onChange(day);
                }}
                accessibilityRole="radio"
                accessibilityState={{ selected: day === value }}
                accessibilityLabel={`Dia ${day}`}
                className={cn(
                  'h-11 flex-1 items-center justify-center rounded-lg',
                  day === value ? 'bg-primary' : 'bg-muted active:opacity-70',
                )}>
                <Text
                  className={cn(
                    'font-mono-semibold text-sm',
                    day === value ? 'text-primary-foreground' : 'text-foreground',
                  )}
                  style={{ fontVariant: ['tabular-nums'] }}>
                  {day}
                </Text>
              </Pressable>
            ),
          )}
        </View>
      ))}
    </View>
  );
}
