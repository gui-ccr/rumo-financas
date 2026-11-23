import type { LucideIcon } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { View } from 'react-native';

import { cn } from './cn';
import { Illustration, type IllustrationName } from './illustration';
import { Text } from './text';
import { useThemeColors } from './theme';

/** Empty states say what goes here and how to add it. Prefer an illustration (kit style). */
export function EmptyState({
  icon: Icon,
  illustration,
  title,
  description,
  action,
  className,
}: {
  icon?: LucideIcon;
  illustration?: IllustrationName;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  const colors = useThemeColors();
  return (
    <View className={cn('items-center gap-2 px-6 py-8', className)}>
      {illustration ? (
        <View className="mb-3">
          <Illustration name={illustration} size={180} />
        </View>
      ) : Icon ? (
        <View className="mb-2 h-12 w-12 items-center justify-center rounded-full bg-secondary">
          <Icon size={22} color={colors.accent} strokeWidth={1.9} />
        </View>
      ) : null}
      <Text className="text-center font-sans-semibold text-lg">{title}</Text>
      {description && (
        <Text variant="muted" className="max-w-[300px] text-center">
          {description}
        </Text>
      )}
      {action && <View className="mt-3">{action}</View>}
    </View>
  );
}

/** Skeleton block — first loads show the layout, not a spinner. */
export function Skeleton({ className }: { className?: string }) {
  return <View className={cn('rounded-xl bg-muted', className)} />;
}

export function ErrorNote({ message }: { message: string | null | undefined }) {
  if (!message) return null;
  return (
    <View className="rounded-lg bg-expense-soft px-4 py-3" accessibilityLiveRegion="polite">
      <Text className="text-sm text-expense">{message}</Text>
    </View>
  );
}
