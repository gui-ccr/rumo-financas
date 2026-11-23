import * as Haptics from 'expo-haptics';
import { Pressable, ScrollView, View } from 'react-native';

import type { Category } from '@/features/accounts/domain/category';
import { CategoryBadge } from '@/shared/ui/category-badge';
import { cn } from '@/shared/ui/cn';
import { Text } from '@/shared/ui/text';

/**
 * Two-row horizontal grid, most used categories first, so the usual pick is
 * under the thumb without scrolling. Selection is a thin accent outline.
 */
export function CategoryPicker({
  categories,
  value,
  onChange,
}: {
  categories: Category[];
  value: number | null;
  onChange: (id: number) => void;
}) {
  const columns: Category[][] = [];
  for (let i = 0; i < categories.length; i += 2) columns.push(categories.slice(i, i + 2));

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-1.5 px-4">
      {columns.map((col) => (
        <View key={col[0].id} className="gap-1.5">
          {col.map((c) => {
            const selected = c.id === value;
            return (
              <Pressable
                key={c.id}
                onPress={() => {
                  Haptics.selectionAsync().catch(() => {});
                  onChange(c.id);
                }}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={c.name}
                className={cn(
                  'w-[80px] items-center gap-1.5 rounded-lg border px-1 py-2',
                  selected ? 'border-accent bg-secondary' : 'border-transparent active:bg-muted',
                )}>
                <CategoryBadge icon={c.icon} color={c.color} />
                <Text
                  numberOfLines={1}
                  className={cn('text-2xs', selected ? 'font-sans-semibold text-foreground' : 'font-sans-medium text-muted-foreground')}>
                  {c.name}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ))}
    </ScrollView>
  );
}
