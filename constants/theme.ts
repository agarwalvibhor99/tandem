import { Appearance, Platform, type TextStyle, type ViewStyle } from 'react-native';

const lightTokens = {
  bg: '#FFFDF8',
  surface: '#FFFFFF',
  ink: '#263B35',
  muted: '#62766B',
  line: '#E8E8E0',
  chip: '#F0F3EC',
  accent: '#294B40',
  accentInk: '#FFFFFF',
  accentSoft: '#DCE8DF',
  disabled: '#E2E8DF',
  disabledInk: '#6E7D73',
  success: '#46755A',
  successSoft: '#EDF4EA',
  warning: '#936622',
  warningSoft: '#F7EDDA',
  danger: '#AD4D4D',
  dangerSoft: '#FBEDEC',
  scrim: '#263B3566',
  hero: '#F1F5ED',
  peach: '#F5D6BF',
  sand: '#E8E4D6',
  sage: '#A8BCB0',
  nudgeRose: '#C66B83',
  nudgeRoseVein: '#8D3D59',
  nudgeCoffee: '#8C6046',
  nudgeRoseLight: '#F2A8B7',
  nudgeRoseDeep: '#9E405F',
  nudgeStem: '#517E60',
  nudgeLeaf: '#8DB798',
  nudgeCoffeeLight: '#C79A73',
  nudgeCup: '#FFF9EF',
  nudgeCupShade: '#DCD7CC',
} as const;

const darkTokens = {
  bg: '#18241F',
  surface: '#263B35',
  ink: '#F4F4E9',
  muted: '#B3C0B4',
  line: '#3C4D42',
  chip: '#2C3D32',
  accent: '#B3D0B7',
  accentInk: '#182C22',
  accentSoft: '#314C3C',
  disabled: '#3C4D42',
  disabledInk: '#8C9F90',
  success: '#B8D6B8',
  successSoft: '#2A4433',
  warning: '#DFC391',
  warningSoft: '#473E2C',
  danger: '#EFB4AF',
  dangerSoft: '#4D3330',
  scrim: '#00000099',
  hero: '#25372B',
  peach: '#4B3F32',
  sand: '#3E4232',
  sage: '#89AD91',
  nudgeRose: '#DFA0B2',
  nudgeRoseVein: '#9E5A71',
  nudgeCoffee: '#C79A77',
  nudgeRoseLight: '#F0B9C7',
  nudgeRoseDeep: '#A95470',
  nudgeStem: '#9BC7A0',
  nudgeLeaf: '#6B9474',
  nudgeCoffeeLight: '#E0B48E',
  nudgeCup: '#F5EEE4',
  nudgeCupShade: '#BAB4AA',
} as const;

export const colorTokens = { light: lightTokens, dark: darkTokens } as const;
export type ColorScheme = keyof typeof colorTokens;
export type ColorToken = keyof typeof lightTokens;

function storedThemePreference(): ColorScheme | null {
  if (typeof window === 'undefined') return null;
  try {
    const value = window.localStorage.getItem('tandem.theme.preference');
    return value === 'light' || value === 'dark' ? value : null;
  } catch { return null; }
}

const scheme: ColorScheme = storedThemePreference() ?? (Appearance.getColorScheme() === 'dark' ? 'dark' : 'light');
const tokens = colorTokens[scheme];

export const colors = {
  ...tokens,
  background: tokens.bg,
  surfaceMuted: tokens.chip,
  surfaceWarm: tokens.surface,
  text: tokens.ink,
  textSecondary: tokens.muted,
  accentPressed: tokens.accent,
  onAccent: tokens.accentInk,
  border: tokens.line,
  error: tokens.danger,
  dangerSoft: tokens.dangerSoft,
  warning: tokens.warning,
  warningSoft: tokens.warningSoft,
  successSoft: tokens.successSoft,
  partner: tokens.muted,
  partnerSoft: tokens.peach,
  nudgeRose: tokens.nudgeRose,
  nudgeRoseVein: tokens.nudgeRoseVein,
  nudgeCoffee: tokens.nudgeCoffee,
  nudgeRoseLight: tokens.nudgeRoseLight,
  nudgeRoseDeep: tokens.nudgeRoseDeep,
  nudgeStem: tokens.nudgeStem,
  nudgeLeaf: tokens.nudgeLeaf,
  nudgeCoffeeLight: tokens.nudgeCoffeeLight,
  nudgeCup: tokens.nudgeCup,
  nudgeCupShade: tokens.nudgeCupShade,
  together: tokens.accent,
  togetherSoft: tokens.accentSoft,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
  page: 20,
} as const;

const sans = Platform.select({ web: 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif', default: 'System' });
const serif = Platform.select({ web: 'Georgia, serif', ios: 'Georgia', default: 'serif' });

export const typography = {
  tileTitle: { fontSize: 15, lineHeight: 21, fontWeight: '700', fontFamily: sans },
  micro: { fontSize: 11, lineHeight: 17, fontWeight: '400', fontFamily: sans },
  count: { fontSize: 10, lineHeight: 15, fontWeight: '700', fontFamily: sans },
  glyph: { fontSize: 22, lineHeight: 28, fontFamily: sans },
  brand: { fontSize: 29, lineHeight: 36, fontWeight: '700', letterSpacing: -1.5, fontFamily: serif },
  editorial: { fontSize: 35, lineHeight: 40, fontWeight: '400', letterSpacing: -1.75, fontFamily: serif },
  eyebrow: { fontSize: 11, lineHeight: 18, fontWeight: '700', letterSpacing: 1.7, textTransform: 'uppercase', fontFamily: sans },
  display: { fontSize: 37, lineHeight: 41, fontWeight: '700', letterSpacing: -2, fontFamily: sans },
  title: { fontSize: 26, lineHeight: 34, fontWeight: '700', letterSpacing: 0, fontFamily: sans },
  heading: { fontSize: 17, lineHeight: 24, fontWeight: '600', fontFamily: sans },
  body: { fontSize: 14, lineHeight: 23, fontWeight: '400', fontFamily: sans },
  label: { fontSize: 14, lineHeight: 20, fontWeight: '600', fontFamily: sans },
  caption: { fontSize: 12, lineHeight: 19, fontWeight: '400', fontFamily: sans },
  tab: { fontSize: 10, lineHeight: 15, fontWeight: '600', fontFamily: sans },
  money: { fontSize: 64, lineHeight: 76, fontWeight: '700', letterSpacing: -2, fontFamily: sans, fontVariant: ['tabular-nums'] },
  heroInput: { fontSize: 32, lineHeight: 42, fontWeight: '700', letterSpacing: 0, fontFamily: sans },
  moneyCurrency: { fontSize: 44, lineHeight: 64, fontWeight: '700', fontFamily: sans, fontVariant: ['tabular-nums'] },
} as const satisfies Record<string, TextStyle>;

export const radii = { sm: 8, md: 14, lg: 20, xl: 28, artLarge: 140, artSmall: 90, pill: 999 } as const;

export const shadows = {
  card: {
    boxShadow: `0px 6px 18px rgba(38, 59, 53, 0.04)`,
  },
  soft: {
    boxShadow: `0px 2px 6px rgba(38, 59, 53, 0.025)`,
  },
} as const satisfies Record<string, ViewStyle>;

export const layout = {
  contentMaxWidth: 440,
  welcomeArtHeight: 275,
  welcomeArtWidth: 248,
  welcomeHeartSize: 130,
  quickActionWidth: 96,
  calendarRailWidth: 4,
  calendarTimeWidth: 60,
  metricHeight: 123,
  tabCaptureSize: 50,
  dialogMaxWidth: 420,
  dashboardTileMinWidth: 124,
  minTouchTarget: 44,
  tabBarHeight: 74,
  iconSize: 20,
  featureIconSize: 28,
  iconContainerSize: 56,
  iconBadgeSize: 36,
  avatarSize: 36,
  emojiSize: 22,
  emojiLineHeight: 28,
  pageMargin: 24,
  fieldGap: 26,
  fieldHeight: 53,
  heroFieldHeight: 86,
  groupedRowHeight: 68,
  listRowHeight: 64,
  dashboardRowHeight: 88,
  eventCardHeight: 78,
  connectionRowHeight: 68,
  avatarStackWidth: 58,
  avatarOverlap: 14,
  spendingBarHeight: 10,
  spendingMarkerWidth: 8,
  spendingMarkerHeight: 28,
  iconTileMinWidth: 76,
  iconTileMinHeight: 74,
  smallControlHeight: 32,
  compactIconSize: 30,
  pickerHeight: 220,
  amountCurrencySize: 44,
  amountCurrencyLineHeight: 64,
  amountInputMinWidth: 180,
  amountRowMinWidth: 240,
  nudgeHeroSize: 240,
  nudgeCupSize: 146,
  nudgeTraceSize: 58,
} as const;

export const borders = { thin: 1, strong: 1.5, focus: 2 } as const;

/** Measurements and timing from the first-run reference, shared across features. */
export const reference = {
  page: 25, sectionGap: 23, tilePadding: 17, tileGap: 11, choicePadding: 17,
  headerTop: 32, headerBottom: 15, greetingPadding: 10, stripRadius: 17,
  stripPadding: 12, stripAvatar: 28, choiceIcon: 45, choiceRadius: 18,
  chartHeight: 124, bannerPadding: 19, bannerRadius: 22, bannerDateHeight: 62,
  sheetPadding: 26, roundSize: 36, glyphSize: 22, iconStroke: 1.5,
  screenDuration: 450, screenOffset: 18, sheetDuration: 350, sheetOffset: 80,
  pressDuration: 200, pressScale: 0.98, hoverOffset: -2, chartDuration: 850,
  breatheDuration: 7000, floatDuration: 4000, twinkleDuration: 2500,
  floatOffset: -13, breatheScale: 1.1,
  chartColors: ['#B6D0B9', '#EDC8AC', '#799F88', '#D5B885'],
} as const;
