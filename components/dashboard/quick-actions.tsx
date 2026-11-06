import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Text } from '@/components/ui/text';
import { borders, colors, radii, reference, spacing } from '@/constants/theme';

const actions = [
  { label: 'Add a grocery item', detail: 'Milk, eggs, anything', glyph: '🛒', href: '/lists' },
  { label: 'Create a to-do', detail: 'Something to remember', glyph: '☑', href: '/task/new' },
  { label: 'Log an expense', detail: 'Track personal or shared spending', glyph: '↗', href: '/expense/new' },
  { label: 'Make a plan', detail: 'Something to look forward to', glyph: '♡', href: '/event/new' },
] as const;
export function QuickActions({ onAction, hideTitle = false }: { onAction?: () => void; hideTitle?: boolean }) {
  return <View style={styles.section}>
    {!hideTitle && <Text variant="heading">What’s on your mind?</Text>}
    {actions.map(action => <PressableScale key={action.label} accessibilityRole="button" accessibilityLabel={action.label} onPress={() => { onAction?.(); router.push(action.href); }} style={styles.choice}>
      <View style={styles.icon}><Text variant="glyph">{action.glyph}</Text></View>
      <View style={styles.copy}><Text variant="label">{action.label}</Text><Text variant="caption" tone="secondary">{action.detail}</Text></View>
    </PressableScale>)}
  </View>;
}
const styles = StyleSheet.create({
  section: { gap: spacing.sm },
  choice: { flexDirection: 'row', alignItems: 'center', gap: reference.headerBottom, padding: reference.choicePadding, borderWidth: borders.strong, borderColor: colors.line, borderRadius: reference.choiceRadius, backgroundColor: colors.surface },
  icon: { width: reference.choiceIcon, height: reference.choiceIcon, borderRadius: radii.md, backgroundColor: colors.chip, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, gap: spacing.xs },
});
