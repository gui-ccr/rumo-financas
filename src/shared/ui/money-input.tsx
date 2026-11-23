import { useState } from 'react';
import { TextInput, View } from 'react-native';

import { centsFromMaskedText, maskAmount } from '@/shared/domain/money';

import { cn } from './cn';
import { Text } from './text';
import { useThemeColors } from './theme';

/**
 * BRL amount field with a bank-style mask: the digits you type fill from the right
 * (1 -> R$ 0,01, 123456 -> R$ 1.234,56), the R$ prefix is fixed, and the keyboard is
 * numeric. Controlled by the value in cents, so the shown text always matches it,
 * including the initial value. null = empty.
 */
export function MoneyInput({
  value,
  onChange,
  placeholder = '0,00',
  autoFocus,
  accessibilityLabel = 'Valor em reais',
}: {
  value: number | null;
  onChange: (cents: number | null) => void;
  placeholder?: string;
  autoFocus?: boolean;
  accessibilityLabel?: string;
}) {
  const colors = useThemeColors();
  const [focused, setFocused] = useState(false);
  return (
    <View
      className={cn(
        'h-16 flex-row items-center gap-2 rounded-lg border bg-card px-4',
        focused ? 'border-accent' : 'border-transparent',
      )}>
      <Text className="font-mono-medium text-lg text-muted-foreground">R$</Text>
      <TextInput
        value={maskAmount(value)}
        onChangeText={(text) => {
          const cents = centsFromMaskedText(text);
          onChange(cents > 0 ? cents : null);
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
        selectionColor={colors.accent}
        keyboardType="number-pad"
        autoFocus={autoFocus}
        accessibilityLabel={accessibilityLabel}
        className="flex-1 font-mono-semibold text-3xl text-foreground"
        style={{ fontVariant: ['tabular-nums'] }}
      />
    </View>
  );
}
