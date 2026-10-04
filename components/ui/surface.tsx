import { useEffect, useState } from 'react';
import { Animated, StyleSheet, type ViewProps } from 'react-native';

import { colors, radii, shadows, spacing } from '@/constants/theme';

export function Surface({ style, ...props }: ViewProps) {
  const [opacity] = useState(() => new Animated.Value(0));
  const [translateY] = useState(() => new Animated.Value(6));

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start();
  }, [opacity, translateY]);

  return <Animated.View {...props} style={[styles.surface, { opacity, transform: [{ translateY }] }, style]} />;
}

const styles = StyleSheet.create({
  surface: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: spacing.lg,
    gap: spacing.md,
    ...shadows.card,
  },
});
