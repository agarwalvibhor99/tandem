import { router } from 'expo-router';
import { Bell, CalendarDays, CheckCircle2, ChevronRight, CircleDollarSign, Coffee, ListChecks } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { Screen } from '@/components/ui/screen';
import { Surface } from '@/components/ui/surface';
import { Text } from '@/components/ui/text';
import { borders, colors, layout, radii, spacing } from '@/constants/theme';

const rows = [
  { title: 'Tasks', description: 'Personal and shared to-dos', icon: CheckCircle2, href: '/tasks' as const },
  { title: 'Lists', description: 'Groceries and everything to get done', icon: ListChecks, href: '/lists' as const },
  { title: 'Money', description: 'Personal and shared spending', icon: CircleDollarSign, href: '/money' as const },
  { title: 'Calendar', description: 'Your time and plans together', icon: CalendarDays, href: '/calendar' as const },
  { title: 'Reminders', description: 'Small nudges at the right time', icon: Bell, href: '/reminders' as const },
  { title: 'Date ideas', description: 'Things to look forward to', icon: Coffee, href: '/dates' as const },
];

export default function EverydayScreen() {
  return <Screen standalone title="Our everyday" description="Everything you manage together, in one place.">
    <Surface variant="panel" style={styles.card}>
      <Text variant="heading">Make life a little easier</Text>
      <Text variant="body" tone="secondary">Jump back into the part of your shared life you want to move forward.</Text>
      <View style={styles.rows}>
        {rows.map(({ title, description, icon: Icon, href }) => <Pressable key={title} accessibilityRole="button" accessibilityLabel={title} onPress={() => router.push(href)} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
          <View style={styles.icon}><Icon color={colors.accent} size={layout.iconSize} strokeWidth={1.75} /></View>
          <View style={styles.copy}><Text variant="heading">{title}</Text><Text variant="caption" tone="secondary">{description}</Text></View>
          <ChevronRight color={colors.textSecondary} size={layout.iconSize} strokeWidth={1.5} />
        </Pressable>)}
      </View>
    </Surface>
  </Screen>;
}

const styles = StyleSheet.create({
  card: { gap: spacing.lg },
  rows: { gap: spacing.xs },
  row: { minHeight: layout.listRowHeight, flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm, borderTopWidth: borders.thin, borderColor: colors.border },
  pressed: { opacity: 0.7 },
  icon: { width: layout.minTouchTarget, height: layout.minTouchTarget, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accentSoft },
  copy: { flex: 1, gap: spacing.xs },
});
