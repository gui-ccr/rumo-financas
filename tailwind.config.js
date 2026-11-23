const { hairlineWidth } = require('nativewind/theme');

const hsl = (v) => `hsl(var(--${v}))`;

/**
 * Rumo design system. Colors come from CSS variables in src/global.css;
 * never hardcode hex values in components.
 */
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        border: hsl('border'),
        input: hsl('input'),
        ring: hsl('ring'),
        background: hsl('background'),
        foreground: hsl('foreground'),
        primary: { DEFAULT: hsl('primary'), foreground: hsl('primary-foreground') },
        secondary: { DEFAULT: hsl('secondary'), foreground: hsl('secondary-foreground') },
        destructive: { DEFAULT: hsl('destructive'), foreground: hsl('destructive-foreground') },
        muted: { DEFAULT: hsl('muted'), foreground: hsl('muted-foreground') },
        accent: { DEFAULT: hsl('accent'), foreground: hsl('accent-foreground') },
        popover: { DEFAULT: hsl('popover'), foreground: hsl('popover-foreground') },
        card: { DEFAULT: hsl('card'), foreground: hsl('card-foreground') },
        income: { DEFAULT: hsl("income"), soft: hsl("income-soft") },
        expense: { DEFAULT: hsl("expense"), soft: hsl("expense-soft") },
        warning: { DEFAULT: hsl("warning"), soft: hsl("warning-soft") },
        "icon-muted": hsl("icon-muted"),
        track: hsl("track"),
        // Brand palette, for identity surfaces (balance panel, logo).
        navy: '#141B3A',
        indigo: '#2B3A8C',
        periwinkle: '#7C83FD',
        lavender: '#C7D2FE',
        snow: '#F5F6FF',
      },
      // Brankas type system: Plus Jakarta Sans for UI, Geist Mono for figures.
      // Android needs one family per weight: use these, never font-bold.
      fontFamily: {
        sans: ['PlusJakartaSans_400Regular'],
        'sans-medium': ['PlusJakartaSans_500Medium'],
        'sans-semibold': ['PlusJakartaSans_600SemiBold'],
        'sans-bold': ['PlusJakartaSans_700Bold'],
        display: ['PlusJakartaSans_600SemiBold'],
        'display-bold': ['PlusJakartaSans_700Bold'],
        'display-heavy': ['PlusJakartaSans_800ExtraBold'],
        mono: ['GeistMono_400Regular'],
        'mono-medium': ['GeistMono_500Medium'],
        'mono-semibold': ['GeistMono_600SemiBold'],
      },
      // Type scale (px) from the kit's text styles; tracking tightens as size grows.
      fontSize: {
        '2xs': ['11px', { lineHeight: '14px', letterSpacing: '-0.1px' }],
        xs: ['12px', { lineHeight: '16px', letterSpacing: '-0.12px' }],
        sm: ['13px', { lineHeight: '18px', letterSpacing: '-0.13px' }],
        base: ['15px', { lineHeight: '22px', letterSpacing: '-0.3px' }],
        lg: ['17px', { lineHeight: '22px', letterSpacing: '-0.34px' }],
        xl: ['20px', { lineHeight: '26px', letterSpacing: '-0.4px' }],
        '2xl': ['24px', { lineHeight: '30px', letterSpacing: '-0.72px' }],
        '3xl': ['28px', { lineHeight: '34px', letterSpacing: '-1.1px' }],
        '4xl': ['40px', { lineHeight: '48px', letterSpacing: '-1.6px' }],
        '5xl': ['44px', { lineHeight: '50px', letterSpacing: '-1.76px' }],
      },
      // Radius scale: 6 badges, 12 controls, 18 tiles, 24 surfaces, 36 sheets; pills use rounded-full.
      borderRadius: {
        sm: '6px',
        md: '12px',
        lg: '18px',
        xl: '24px',
        '2xl': '36px',
      },
      borderWidth: { hairline: hairlineWidth() },
    },
  },
  future: { hoverOnlyWhenSupported: true },
  plugins: [require('tailwindcss-animate')],
};
