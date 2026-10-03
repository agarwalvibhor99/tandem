import { Bell, CalendarPlus, ListPlus, Plus, Wallet, type LucideIcon } from 'lucide-react-native';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { colors, layout, radii, spacing } from '@/constants/theme';

type Action = { label: string; icon: LucideIcon; href?: '/task/new' | '/lists' | '/event/new' };
const actions: Action[] = [
  { label: 'Add Task', icon: Plus, href: '/task/new' },
  { label: 'Add Event', icon: CalendarPlus, href: '/event/new' },
  { label: 'Add Expense', icon: Wallet },
  { label: 'Add Grocery', icon: ListPlus, href: '/lists' },
  { label: 'Add Reminder', icon: Bell },
];
export function QuickActions() {
  return <View style={styles.section}>
    <Text variant="label" accessibilityRole="header">Quick actions</Text>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.actions} accessibilityLabel="Quick actions">
      {actions.map(({ label, icon: Icon, href }) => {
        const available = !!href;
        return <Pressable key={label} accessibilityRole="button" accessibilityLabel={available ? label : `${label}, coming soon`} accessibilityState={{ disabled: !available }} disabled={!available} onPress={href ? () => router.push(href) : undefined} style={({ pressed }) => [styles.action, available ? styles.available : styles.unavailable, pressed && styles.pressed]}>
          <Icon size={layout.iconSize} strokeWidth={1.5} color={available ? colors.onAccent : colors.textSecondary} />
          <Text variant="label" tone={available ? 'inverse' : 'secondary'}>{label}</Text>
          {!available && <Text variant="caption" tone="secondary">Soon</Text>}
        </Pressable>;
      })}
    </ScrollView>
  </View>;
}
const styles = StyleSheet.create({
  section: { gap: spacing.md }, actions: { gap: spacing.sm },
  action: { alignItems: 'flex-start', justifyContent: 'center', gap: spacing.xs, minWidth: layout.minTouchTarget * 2, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, minHeight: layout.minTouchTarget, borderRadius: radii.md },
  available: { backgroundColor: colors.accent }, unavailable: { backgroundColor: colors.surfaceMuted }, pressed: { backgroundColor: colors.accentPressed },
});
