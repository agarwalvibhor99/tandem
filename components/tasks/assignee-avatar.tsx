import { StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { colors, radii, spacing } from '@/constants/theme';
export function AssigneeAvatar({ name, tone = 'mine' }: { name: string; tone?: 'mine' | 'partner' | 'together' }) {
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
  return <View style={styles.row}>
    <View style={[styles.avatar, styles[tone]]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants"><Text variant="caption" tone={tone === 'mine' ? 'accent' : 'default'}>{initials}</Text></View>
    <Text variant="caption" tone="secondary">{name}</Text>
  </View>;
}
const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.xs, alignItems: 'center', flexShrink: 1 },
  avatar: { width: spacing.xl, height: spacing.xl, borderRadius: radii.pill, justifyContent: 'center', alignItems: 'center' },
  mine: { backgroundColor: colors.accentSoft },
  partner: { backgroundColor: colors.partnerSoft },
  together: { backgroundColor: colors.togetherSoft },
});
