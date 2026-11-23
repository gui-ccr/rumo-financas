import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Text } from './text';
import { palette } from './theme';

/**
 * The Rumo "R": an upper stroke in periwinkle folding over a lower stroke in
 * indigo, as in the brand mark. Vector, so it stays crisp at any size.
 */
export function RumoMark({ size = 24 }: { size?: number }) {
  return (
    <Svg width={size} height={(size * 84) / 100} viewBox="0 0 100 84" accessibilityLabel="Rumo">
      <Path d="M0 0H66C83 0 96 12 96 27C96 40 89 50 78 54V37C78 31 74 27 68 27H31Z" fill={palette.periwinkle} />
      <Path d="M0 84V65C0 51 11 41 25 41H50L100 84H71L45 60C36 58 29 64 27 72L25 84Z" fill={palette.indigo} />
    </Svg>
  );
}

export function RumoLogo() {
  return (
    <View className="flex-row items-center gap-2" accessible accessibilityLabel="Rumo">
      <RumoMark size={22} />
      <Text className="font-sans-bold text-xl tracking-tight">Rumo</Text>
    </View>
  );
}
