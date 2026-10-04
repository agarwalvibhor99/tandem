import type { TextStyle, ViewStyle } from 'react-native';

export const colors = {
  background: '#FAF8F6',
  scrim: '#2F293366',
  surface: '#FFFFFF',
  surfaceMuted: '#F1EEEC',
  surfaceWarm: '#FFFBFA',
  text: '#2F2933',
  textSecondary: '#6B626B',
  accent: '#9B6077',
  accentPressed: '#7D4A60',
  accentSoft: '#F3E6EA',
  partner: '#7C6A9A',
  partnerSoft: '#EEEAF4',
  together: '#C07486',
  togetherSoft: '#F6E8EC',
  onAccent: '#FFFFFF',
  border: '#E5DFDD',
  error: '#AC3434',
  success: '#5E8B72',
  warning: '#9A6A3A',
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
  display: { fontSize: 36, lineHeight: 44, fontWeight: '700', letterSpacing: -1 },
  title: { fontSize: 24, lineHeight: 32, fontWeight: '600', letterSpacing: -0.4 },
  heading: { fontSize: 18, lineHeight: 26, fontWeight: '600' },
  body: { fontSize: 16, lineHeight: 24, fontWeight: '400' },
  label: { fontSize: 14, lineHeight: 20, fontWeight: '600' },
  caption: { fontSize: 13, lineHeight: 20, fontWeight: '400' },
  tab: { fontSize: 12, lineHeight: 16, fontWeight: '600' },
} as const satisfies Record<string, TextStyle>;

export const radii = { sm: 8, md: 16, lg: 24, pill: 999 } as const;

export const shadows = {
  card: {
    boxShadow: '0px 8px 24px rgba(47, 41, 51, 0.07)',
  },
} as const satisfies Record<string, ViewStyle>;

export const layout = {
  contentMaxWidth: 640,
  dialogMaxWidth: 420,
  dashboardTileMinWidth: 144,
  minTouchTarget: 48,
  tabBarHeight: 78,
  iconSize: 20,
  featureIconSize: 28,
  iconContainerSize: 56,
} as const;
