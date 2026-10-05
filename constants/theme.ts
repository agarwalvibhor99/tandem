import { Appearance, type TextStyle, type ViewStyle } from 'react-native';

const lightTokens = {
  bg: '#FAF8F7',
  surface: '#FFFFFF',
  ink: '#2A2226',
  muted: '#6B5F66',
  line: '#E4DBD8',
  chip: '#F1ECEA',
  accent: '#84506A',
  accentInk: '#FFFFFF',
  accentSoft: '#F3E7ED',
  disabled: '#D9CFD3',
  disabledInk: '#8E8087',
  success: '#3F7D5C',
  danger: '#B4423A',
  scrim: '#2A222666',
} as const;

const darkTokens = {
  bg: '#1B1719',
  surface: '#262023',
  ink: '#F3ECEF',
  muted: '#B3A6AD',
  line: '#3A3236',
  chip: '#2F282C',
  accent: '#C58AA5',
  accentInk: '#2A1420',
  accentSoft: '#3A2630',
  disabled: '#3A3236',
  disabledInk: '#86797F',
  success: '#7CC4A0',
  danger: '#F08A82',
  scrim: '#00000099',
} as const;

export const colorTokens = { light: lightTokens, dark: darkTokens } as const;
export type ColorScheme = keyof typeof colorTokens;
export type ColorToken = keyof typeof lightTokens;

const scheme: ColorScheme = Appearance.getColorScheme() === 'dark' ? 'dark' : 'light';
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
  warning: tokens.muted,
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
} as const;

export const typography = {
  display: { fontSize: 36, lineHeight: 44, fontWeight: '700', letterSpacing: -1, fontFamily: 'Bricolage Grotesque, System' },
  title: { fontSize: 24, lineHeight: 32, fontWeight: '600', letterSpacing: -0.4, fontFamily: 'Bricolage Grotesque, System' },
  heading: { fontSize: 18, lineHeight: 26, fontWeight: '600', fontFamily: 'Figtree, System' },
  body: { fontSize: 16, lineHeight: 24, fontWeight: '400', fontFamily: 'Figtree, System' },
  label: { fontSize: 14, lineHeight: 20, fontWeight: '600', fontFamily: 'Figtree, System' },
  caption: { fontSize: 13, lineHeight: 20, fontWeight: '400', fontFamily: 'Figtree, System' },
  tab: { fontSize: 12, lineHeight: 16, fontWeight: '600', fontFamily: 'Figtree, System' },
  money: { fontSize: 64, lineHeight: 76, fontWeight: '700', letterSpacing: -2, fontFamily: 'Bricolage Grotesque, System', fontVariant: ['tabular-nums'] },
  heroInput: { fontSize: 34, lineHeight: 44, fontWeight: '600', fontFamily: 'Bricolage Grotesque, System' },
  moneyCurrency: { fontSize: 44, lineHeight: 64, fontWeight: '700', fontFamily: 'Bricolage Grotesque, System', fontVariant: ['tabular-nums'] },
} as const satisfies Record<string, TextStyle>;

export const radii = { sm: 8, md: 16, lg: 22, xl: 24, pill: 999 } as const;

export const shadows = {
  card: {
    boxShadow: 'none',
  },
} as const satisfies Record<string, ViewStyle>;

export const layout = {
  contentMaxWidth: 640,
  dialogMaxWidth: 420,
  dashboardTileMinWidth: 144,
  minTouchTarget: 44,
  tabBarHeight: 78,
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
  groupedRowHeight: 72,
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
  pickerHeight: 190,
  amountCurrencySize: 44,
  amountCurrencyLineHeight: 64,
  amountInputMinWidth: 180,
  amountRowMinWidth: 240,
} as const;

export const borders = { thin: 1, strong: 1.5, focus: 2 } as const;
