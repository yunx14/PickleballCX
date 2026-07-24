import { Platform, type TextStyle, type ViewStyle } from 'react-native';

import { brand } from './brand';

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
} as const;

export const border = {
  color: '#E9ECEF',
  colorStrong: '#DEE2E6',
  width: 1,
} as const;

export const typography = {
  eyebrow: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  } satisfies TextStyle,
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: brand.green900,
  } satisfies TextStyle,
  titleSm: {
    fontSize: 22,
    fontWeight: '700',
    color: brand.text,
  } satisfies TextStyle,
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: brand.muted,
  } satisfies TextStyle,
  body: {
    fontSize: 15,
    lineHeight: 22,
    color: brand.text,
  } satisfies TextStyle,
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: brand.text,
  } satisfies TextStyle,
  caption: {
    fontSize: 13,
    color: brand.muted,
  } satisfies TextStyle,
} as const;

export function cardShadow(): ViewStyle {
  return Platform.select({
    ios: {
      shadowColor: '#1B4332',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
    },
    android: {
      elevation: 2,
    },
    default: {},
  }) as ViewStyle;
}

export const theme = {
  colors: brand,
  spacing,
  radius,
  border,
  typography,
  cardShadow,
} as const;
