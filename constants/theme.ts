import type { TextStyle, ViewStyle } from 'react-native';

export const colors = {
  background: '#FBF7FA',
  scrim: '#2D223066',
  surface: '#FFFFFF',
  surfaceMuted: '#F1EEF5',
  surfaceWarm: '#FFF4F7',
  text: '#2D2230',
  textSecondary: '#665A68',
  accent: '#8A4F70',
  accentPressed: '#6F3B59',
  accentSoft: '#F4E5EC',
  partner: '#735A9B',
  partnerSoft: '#F0EAF7',
  together: '#B75D7A',
  togetherSoft: '#F8E8EF',
  onAccent: '#FFFFFF',
  border: '#E4DDE5',
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
    boxShadow: '0px 8px 24px rgba(45, 34, 48, 0.07)',
  },
} as const satisfies Record<string, ViewStyle>;

export const layout = {
  contentMaxWidth: 640,
  dialogMaxWidth: 420,
  dashboardTileMinWidth: 144,
  minTouchTarget: 48,
  tabBarHeight: 78,
  iconSize: 24,
  featureIconSize: 32,
  iconContainerSize: 64,
} as const;
