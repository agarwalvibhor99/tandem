import { Bell, CalendarPlus, Coffee, ListPlus, Plus, Wallet, type LucideIcon } from 'lucide-react-native';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { colors, layout, radii, spacing } from '@/constants/theme';

type Action = { label: string; icon: LucideIcon; href: '/task/new' | '/lists' | '/event/new' | '/expense/new' | '/reminder/new' | '/date/new' };
const actions: Action[] = [
  { label: 'New task', icon: Plus, href: '/task/new' },
  { label: 'Plan time', icon: CalendarPlus, href: '/event/new' },
  { label: 'Log spend', icon: Wallet, href: '/expense/new' },
  { label: 'Groceries', icon: ListPlus, href: '/lists' },
  { label: 'Reminder', icon: Bell, href: '/reminder/new' },
  { label: 'Date idea', icon: Coffee, href: '/date/new' },
];
export function QuickActions() {
  return <View style={styles.section}>
    <Text variant="label" accessibilityRole="header">Quick actions</Text>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.actions} accessibilityLabel="Quick actions">
      {actions.map(({ label, icon: Icon, href }) => {
        return <Pressable key={label} accessibilityRole="button" accessibilityLabel={label} onPress={() => router.push(href)} style={({ pressed }) => [styles.action, pressed && styles.pressed]}>
          <Icon size={layout.iconSize} strokeWidth={1.5} color={colors.accent} />
          <Text variant="label">{label}</Text>
        </Pressable>;
      })}
    </ScrollView>
  </View>;
}
const styles = StyleSheet.create({
  section: { gap: spacing.md }, actions: { gap: spacing.sm },
  action: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, minHeight: layout.minTouchTarget, borderRadius: radii.pill, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  pressed: { backgroundColor: colors.togetherSoft },
});
