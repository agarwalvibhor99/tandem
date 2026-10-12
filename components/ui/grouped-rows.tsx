import type { PropsWithChildren, ReactNode } from 'react';
import { StyleSheet, View, type PressableProps } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { ChevronRight } from 'lucide-react-native';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Text } from '@/components/ui/text';
import { borders, colors, layout, radii, shadows, spacing } from '@/constants/theme';

export function GroupedPanel({ children }: PropsWithChildren) { return <View style={styles.panel}>{children}</View>; }
export function GroupDivider() { return <View style={styles.divider} />; }
export function GroupRow({ icon: Icon, title, value, trailing, ...props }: Omit<PressableProps, 'style'> & { icon: LucideIcon; title: string; value?: string; trailing?: ReactNode }) {
  return <PressableScale accessibilityRole="button" style={styles.row} {...props}>
    <View style={styles.rowIcon}><Icon color={colors.accent} size={layout.iconSize} /></View>
    <Text variant="heading" style={styles.rowLabel}>{title}</Text>
    {value ? <Text tone="secondary">{value}</Text> : null}
    {trailing ?? <ChevronRight color={colors.muted} size={layout.iconSize} />}
  </PressableScale>;
}

const styles = StyleSheet.create({
  panel: { borderWidth: borders.thin, borderColor: colors.line, backgroundColor: colors.surface, borderRadius: radii.lg, overflow: 'hidden', ...shadows.soft },
  row: { minHeight: layout.groupedRowHeight, flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg },
  rowIcon: { width: 40, height: 40, borderRadius: radii.md, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { flex: 1 },
  divider: { height: borders.thin, backgroundColor: colors.line, marginLeft: spacing.lg + 40 + spacing.md },
});
