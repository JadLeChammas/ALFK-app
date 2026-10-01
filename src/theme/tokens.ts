export type ColorScheme = 'light' | 'dark';

const light = {
  bg: '#E4EAF4',
  surface: '#FFFFFF',
  surfaceAlt: '#E9EEF6',
  surfaceHover: '#F2F5FA',
  border: '#DCE3EE',
  borderStrong: '#C8D3E5',
  text: '#0A1530',
  textMuted: '#4E5B78',
  textSubtle: '#7D88A3',
  primary: '#00206A',
  primaryPressed: '#001852',
  primarySoft: '#E4EAF4',
  onPrimary: '#FFFFFF',
  accent: '#AE0000',
  accentPressed: '#8F0000',
  accentSoft: '#FBE8E8',
  onAccent: '#FFFFFF',
  /** Navy sidebar and phone tab bar (the same brand navy in both themes). */
  nav: '#00206A',
  navText: '#C8D3E5',
  navActive: 'rgba(255, 255, 255, 0.12)',
  ink: '#00206A',
  onInk: '#FFFFFF',
  silver: '#A7ADBA',
  success: '#12A150',
  successSoft: '#E3F6EB',
  warning: '#B98500',
  warningSoft: '#FFF4D6',
  danger: '#C62828',
  dangerSoft: '#FBE9E9',
  info: '#0B8FCC',
  infoSoft: '#E1F3FB',
  violet: '#7C4DDB',
  violetSoft: '#F0EAFD',
  overlay: 'rgba(0, 16, 53, 0.55)',
  bubbleMine: '#00206A',
  bubbleTheirs: '#E9EEF6',
  shadow: 'rgba(0, 32, 106, 0.07)',
  /** Validated categorical chart order (dataviz validator, light surface). */
  chart: ['#00206A', '#E0A100', '#AE0000', '#12A150'],
};

const dark: typeof light = {
  bg: '#060B19',
  surface: '#0E1528',
  surfaceAlt: '#152038',
  surfaceHover: '#19253F',
  border: '#22304F',
  borderStrong: '#30406A',
  text: '#EEF2F8',
  textMuted: '#A5B0C8',
  textSubtle: '#6F7B96',
  primary: '#7E9BF0',
  primaryPressed: '#6B8AE8',
  primarySoft: '#16224A',
  onPrimary: '#FFFFFF',
  accent: '#D93A3A',
  accentPressed: '#C22F2F',
  accentSoft: '#341418',
  onAccent: '#FFFFFF',
  nav: '#0B1A44',
  navText: '#A5B0C8',
  navActive: 'rgba(255, 255, 255, 0.10)',
  ink: '#EEF2F8',
  onInk: '#060B19',
  silver: '#C9CED8',
  success: '#3DD68C',
  successSoft: '#12291E',
  warning: '#F5C542',
  warningSoft: '#2B2412',
  danger: '#FF6B6B',
  dangerSoft: '#341418',
  info: '#4CC3F5',
  infoSoft: '#10242E',
  violet: '#A98BFF',
  violetSoft: '#221A38',
  overlay: 'rgba(0, 0, 0, 0.7)',
  bubbleMine: '#2A4FA8',
  bubbleTheirs: '#1A2440',
  shadow: 'rgba(0, 0, 0, 0)',
  chart: ['#7E9BF0', '#B3861A', '#E05A5A', '#239E63'],
};

export const palettes = { light, dark };
export type Colors = typeof light;
export type ColorToken = Exclude<keyof Colors, 'chart'>;

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32, huge: 48 } as const;
export const radius = { sm: 10, input: 14, card: 20, hero: 28, pill: 999 } as const;

export const fonts = {
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  extrabold: 'Inter_800ExtraBold',
  /** Display titles (Instrument Serif has a single weight). */
  serif: 'InstrumentSerif_400Regular',
  serifItalic: 'InstrumentSerif_400Regular_Italic',
} as const;

export const type = {
  display: { fontFamily: fonts.serif, fontSize: 42, lineHeight: 46, letterSpacing: -0.4 },
  h1: { fontFamily: fonts.serif, fontSize: 34, lineHeight: 38, letterSpacing: -0.3 },
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
