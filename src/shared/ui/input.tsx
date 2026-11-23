import { useState } from 'react';
import { TextInput } from 'react-native';

import { cn } from './cn';
import { useThemeColors } from './theme';

/** React Native Reusables Input (kit "Input Field"): graphite tile, accent border on focus. */
function Input({ className, onFocus, onBlur, ...props }: React.ComponentProps<typeof TextInput>) {
  const colors = useThemeColors();
  const [focused, setFocused] = useState(false);
  return (
    <TextInput
      placeholderTextColor={colors.mutedForeground}
      selectionColor={colors.accent}
      onFocus={(e) => {
        setFocused(true);
        onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocused(false);
        onBlur?.(e);
      }}
      className={cn(
        'h-[54px] w-full rounded-lg border bg-card px-4 font-sans text-base text-foreground',
        focused ? 'border-accent' : 'border-transparent',
        props.editable === false && 'opacity-50',
        className,
      )}
      {...props}
    />
  );
}

export { Input };
