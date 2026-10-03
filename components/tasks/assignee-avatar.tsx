import { StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { colors, radii, spacing } from '@/constants/theme';
export function AssigneeAvatar({ name }: { name: string }) {
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
  return <View style={styles.row}>
    <View style={styles.avatar} accessibilityElementsHidden importantForAccessibility="no-hide-descendants"><Text variant="caption" tone="accent">{initials}</Text></View>
    <Text variant="caption" tone="secondary">{name}</Text>
  </View>;
}
const styles = StyleSheet.create({ row: { flexDirection: 'row', gap: spacing.xs, alignItems: 'center', flexShrink: 1 }, avatar: { width: spacing.xl, height: spacing.xl, borderRadius: radii.pill, backgroundColor: colors.accentSoft, justifyContent: 'center', alignItems: 'center' } });
