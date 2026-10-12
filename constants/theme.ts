import { Appearance, type TextStyle, type ViewStyle } from 'react-native';

const lightTokens = {
  bg: '#F7FBFF',
  surface: '#FFFFFF',
  ink: '#172033',
  muted: '#66758A',
  line: '#DDEAF5',
  chip: '#EEF6FC',
  accent: '#5F6FF1',
  accentInk: '#FFFFFF',
  accentSoft: '#EEF0FF',
  disabled: '#D9E5EF',
  disabledInk: '#8392A3',
  success: '#2F9E83',
  successSoft: '#E8F8F3',
  warning: '#D18B22',
  warningSoft: '#FFF4DE',
  danger: '#D6535F',
  dangerSoft: '#FFF0F1',
  scrim: '#17203366',
} as const;

const darkTokens = {
  bg: '#101725',
  surface: '#172033',
  ink: '#F5FAFF',
  muted: '#AAB8C8',
  line: '#2B3A4D',
  chip: '#1F2B3D',
  accent: '#AEB7FF',
  accentInk: '#11183A',
  accentSoft: '#252C55',
  disabled: '#2B3A4D',
  disabledInk: '#8090A2',
  success: '#73D7BD',
  successSoft: '#17382F',
  warning: '#F0BC64',
  warningSoft: '#3E2E18',
  danger: '#FF97A0',
  dangerSoft: '#442128',
  scrim: '#00000099',
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
  partner: tokens.accent,
  partnerSoft: tokens.accentSoft,
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

export const typography = {
  display: { fontSize: 34, lineHeight: 42, fontWeight: '700', letterSpacing: 0, fontFamily: 'Bricolage Grotesque, System' },
  title: { fontSize: 26, lineHeight: 34, fontWeight: '700', letterSpacing: 0, fontFamily: 'Bricolage Grotesque, System' },
  heading: { fontSize: 18, lineHeight: 26, fontWeight: '600', fontFamily: 'Figtree, System' },
  body: { fontSize: 16, lineHeight: 24, fontWeight: '400', fontFamily: 'Figtree, System' },
  label: { fontSize: 14, lineHeight: 20, fontWeight: '600', fontFamily: 'Figtree, System' },
  caption: { fontSize: 13, lineHeight: 20, fontWeight: '400', fontFamily: 'Figtree, System' },
  tab: { fontSize: 12, lineHeight: 16, fontWeight: '600', fontFamily: 'Figtree, System' },
  money: { fontSize: 64, lineHeight: 76, fontWeight: '700', letterSpacing: -2, fontFamily: 'Bricolage Grotesque, System', fontVariant: ['tabular-nums'] },
  heroInput: { fontSize: 32, lineHeight: 42, fontWeight: '700', letterSpacing: 0, fontFamily: 'Bricolage Grotesque, System' },
  moneyCurrency: { fontSize: 44, lineHeight: 64, fontWeight: '700', fontFamily: 'Bricolage Grotesque, System', fontVariant: ['tabular-nums'] },
} as const satisfies Record<string, TextStyle>;

export const radii = { sm: 8, md: 14, lg: 20, xl: 24, pill: 999 } as const;

export const shadows = {
  card: {
    boxShadow: `0px 16px 34px rgba(35, 51, 130, 0.08)`,
  },
  soft: {
    boxShadow: `0px 8px 20px rgba(35, 51, 130, 0.05)`,
  },
} as const satisfies Record<string, ViewStyle>;

export const layout = {
  contentMaxWidth: 640,
  dialogMaxWidth: 420,
  dashboardTileMinWidth: 144,
  minTouchTarget: 44,
  tabBarHeight: 74,
  iconSize: 20,
  featureIconSize: 28,
  iconContainerSize: 56,
  iconBadgeSize: 36,
  avatarSize: 36,
  emojiSize: 22,
  emojiLineHeight: 28,
  pageMargin: 20,
  fieldGap: 26,
  fieldHeight: 56,
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
} as const;

export const borders = { thin: 1, strong: 1.5, focus: 2 } as const;
