export type ColorScheme = 'light' | 'dark';

const light = {
  bg: '#F6F7FB',
  surface: '#FFFFFF',
  surfaceAlt: '#F0F2F7',
  surfaceHover: '#F4F5FA',
  border: '#E6E8EF',
  borderStrong: '#D5D9E3',
  text: '#0E1320',
  textMuted: '#5B6275',
  textSubtle: '#8A90A0',
  primary: '#2E45D6',
  primaryPressed: '#2438B8',
  primarySoft: '#E9ECFF',
  onPrimary: '#FFFFFF',
  ink: '#111726',
  onInk: '#FFFFFF',
  silver: '#A7ADBA',
  success: '#12A150',
  successSoft: '#E3F6EB',
  warning: '#B98500',
  warningSoft: '#FFF4D6',
  danger: '#E5484D',
  dangerSoft: '#FDECEC',
  info: '#0B8FCC',
  infoSoft: '#E1F3FB',
  violet: '#7C4DDB',
  violetSoft: '#F0EAFD',
  overlay: 'rgba(8, 10, 16, 0.55)',
  bubbleMine: '#2E45D6',
  bubbleTheirs: '#F0F2F7',
  shadow: 'rgba(17, 23, 38, 0.06)',
  /** Validated categorical chart order (dataviz validator, light surface). */
  chart: ['#2E45D6', '#E0A100', '#7C4DDB', '#12A150'],
};

const dark: typeof light = {
  bg: '#0B0D12',
  surface: '#14171F',
  surfaceAlt: '#1B1F29',
  surfaceHover: '#1E2330',
  border: '#262B36',
  borderStrong: '#343A48',
  text: '#EEF0F5',
  textMuted: '#9AA1B2',
  textSubtle: '#6D7486',
  primary: '#6C7FFF',
  primaryPressed: '#5A6EF0',
  primarySoft: '#1C2250',
  onPrimary: '#FFFFFF',
  ink: '#EEF0F5',
  onInk: '#0B0D12',
  silver: '#C9CED8',
  success: '#3DD68C',
  successSoft: '#12291E',
  warning: '#F5C542',
  warningSoft: '#2B2412',
  danger: '#FF6B70',
  dangerSoft: '#2E1618',
  info: '#4CC3F5',
  infoSoft: '#10242E',
  violet: '#A98BFF',
  violetSoft: '#221A38',
  overlay: 'rgba(0, 0, 0, 0.7)',
  bubbleMine: '#4F63F0',
  bubbleTheirs: '#1F2430',
  shadow: 'rgba(0, 0, 0, 0)',
  chart: ['#6C7FFF', '#B3861A', '#9A7BF0', '#239E63'],
};

export const palettes = { light, dark };
export type Colors = typeof light;
export type ColorToken = Exclude<keyof Colors, 'chart'>;

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32, huge: 48 } as const;
export const radius = { sm: 10, input: 14, card: 20, hero: 28, pill: 999 } as const;

export const fonts = {
  medium: 'PlusJakartaSans_500Medium',
  semibold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
  extrabold: 'PlusJakartaSans_800ExtraBold',
} as const;

export const type = {
  display: { fontFamily: fonts.extrabold, fontSize: 34, lineHeight: 40, letterSpacing: -0.8 },
  h1: { fontFamily: fonts.extrabold, fontSize: 28, lineHeight: 34, letterSpacing: -0.6 },
  h2: { fontFamily: fonts.bold, fontSize: 20, lineHeight: 26, letterSpacing: -0.3 },
  h3: { fontFamily: fonts.bold, fontSize: 16, lineHeight: 22, letterSpacing: -0.2 },
  body: { fontFamily: fonts.medium, fontSize: 15, lineHeight: 22 },
  bodyStrong: { fontFamily: fonts.semibold, fontSize: 15, lineHeight: 22 },
  small: { fontFamily: fonts.medium, fontSize: 13, lineHeight: 18 },
  smallStrong: { fontFamily: fonts.semibold, fontSize: 13, lineHeight: 18 },
  caption: { fontFamily: fonts.bold, fontSize: 11, lineHeight: 14, letterSpacing: 1.1, textTransform: 'uppercase' as const },
} as const;
export type TypeVariant = keyof typeof type;

export const duration = { fast: 150, base: 200, slow: 250 } as const;

export const breakpoints = { tablet: 768, desktop: 1024, wide: 1280 } as const;
