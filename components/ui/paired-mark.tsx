import { StyleSheet, View } from 'react-native';

import { borders, colors, radii, spacing } from '@/constants/theme';

export function PairedMark() {
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.mark}>
      <View style={[styles.dot, styles.mine]} />
      <View style={[styles.dot, styles.partner]} />
    </View>
  );
}

const styles = StyleSheet.create({
  mark: {
    width: spacing.xl,
    height: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: spacing.lg,
    height: spacing.lg,
    borderRadius: radii.pill,
    borderWidth: borders.focus,
    borderColor: colors.background,
  },
  mine: { backgroundColor: colors.accent },
  partner: { marginLeft: -spacing.sm, backgroundColor: colors.partner },
});
