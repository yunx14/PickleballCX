export const brand = {
  background: '#000000',
  surface: '#1A1A1A',
  surfaceElevated: '#242424',
  accent: '#A3FF00',
  accentText: '#000000',
  accentSurface: '#1F2A0A',
  text: '#FFFFFF',
  muted: '#8A8A8A',
  border: '#333333',
  borderStrong: '#444444',
  danger: '#FF4757',
  warning: '#FF8C00',
  black: '#000000',
  white: '#FFFFFF',

  /** @deprecated Use `background` */
  sand: '#000000',
  /** @deprecated Use `text` for headings on dark backgrounds */
  green900: '#FFFFFF',
  /** @deprecated Use `accent` */
  green700: '#A3FF00',
  /** @deprecated Use `accent` */
  green500: '#A3FF00',
  /** @deprecated Use `accentSurface` */
  green100: '#1F2A0A',
} as const;

export type BrandColor = (typeof brand)[keyof typeof brand];
