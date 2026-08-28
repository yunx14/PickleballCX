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

/** Session cards wrap into extra columns once this width fits. */
export const layout = {
  cardMinWidth: 320,
  /** Below this width the UI is treated as a phone (no card map previews). */
  compactMaxWidth: 700,
} as const;

export const border = {
  color: brand.border,
  colorStrong: brand.borderStrong,
  width: 1,
} as const;

export const typography = {
  eyebrow: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  } satisfies TextStyle,
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: brand.text,
    letterSpacing: -0.5,
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
      shadowColor: brand.accent,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.06,
      shadowRadius: 12,
    },
    android: {
      elevation: 3,
    },
    default: {},
  }) as ViewStyle;
}

export const theme = {
  colors: brand,
  spacing,
  radius,
  border,
  layout,
  typography,
  cardShadow,
} as const;
