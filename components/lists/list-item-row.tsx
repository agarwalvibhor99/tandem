import { router } from 'expo-router';
import { Check, Pencil } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { colors, layout, radii, spacing } from '@/constants/theme';
import type { ListItem } from '@/types/list';

export function ListItemRow({ item, completed, busy, onToggle }: { item: ListItem; completed: boolean; busy: boolean; onToggle: () => void }) {
  return <View style={styles.row}>
    <Pressable accessibilityRole="checkbox" aria-checked={completed} aria-busy={busy} accessibilityLabel={`${item.name}, ${completed ? 'completed' : 'remaining'}`} accessibilityState={{ checked: completed, busy }} disabled={busy} onPress={onToggle} style={[styles.checkbox, completed && styles.checked]}>{completed && <Check color={colors.onAccent} size={16} />}</Pressable>
    <View style={styles.copy}><Text style={completed && styles.done}>{item.name}</Text>{(item.quantity || item.category) && <Text variant="caption" tone="secondary">{[item.quantity, item.category].filter(Boolean).join(' · ')}</Text>}{!!item.notes && <Text variant="caption" tone="secondary" numberOfLines={2}>{item.notes}</Text>}</View>
    <Pressable accessibilityRole="button" accessibilityLabel={`Edit ${item.name}`} onPress={() => router.push({ pathname: '/list/[id]/item/[itemId]', params: { id: item.list_id, itemId: item.id } })} style={styles.edit}><Pencil color={colors.textSecondary} size={18} /></Pressable>
  </View>;
}
const styles = StyleSheet.create({ row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 64, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border }, checkbox: { width: layout.minTouchTarget, height: layout.minTouchTarget, borderWidth: 2, borderColor: colors.accent, borderRadius: radii.sm, alignItems: 'center', justifyContent: 'center' }, checked: { backgroundColor: colors.accent }, copy: { flex: 1 }, done: { textDecorationLine: 'line-through', color: colors.textSecondary }, edit: { width: layout.minTouchTarget, height: layout.minTouchTarget, alignItems: 'center', justifyContent: 'center' } });
