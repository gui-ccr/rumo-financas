import { View } from 'react-native';

import { cn } from './cn';
import { CategoryGlyph } from './icon';

const SIZES = {
  sm: { box: 'h-8 w-8 rounded-full', icon: 16 },
  md: { box: 'h-10 w-10 rounded-full', icon: 18 },
  lg: { box: 'h-12 w-12 rounded-full', icon: 22 },
} as const;

/** Category mark (kit 40pt coin/avatar slot): thin-stroke icon on a tint of the category color. */
export function CategoryBadge({
  icon,
  color,
  size = 'md',
  className,
}: {
  icon: string;
  color: string;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const s = SIZES[size];
  return (
    <View
      className={cn('items-center justify-center', s.box, className)}
      style={{ backgroundColor: `${color}24`, borderCurve: 'continuous' }}>
      <CategoryGlyph name={icon} size={s.icon} color={color} strokeWidth={1.9} />
    </View>
  );
}

/** Same footprint as CategoryBadge, for rows without a category (transfers, cards). */
export function IconTile({
  children,
  size = 'md',
  className,
}: {
  children: React.ReactNode;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  return (
    <View className={cn('items-center justify-center bg-muted', SIZES[size].box, className)} style={{ borderCurve: 'continuous' }}>
      {children}
    </View>
  );
}
