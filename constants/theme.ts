import type { TextStyle, ViewStyle } from 'react-native';

export const colors = {
  background: '#F7F8F4',
  scrim: '#20372E66',
  surface: '#FFFFFF',
  surfaceMuted: '#EDF1E9',
  text: '#20372E',
  textSecondary: '#53645B',
  accent: '#28624D',
  accentPressed: '#1C4938',
  accentSoft: '#E3EEE5',
  onAccent: '#FFFFFF',
  border: '#DCE3D8',
  error: '#AC3434',
  success: '#28624D',
  warning: '#855918',
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
    boxShadow: '0px 2px 10px rgba(32, 55, 46, 0.05)',
  },
} as const satisfies Record<string, ViewStyle>;

export const layout = {
  contentMaxWidth: 640,
  dialogMaxWidth: 420,
  dashboardTileMinWidth: 144,
  minTouchTarget: 48,
  tabBarHeight: 64,
  iconSize: 24,
  featureIconSize: 32,
  iconContainerSize: 64,
} as const;
