import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Pressable, View, type LayoutChangeEvent } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, withTiming } from 'react-native-reanimated';

import { cn } from './cn';
import { Text } from './text';
import { motion } from './motion';

export type SegmentOption<T extends string> = { value: T; label: string };

/** Segmented control (kit "Tabs"): pill track, the thumb slides to the chosen option. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  className,
}: {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  const [width, setWidth] = useState(0);
  const index = Math.max(
    options.findIndex((o) => o.value === value),
    0,
  );
  const segment = width / options.length;

  const thumb = useAnimatedStyle(() => ({
    width: segment,
    transform: [
      { translateX: reduceMotion ? index * segment : withTiming(index * segment, { duration: motion.fast }) },
    ],
  }));

  return (
    <View
      className={cn('h-10 flex-row rounded-full bg-muted p-[3px]', className)}
      onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width - 6)}
      accessibilityRole="tablist">
      {width > 0 && (
        <Animated.View
          className="absolute bottom-[3px] left-[3px] top-[3px] rounded-full bg-foreground"
          style={thumb}
        />
      )}
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <Pressable
            key={o.value}
            className="flex-1 items-center justify-center"
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => {
              if (!selected) Haptics.selectionAsync().catch(() => {});
              onChange(o.value);
            }}>
            <Text className={cn('text-sm', selected ? 'font-sans-semibold text-background' : 'font-sans-medium text-muted-foreground')}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
