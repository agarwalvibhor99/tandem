import { StyleSheet, View, type ViewProps } from 'react-native';

import { borders, colors, radii, shadows, spacing } from '@/constants/theme';

type Props = ViewProps & {
  variant?: 'card' | 'panel' | 'inset' | 'bare';
};

export function Surface({ style, variant = 'card', ...props }: Props) {
  return <View {...props} style={[styles.surface, styles[variant], style]} />;
}

const styles = StyleSheet.create({
  surface: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  card: { borderColor: colors.border, borderWidth: borders.thin, ...shadows.soft },
  panel: { borderColor: colors.border, borderWidth: borders.thin, ...shadows.card },
  inset: { backgroundColor: colors.surfaceMuted, borderColor: colors.border, borderWidth: borders.thin },
  bare: { backgroundColor: 'transparent', borderWidth: 0, padding: 0, boxShadow: 'none' },
});
