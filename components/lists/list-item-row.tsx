import { router } from 'expo-router';
import { Pencil } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { Checkbox } from '@/components/ui/checkbox';
import { borders, colors, layout, spacing } from '@/constants/theme';
import type { ListItem } from '@/types/list';

export function ListItemRow({ item, completed, busy, onToggle }: { item: ListItem; completed: boolean; busy: boolean; onToggle: () => void }) {
  return <View style={styles.row}>
    <Checkbox label={`${item.name}, ${completed ? 'completed' : 'remaining'}`} checked={completed} loading={busy} onPress={onToggle} />
    <View style={styles.copy}><Text style={completed && styles.done}>{item.name}</Text>{(item.quantity || item.category) && <Text variant="caption" tone="secondary">{[item.quantity, item.category].filter(Boolean).join(' · ')}</Text>}{!!item.notes && <Text variant="caption" tone="secondary" numberOfLines={2}>{item.notes}</Text>}</View>
    <Pressable accessibilityRole="button" accessibilityLabel={`Edit ${item.name}`} onPress={() => router.push({ pathname: '/list/[id]/item/[itemId]', params: { id: item.list_id, itemId: item.id } })} style={styles.edit}><Pencil color={colors.textSecondary} size={18} /></Pressable>
  </View>;
}
const styles = StyleSheet.create({ row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: layout.listRowHeight, paddingVertical: spacing.sm, borderBottomWidth: borders.thin, borderBottomColor: colors.border }, copy: { flex: 1 }, done: { textDecorationLine: 'line-through', color: colors.textSecondary }, edit: { width: layout.minTouchTarget, height: layout.minTouchTarget, alignItems: 'center', justifyContent: 'center' } });
