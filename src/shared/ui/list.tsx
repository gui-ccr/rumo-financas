import { Children, isValidElement, type ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { cn } from './cn';
import { Text } from './text';

/**
 * Grouped list.
 *   card  (default) one graphite surface, rows divided by inset hairlines — settings-like groups
 *   plain rows straight on the page, no dividers (kit "Activity"/home lists) — feeds and activity
 */
export function ListSection({
  title,
  action,
  children,
  className,
  variant = 'card',
}: {
  variant?: 'card' | 'plain';
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const rows = Children.toArray(children).filter(isValidElement);
  return (
    <View className={cn('gap-2', className)}>
      {(title || action) && (
        <View className="min-h-[20px] flex-row items-center justify-between px-1">
          {title ? <Text variant="section">{title}</Text> : <View />}
          {action}
        </View>
      )}
      {variant === 'plain' ? (
        <View className="-mx-4">{rows}</View>
      ) : (
        <View className="overflow-hidden rounded-xl bg-card" style={{ borderCurve: 'continuous' }}>
          {rows.map((row, i) => (
            <View key={row.key ?? i}>
              {i > 0 && <View className="ml-[68px] mr-4 border-t-hairline border-border" />}
              {row}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

/** Text link used as a section action ("Ver todos"). */
export function SectionLink({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} hitSlop={10} accessibilityRole="link">
      <Text className="font-sans-medium text-sm text-muted-foreground">{label}</Text>
    </Pressable>
  );
}

export function ListRow({
  leading,
  title,
  subtitle,
  trailing,
  onPress,
  accessibilityLabel,
}: {
  leading?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  trailing?: ReactNode;
  onPress?: () => void;
  accessibilityLabel?: string;
}) {
  const content = (
    <View className="min-h-[64px] flex-row items-center gap-3 px-4 py-3">
      {leading}
      <View className="flex-1 gap-0.5">
        {typeof title === 'string' ? (
          <Text className="font-sans-semibold" numberOfLines={1}>
            {title}
          </Text>
        ) : (
          title
        )}
        {typeof subtitle === 'string' ? (
          <Text variant="muted" numberOfLines={1}>
            {subtitle}
          </Text>
        ) : (
          subtitle
        )}
      </View>
      {trailing}
    </View>
  );
  if (!onPress) return content;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={accessibilityLabel} className="active:opacity-70">
      {content}
    </Pressable>
  );
}
