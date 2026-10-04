import type { PropsWithChildren, ReactNode } from 'react';
import { Pressable, StyleSheet, View, type PressableProps } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { ChevronRight } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { colors, layout, radii, spacing } from '@/constants/theme';

export function GroupedPanel({ children }: PropsWithChildren) { return <View style={styles.panel}>{children}</View>; }
export function GroupDivider() { return <View style={styles.divider} />; }
export function GroupRow({ icon: Icon, title, value, trailing, ...props }: PressableProps & { icon: LucideIcon; title: string; value?: string; trailing?: ReactNode }) {
  return <Pressable accessibilityRole="button" style={styles.row} {...props}>
    <View style={styles.rowIcon}><Icon color={colors.accent} size={layout.iconSize} /></View>
    <Text variant="heading" style={styles.rowLabel}>{title}</Text>
    {value ? <Text tone="secondary">{value}</Text> : null}
    {trailing ?? <ChevronRight color={colors.muted} size={layout.iconSize} />}
  </Pressable>;
}

const styles = StyleSheet.create({
  panel: { borderWidth: 1.5, borderColor: colors.line, backgroundColor: colors.surface, borderRadius: radii.lg, overflow: 'hidden' },
  row: { minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg },
  rowIcon: { width: layout.minTouchTarget, height: layout.minTouchTarget, borderRadius: radii.md, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { flex: 1 },
  divider: { height: 1.5, backgroundColor: colors.line, marginLeft: spacing.lg + layout.minTouchTarget + spacing.md },
});
