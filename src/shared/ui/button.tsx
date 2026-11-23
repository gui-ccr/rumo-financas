import { cva, type VariantProps } from 'class-variance-authority';
import * as Haptics from 'expo-haptics';
import { ActivityIndicator, Pressable } from 'react-native';

import { cn } from './cn';
import { TextClassContext } from './text';
import { useThemeColors } from './theme';

/**
 * React Native Reusables Button on the Brankas system: pill shapes, 54pt main CTA.
 * default = filled indigo with lavender label (kit "Dark"), accent = periwinkle with
 * ink label (kit "Primary", one per screen at most), secondary = graphite tile,
 * outline = neutral, ghost = text-only, destructive = irreversible actions.
 * States: pressed (active:), disabled (opacity), loading (spinner, busy).
 */
const buttonVariants = cva('group shrink-0 flex-row items-center justify-center gap-2 rounded-full', {
  variants: {
    variant: {
      default: 'bg-primary active:opacity-85',
      accent: 'bg-accent active:opacity-85',
      destructive: 'bg-expense-soft active:opacity-80',
      outline: 'border border-border active:bg-muted',
      secondary: 'bg-muted active:opacity-75',
      ghost: 'active:bg-muted',
      link: '',
    },
    size: {
      default: 'h-12 px-5',
      sm: 'h-9 px-4',
      lg: 'h-[54px] px-6',
      icon: 'h-11 w-11',
    },
  },
  defaultVariants: { variant: 'default', size: 'default' },
});

const buttonTextVariants = cva('font-sans-semibold text-base text-foreground', {
  variants: {
    variant: {
      default: 'text-primary-foreground',
      accent: 'text-accent-foreground',
      destructive: 'text-expense',
      outline: '',
      secondary: '',
      ghost: '',
      link: 'text-accent group-active:underline',
    },
    size: { default: '', sm: 'text-sm', lg: 'text-base', icon: '' },
  },
  defaultVariants: { variant: 'default', size: 'default' },
});

type ButtonProps = React.ComponentProps<typeof Pressable> &
  VariantProps<typeof buttonVariants> & { loading?: boolean; haptic?: boolean };

function Button({ className, variant, size, loading, haptic = true, disabled, onPress, children, ...props }: ButtonProps) {
  const colors = useThemeColors();
  const spinner =
    variant === 'accent' ? colors.accentForeground : variant === 'default' || !variant ? colors.primaryForeground : colors.foreground;
  return (
    <TextClassContext.Provider value={buttonTextVariants({ variant, size })}>
      <Pressable
        className={cn((disabled || loading) && 'opacity-45', buttonVariants({ variant, size }), className)}
        role="button"
        accessibilityState={{ disabled: !!(disabled || loading), busy: !!loading }}
        disabled={disabled || loading}
        onPress={(e) => {
          if (haptic) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
          onPress?.(e);
        }}
        {...props}>
        {loading ? <ActivityIndicator size="small" color={spinner} /> : children}
      </Pressable>
    </TextClassContext.Provider>
  );
}

export { Button, buttonTextVariants, buttonVariants };
export type { ButtonProps };
