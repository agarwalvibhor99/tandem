import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { colors, spacing } from '@/constants/theme';

export function LoadingState({ label }: { label: string }) {
  return <View style={styles.row} accessibilityLiveRegion="polite">
    <ActivityIndicator color={colors.accent} accessibilityLabel={label} />
    <Text variant="caption" tone="secondary">{label}</Text>
  </View>;
}

const styles = StyleSheet.create({ row: { minHeight: spacing.xxxl, flexDirection: 'row', alignItems: 'center', gap: spacing.sm } });
