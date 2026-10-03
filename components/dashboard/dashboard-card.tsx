import type { PropsWithChildren } from 'react';
import type { LucideIcon } from 'lucide-react-native';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { Surface } from '@/components/ui/surface';
import { Text } from '@/components/ui/text';
import { colors, layout, spacing } from '@/constants/theme';

type Props = PropsWithChildren<{ title: string; subtitle?: string; icon?: LucideIcon; badge?: string; quiet?: boolean; compact?: boolean; style?: ViewStyle }>;
export function DashboardCard({ title, subtitle, icon: Icon, badge, quiet, compact, style, children }: Props) {
  return <Surface style={[quiet && styles.quiet, compact && styles.compact, style]}>
    <View style={styles.header}>
      <View style={styles.title}>
        {Icon && <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants"><Icon size={layout.iconSize} strokeWidth={1.5} color={colors.accent} /></View>}
        <Text variant={compact ? "label" : "heading"} accessibilityRole="header">{title}</Text>
      </View>
      {badge && <Text variant="caption" tone="secondary">{badge}</Text>}
    </View>
    {subtitle && <Text variant="caption" tone="secondary">{subtitle}</Text>}
    {children}
  </Surface>;
}
const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: spacing.sm },
  title: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexShrink: 1 },
  compact: { padding: spacing.lg, gap: spacing.md },
  quiet: { backgroundColor: colors.surfaceMuted, boxShadow: 'none' },
});
