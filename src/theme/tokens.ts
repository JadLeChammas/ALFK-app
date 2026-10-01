export type ColorScheme = 'light' | 'dark';

/**
 * Brand palette (v2):
 *   red   #AE0000 — main: actions, emphasis, live markers
 *   blue  #6680AE — main: navigation, icons, globe & charts
 *   navy  #00206A — accent: headings on brand surfaces, strong buttons, hero panels
 *   sky   #C8D3E5 — accent: soft fills, borders, globe land
 *   white          — card surfaces (the app background is a light-blue tint)
 */
export const brand = { red: '#AE0000', blue: '#6680AE', navy: '#00206A', sky: '#C8D3E5', white: '#FFFFFF' } as const;

const light = {
  bg: '#E4EAF4',
  surface: '#FFFFFF',
  surfaceAlt: '#EEF2F8',
  surfaceHover: '#E9EEF6',
  border: '#D5DEEB',
  borderStrong: '#C8D3E5',
  text: '#0A1633',
  textMuted: '#4B5876',
  textSubtle: '#8290AC',
  primary: '#AE0000',
  primaryPressed: '#8E0000',
  /** Soft fill behind red text/icons — pale brand blue, so red never sits on pink. */
  primarySoft: '#E8EEF8',
  onPrimary: '#FFFFFF',
  secondary: '#6680AE',
  secondaryStrong: '#3F5A8C',
  secondarySoft: '#EDF1F8',
  navy: '#00206A',
  sky: '#C8D3E5',
  /** Navigation chrome (sidebar, phone bars): brand navy in light, a deep navy below the cards in dark. */
  rail: '#00206A',
  /** Aliases used by newer screens: red actions and the navy navigation. */
  accent: '#AE0000',
  accentPressed: '#8E0000',
  accentSoft: '#E8EEF8',
  onAccent: '#FFFFFF',
  nav: '#00206A',
  navText: '#C8D3E5',
  navActive: 'rgba(102, 128, 174, 0.28)',
  ink: '#00206A',
  onInk: '#FFFFFF',
  silver: '#A7ADBA',
  success: '#12A150',
  successSoft: '#E3F6EB',
  warning: '#B98500',
  warningSoft: '#FFF4D6',
  danger: '#D92D20',
  dangerSoft: '#FDECEA',
  info: '#3F5A8C',
  infoSoft: '#EDF1F8',
  violet: '#7C4DDB',
  violetSoft: '#F0EAFD',
  overlay: 'rgba(0, 16, 53, 0.55)',
  bubbleMine: '#00206A',
  bubbleTheirs: '#F3F6FB',
  shadow: 'rgba(0, 32, 106, 0.08)',
  /** Categorical chart order: navy, red, blue, amber. */
  chart: ['#00206A', '#AE0000', '#6680AE', '#9DB0D3'],
};

const dark: typeof light = {
  bg: '#07112B',
  surface: '#0D1A3B',
  surfaceAlt: '#132248',
  surfaceHover: '#172A55',
  border: '#1F3160',
  borderStrong: '#2D4378',
  text: '#EEF2FA',
  textMuted: '#A9B6D1',
  textSubtle: '#7282A6',
  primary: '#E23B40',
  primaryPressed: '#C62F35',
  primarySoft: '#16254A',
  onPrimary: '#FFFFFF',
  secondary: '#8FA5CF',
  secondaryStrong: '#B4C4E2',
  secondarySoft: '#16254A',
  navy: '#00206A',
  sky: '#C8D3E5',
  rail: '#040C24',
  accent: '#E23B40',
  accentPressed: '#C62F35',
  accentSoft: '#16254A',
  onAccent: '#FFFFFF',
  nav: '#040C24',
  navText: '#C8D3E5',
  navActive: 'rgba(102, 128, 174, 0.28)',
  ink: '#B4C4E2',
  onInk: '#040B1F',
  silver: '#C9CED8',
  success: '#3DD68C',
  successSoft: '#10291E',
  warning: '#F5C542',
  warningSoft: '#2B2412',
  danger: '#FF6B6B',
  dangerSoft: '#2E1416',
  info: '#8FA5CF',
  infoSoft: '#16254A',
  violet: '#A98BFF',
  violetSoft: '#221A38',
  overlay: 'rgba(0, 0, 0, 0.7)',
  bubbleMine: '#6680AE',
  bubbleTheirs: '#14244A',
  shadow: 'rgba(0, 0, 0, 0)',
  chart: ['#8FA5CF', '#E5393B', '#C8D3E5', '#4F6696'],
};

export const palettes = { light, dark };
export type Colors = typeof light;
export type ColorToken = Exclude<keyof Colors, 'chart'>;

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32, huge: 48 } as const;
export const radius = { sm: 6, input: 8, card: 12, hero: 16, pill: 999 } as const;

/**
 * Editorial pairing: Instrument Serif for display headlines, Inter for everything else.
 * (`extrabold` is kept as an alias so older call sites stay valid.)
 */
export const fonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  extrabold: 'Inter_700Bold',
  serif: 'InstrumentSerif_400Regular',
  serifItalic: 'InstrumentSerif_400Regular_Italic',
  /** Condensed display for giant figures (Bebas Neue). */
  display: 'BebasNeue_400Regular',
} as const;

export const type = {
  display: { fontFamily: fonts.serif, fontSize: 48, lineHeight: 52, letterSpacing: -0.6 },
  h1: { fontFamily: fonts.serif, fontSize: 36, lineHeight: 40, letterSpacing: -0.4 },
  h2: { fontFamily: fonts.semibold, fontSize: 18, lineHeight: 24, letterSpacing: -0.3 },
  h3: { fontFamily: fonts.semibold, fontSize: 15, lineHeight: 21, letterSpacing: -0.2 },
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 23 },
  bodyStrong: { fontFamily: fonts.medium, fontSize: 15, lineHeight: 22 },
  small: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 19 },
  smallStrong: { fontFamily: fonts.medium, fontSize: 13, lineHeight: 18 },
  caption: { fontFamily: fonts.medium, fontSize: 11, lineHeight: 14, letterSpacing: 1.6, textTransform: 'uppercase' as const },
} as const;
export type TypeVariant = keyof typeof type;

export const duration = { fast: 150, base: 200, slow: 250 } as const;

export const breakpoints = { tablet: 768, desktop: 1024, wide: 1280 } as const;
