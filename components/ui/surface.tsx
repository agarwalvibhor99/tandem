import { StyleSheet, View, type ViewProps } from 'react-native';

import { colors, radii, shadows, spacing } from '@/constants/theme';

export function Surface({ style, ...props }: ViewProps) {
  return <View {...props} style={[styles.surface, style]} />;
}

const styles = StyleSheet.create({
  surface: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1.5,
    borderRadius: radii.lg,
    padding: spacing.lg,
    gap: spacing.md,
    ...shadows.card,
  },
});
