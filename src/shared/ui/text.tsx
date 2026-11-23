import { Slot } from '@rn-primitives/slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { Text as RNText, type Role } from 'react-native';

import { cn } from './cn';

/**
 * React Native Reusables Text on the Brankas type scale (Plus Jakarta Sans).
 *   display  44/50 semibold  one hero line per screen at most
 *   title    28/34 semibold  screen titles
 *   heading  17/22 semibold  sheet, modal and card titles
 *   section  17/22 semibold  group titles above lists (sentence case)
 *   label    13/18 medium    form labels
 *   default  15/22 regular   body
 *   muted    13/18 regular   secondary text
 *   caption  12/16 regular   auxiliary info
 * Figures use <Money> or className "font-mono-semibold" (Geist Mono).
 */
const textVariants = cva('font-sans text-base text-foreground', {
  variants: {
    variant: {
      default: '',
      display: 'font-display text-5xl',
      title: 'font-display text-3xl',
      heading: 'font-sans-semibold text-lg',
      section: 'font-sans-semibold text-lg',
      label: 'font-sans-medium text-sm',
      muted: 'text-sm text-muted-foreground',
      caption: 'text-xs text-muted-foreground',
    },
  },
  defaultVariants: { variant: 'default' },
});

type TextVariantProps = VariantProps<typeof textVariants>;
type TextVariant = NonNullable<TextVariantProps['variant']>;

const ROLE: Partial<Record<TextVariant, Role>> = { display: 'heading', title: 'heading', heading: 'heading' };

const TextClassContext = React.createContext<string | undefined>(undefined);

function Text({
  className,
  asChild = false,
  variant = 'default',
  ...props
}: React.ComponentProps<typeof RNText> & TextVariantProps & { asChild?: boolean }) {
  const textClass = React.useContext(TextClassContext);
  const Component = asChild ? Slot : RNText;
  return (
    <Component
      className={cn(textVariants({ variant }), textClass, className)}
      role={variant ? ROLE[variant] : undefined}
      {...props}
    />
  );
}

export { Text, TextClassContext };
