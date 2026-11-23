import { DarkTheme, DefaultTheme, type Theme } from 'expo-router';
import { useColorScheme } from 'nativewind';

/**
 * Rumo brand colors. Fixed across themes; use for identity marks only.
 * Everything else reads from useThemeColors(), which mirrors src/global.css.
 */
export const palette = {
  navy: '#141B3A',
  indigo: '#2B3A8C',
  periwinkle: '#7C83FD',
  lavender: '#C7D2FE',
  snow: '#F5F6FF',
  ink: '#121212',
} as const;

const LIGHT = {
  background: '#FFFFFF',
  foreground: '#121212',
  card: '#F2F2F4',
  cardTop: '#FBFBFC',
  cardBottom: '#EDEDF0',
  primary: palette.indigo,
  primaryForeground: palette.lavender,
  secondary: '#ECEEFF',
  muted: '#E6E6EA',
  mutedForeground: '#6E6E73',
  accent: '#4C55E0',
  accentForeground: '#FFFFFF',
  border: '#E4E4E8',
  iconMuted: '#B8B8BC',
  track: '#D9D9D9',
  income: '#16803C',
  expense: '#D93036',
  warning: '#B26716',
  scrim: '#121212',
};

export type ThemeColors = Record<keyof typeof LIGHT, string>;

const DARK: ThemeColors = {
  background: '#121212',
  foreground: '#F5F5F5',
  card: '#1D1D1F',
  cardTop: '#2C2C2F',
  cardBottom: '#1D1D1F',
  primary: '#3745AF',
  primaryForeground: palette.lavender,
  secondary: '#1E2142',
  muted: '#2A2A2D',
  mutedForeground: '#8E8E93',
  accent: palette.periwinkle,
  accentForeground: '#121212',
  border: '#2E2E31',
  iconMuted: '#6B6B70',
  track: '#3D3D3D',
  income: '#5FD38A',
  expense: '#FF6B6B',
  warning: '#F0A04B',
  scrim: '#000000',
};


export function useIsDark(): boolean {
  return useColorScheme().colorScheme !== 'light';
}

/** JS-side colors for icons, navigation chrome, gradients and Reanimated. */
export function useThemeColors(): ThemeColors {
  return useIsDark() ? DARK : LIGHT;
}

/** Spacing scale (4pt grid). Screen gutter is 20 (kit), list rows are 64 tall. */
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, gutter: 20 } as const;

/** Elevation for light mode only; dark mode separates surfaces by tone, not shadow. */
export const elevation = {
  card: '0 8px 24px rgba(18, 18, 18, 0.08)',
  sheet: '0 -6px 18px rgba(18, 18, 18, 0.06)',
} as const;

export function useNavTheme(): Theme {
  const dark = useIsDark();
  const c = dark ? DARK : LIGHT;
  const base = dark ? DarkTheme : DefaultTheme;
  return {
    ...base,
    colors: {
      ...base.colors,
      background: c.background,
      border: c.border,
      card: c.background,
      notification: c.expense,
      primary: c.accent,
      text: c.foreground,
    },
  };
}
