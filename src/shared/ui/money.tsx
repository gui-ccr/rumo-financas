import { View } from 'react-native';

import { formatBRL } from '@/shared/domain/money';

import { cn } from './cn';
import { Text } from './text';

type Tone = 'default' | 'income' | 'expense' | 'muted' | 'onBrand';
type Size = 'sm' | 'md' | 'lg' | 'xl';

const TONE: Record<Tone, string> = {
  default: 'text-foreground',
  income: 'text-income',
  expense: 'text-expense',
  muted: 'text-muted-foreground',
  onBrand: 'text-primary-foreground',
};

/** Figures set in Geist Mono (kit "Amount/*" styles): tabular by design, reais first. */
const SIZE: Record<Size, { main: string; minor: string }> = {
  sm: { main: 'font-mono-semibold text-[14px] leading-[18px] tracking-[-0.35px]', minor: '' },
  md: { main: 'font-mono-semibold text-xl', minor: 'font-mono-medium text-sm' },
  lg: { main: 'font-mono-semibold text-3xl', minor: 'font-mono-medium text-base' },
  xl: { main: 'font-mono-semibold text-4xl', minor: 'font-mono-medium text-xl' },
};

const TABULAR = { fontVariant: ['tabular-nums' as const] };

/**
 * A BRL amount. In larger sizes the currency and cents step down so the reais
 * read first. `sign` prefixes + for income and − for expenses.
 */
export function Money({
  cents,
  tone = 'default',
  size = 'sm',
  sign = false,
  className,
}: {
  cents: number;
  tone?: Tone;
  size?: Size;
  sign?: boolean;
  className?: string;
}) {
  const formatted = formatBRL(Math.abs(cents)); // "R$ 1.234,56"
  const negative = cents < 0 || (sign && tone === 'expense');
  const prefix = negative ? '−' : sign ? '+' : '';
  const color = TONE[tone];
  const label = `${negative ? 'menos ' : ''}${formatted}`;

  if (size === 'sm') {
    return (
      <Text accessibilityLabel={label} className={cn(SIZE.sm.main, color, className)} style={TABULAR}>
        {prefix}
        {formatted}
      </Text>
    );
  }

  const [, whole, decimals] = formatted.match(/^R\$\s?([\d.]+),(\d{2})$/) ?? [];
  return (
    <View accessible accessibilityLabel={label} className={cn('flex-row items-baseline', className)}>
      <Text className={cn(SIZE[size].minor, color, 'mr-1.5 opacity-50')}>{prefix}R$</Text>
      <Text className={cn(SIZE[size].main, color)} style={TABULAR}>
        {whole}
      </Text>
      <Text className={cn(SIZE[size].minor, color, 'opacity-50')} style={TABULAR}>
        ,{decimals}
      </Text>
    </View>
  );
}
