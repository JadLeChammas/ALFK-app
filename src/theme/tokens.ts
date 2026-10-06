export type ColorScheme = 'light' | 'dark';

/**
 * Brand palette (v3 — « Classic French Academic »):
 *   red   #C53B3E Muted Red     — actions, emphasis, live markers
 *   blue  #D7B46A Soft Gold     — accents: icons, active navigation, globe & charts (key kept as `blue`)
 *   navy  #0E2A47 Midnight Navy — navigation, headings on brand surfaces, hero panels
 *   sky   #E7ECF2 Light Gray    — soft fills, borders, light text on navy
 *   white #F8FAFC Crisp White   — light surfaces
 */
export const brand = { red: '#C53B3E', blue: '#D7B46A', navy: '#0E2A47', sky: '#E7ECF2', white: '#F8FAFC' } as const;

const light = {
  bg: '#E7ECF2',
  surface: '#FFFFFF',
  surfaceAlt: '#F8FAFC',
  surfaceHover: '#EEF2F6',
  border: '#DCE3EB',
  borderStrong: '#C9D3DE',
  text: '#0E2A47',
  textMuted: '#4A5B70',
  textSubtle: '#8592A3',
  primary: '#C53B3E',
  primaryPressed: '#A83235',
  /** Soft fill behind red text/icons — light gray, so red never sits on pink. */
  primarySoft: '#F3F5F8',
  onPrimary: '#FFFFFF',
  secondary: '#C9A55A',
  secondaryStrong: '#8A6A23',
  secondarySoft: '#F7F0E0',
  navy: '#0E2A47',
  sky: '#E7ECF2',
  /** Navigation chrome (sidebar, phone bars): brand navy in light, a deep navy below the cards in dark. */
  rail: '#0E2A47',
  /** Aliases used by newer screens: red actions and the navy navigation. */
  accent: '#C53B3E',
  accentPressed: '#A83235',
  accentSoft: '#F3F5F8',
  onAccent: '#FFFFFF',
  nav: '#0E2A47',
  navText: '#E7ECF2',
  navActive: 'rgba(215, 180, 106, 0.22)',
  ink: '#0E2A47',
  onInk: '#FFFFFF',
  silver: '#A7ADBA',
  success: '#12A150',
  successSoft: '#E3F6EB',
  warning: '#B98500',
  warningSoft: '#FFF4D6',
  danger: '#D92D20',
  dangerSoft: '#FDECEA',
  info: '#2F4A68',
  infoSoft: '#EBF0F5',
  violet: '#7C4DDB',
  violetSoft: '#F0EAFD',
  overlay: 'rgba(0, 16, 53, 0.55)',
  bubbleMine: '#0E2A47',
  bubbleTheirs: '#F1F4F8',
  shadow: 'rgba(14, 42, 71, 0.08)',
  /** Categorical chart order: navy, red, gold, slate. */
  chart: ['#0E2A47', '#C53B3E', '#D7B46A', '#8FA3B8'],
};

const dark: typeof light = {
  bg: '#081523',
  surface: '#0F2236',
  surfaceAlt: '#152C44',
  surfaceHover: '#1A344F',
  border: '#22405E',
  borderStrong: '#2F5070',
  text: '#F8FAFC',
  textMuted: '#B3C0CF',
  textSubtle: '#7D8FA4',
  primary: '#E05A5D',
  primaryPressed: '#C64A4D',
  primarySoft: '#1B2E44',
  onPrimary: '#FFFFFF',
  secondary: '#D7B46A',
  secondaryStrong: '#E6CC93',
  secondarySoft: '#2A2817',
  navy: '#0E2A47',
  sky: '#E7ECF2',
  rail: '#06111E',
  accent: '#E05A5D',
  accentPressed: '#C64A4D',
  accentSoft: '#1B2E44',
  onAccent: '#FFFFFF',
  nav: '#06111E',
  navText: '#E7ECF2',
  navActive: 'rgba(215, 180, 106, 0.2)',
  ink: '#E7ECF2',
  onInk: '#06111E',
  silver: '#C9CED8',
  success: '#3DD68C',
  successSoft: '#10291E',
  warning: '#F5C542',
  warningSoft: '#2B2412',
  danger: '#FF6B6B',
  dangerSoft: '#2E1416',
  info: '#9DB3C9',
  infoSoft: '#1B2E44',
  violet: '#A98BFF',
  violetSoft: '#221A38',
  overlay: 'rgba(0, 0, 0, 0.7)',
  bubbleMine: '#2F4A68',
  bubbleTheirs: '#152C44',
  shadow: 'rgba(0, 0, 0, 0)',
  chart: ['#D7B46A', '#E05A5D', '#E7ECF2', '#5E7A99'],
};

/** Hidden 2000s mode (5 taps on the logo): Windows 98 desktop, flashy links, yellow on navy. */
const retro: typeof light = {
  ...light,
  bg: '#008080',
  surface: '#C0C0C0',
  surfaceAlt: '#FFFFFF',
  surfaceHover: '#D4D0C8',
  border: '#808080',
  borderStrong: '#404040',
  text: '#000000',
  textMuted: '#202020',
  textSubtle: '#404040',
  primary: '#0000EE',
  primaryPressed: '#0000AA',
  primarySoft: '#FFFFCC',
  accent: '#FF00CC',
  accentPressed: '#CC0099',
  accentSoft: '#FFFFCC',
  secondary: '#008000',
  secondaryStrong: '#006400',
  secondarySoft: '#FFFFCC',
  navy: '#000080',
  sky: '#FFFF00',
  rail: '#000080',
  nav: '#000080',
  navText: '#FFFF00',
  navActive: 'rgba(255, 255, 0, 0.22)',
  ink: '#000080',
  onInk: '#FFFF00',
  danger: '#FF0000',
  success: '#00AA00',
  warning: '#FF8800',
  bubbleMine: '#0000EE',
  bubbleTheirs: '#FFFFCC',
  chart: ['#FF00CC', '#0000EE', '#00AA00', '#FF8800'],
};

export const palettes = { light, dark };
export const retroPalette = retro;

/** Hidden Minitel mode: phosphor green on black, like a 1990 Minitel screen. */
export const MINITEL_GREEN = '#39FF6A';
export const minitelPalette: typeof light = {
  ...dark,
  bg: '#000000',
  surface: '#020A04',
  surfaceAlt: '#04120A',
  surfaceHover: '#082012',
  border: '#1E6B35',
  borderStrong: '#2FA850',
  text: MINITEL_GREEN,
  textMuted: '#2ED158',
  textSubtle: '#1F9A42',
  primary: MINITEL_GREEN,
  primaryPressed: '#2ED158',
  primarySoft: '#06200F',
  onPrimary: '#000000',
  secondary: MINITEL_GREEN,
  secondaryStrong: MINITEL_GREEN,
  secondarySoft: '#06200F',
  rail: '#000000',
  accent: MINITEL_GREEN,
  accentPressed: '#2ED158',
  accentSoft: '#06200F',
  onAccent: '#000000',
  nav: '#000000',
  navText: MINITEL_GREEN,
  navActive: 'rgba(57, 255, 106, 0.18)',
  ink: '#000000',
  onInk: MINITEL_GREEN,
  success: MINITEL_GREEN,
  successSoft: '#06200F',
  warning: MINITEL_GREEN,
  warningSoft: '#06200F',
  danger: MINITEL_GREEN,
  dangerSoft: '#06200F',
  info: MINITEL_GREEN,
  infoSoft: '#06200F',
  bubbleMine: '#06200F',
  bubbleTheirs: '#020A04',
  overlay: 'rgba(0, 0, 0, 0.8)',
  chart: [MINITEL_GREEN, '#2ED158', '#1F9A42', '#156B2E'],
};

/** The futuristic mode's neon cyan (also used by its grid and HUD, components/FutureLayer.tsx). */
export const FUTURE_NEON = '#00E5FF';
/** Hidden futuristic mode « ALFK 2077 »: deep space blue, neon cyan and violet. */
export const futurePalette: typeof light = {
  ...dark,
  bg: '#03060F',
  surface: '#0A1226',
  surfaceAlt: '#0E1832',
  surfaceHover: '#12204A',
  border: '#123A5C',
  borderStrong: '#1B5C8A',
  text: '#E6F8FF',
  textMuted: '#9CC4E4',
  textSubtle: '#5F84A8',
  primary: FUTURE_NEON,
  primaryPressed: '#00B8CC',
  primarySoft: '#06263A',
  onPrimary: '#001018',
  secondary: '#B26BFF',
  secondaryStrong: '#D2A8FF',
  secondarySoft: '#1E1238',
  rail: '#050A1A',
  accent: FUTURE_NEON,
  accentPressed: '#00B8CC',
  accentSoft: '#06263A',
  onAccent: '#001018',
  nav: '#050A1A',
  navText: '#9CC4E4',
  navActive: 'rgba(0, 229, 255, 0.18)',
  ink: '#050A1A',
  onInk: '#E6F8FF',
  bubbleMine: '#0B4A66',
  bubbleTheirs: '#0E1832',
  overlay: 'rgba(0, 4, 16, 0.7)',
  chart: [FUTURE_NEON, '#B26BFF', '#FF3D9A', '#5F84A8'],
};
/** Comic Neue (Comic Sans look-alike that ships on every platform), used by the retro mode. */
export const retroFonts = { regular: 'ComicNeue_400Regular', bold: 'ComicNeue_700Bold' } as const;
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
