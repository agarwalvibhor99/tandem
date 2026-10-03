import { addDays, addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameDay, isSameMonth, startOfMonth, startOfWeek } from 'date-fns';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { colors, layout, radii, spacing } from '@/constants/theme';
import { dueDateLabel, dueDateValue } from '@/lib/tasks/dates';

type Props = { value: string | null; onChange: (value: string | null) => void; disabled?: boolean; label?: string; prompt?: string; allowClear?: boolean };
export function DatePicker({ value, onChange, disabled, label = 'Due date', prompt = 'When is it due?', allowClear = true }: Props) {
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(() => startOfMonth(value ? new Date(value) : new Date()));
  const days = eachDayOfInterval({ start: startOfWeek(month), end: endOfWeek(endOfMonth(month)) });
  function choose(date: Date | null) { onChange(date ? dueDateValue(date) : null); setOpen(false); }
  return <View style={styles.group}>
    <Text variant="label">{label}</Text>
    <Button variant="secondary" label={value ? dueDateLabel(value) : `Choose ${label.toLowerCase()}`} disabled={disabled} onPress={() => { setMonth(startOfMonth(value ? new Date(value) : new Date())); setOpen(true); }} />
    <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
      <View style={styles.backdrop}>
        <View style={styles.dialog} accessibilityViewIsModal>
          <ScrollView contentContainerStyle={styles.group}>
            <Text variant="title" accessibilityRole="header">{prompt}</Text>
            <View style={styles.quick}>
              <Button label="Today" variant="secondary" onPress={() => choose(new Date())} />
              <Button label="Tomorrow" variant="secondary" onPress={() => choose(addDays(new Date(), 1))} />
            </View>
            <View style={styles.month}>
              <Pressable accessibilityRole="button" accessibilityLabel="Previous month" style={styles.arrow} onPress={() => setMonth(addMonths(month, -1))}><Text variant="title">‹</Text></Pressable>
              <Text variant="heading" accessibilityLiveRegion="polite">{format(month, 'MMMM yyyy')}</Text>
              <Pressable accessibilityRole="button" accessibilityLabel="Next month" style={styles.arrow} onPress={() => setMonth(addMonths(month, 1))}><Text variant="title">›</Text></Pressable>
            </View>
            <View style={styles.grid}>
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => <View key={day} style={styles.day}><Text variant="caption" tone="secondary">{day}</Text></View>)}
              {days.map((day) => {
                const selected = !!value && isSameDay(day, new Date(value));
                return <Pressable key={day.toISOString()} accessibilityRole="button" accessibilityLabel={format(day, 'EEEE, MMMM d, yyyy')} accessibilityState={{ selected }} onPress={() => choose(day)} style={[styles.day, selected && styles.selected]}>
                  <Text tone={selected ? 'inverse' : isSameMonth(day, month) ? 'default' : 'secondary'}>{format(day, 'd')}</Text>
                </Pressable>;
              })}
            </View>
            {allowClear && <Button label="No due date" variant="secondary" onPress={() => choose(null)} />}
            <Button label="Cancel" variant="secondary" onPress={() => setOpen(false)} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  </View>;
}
const styles = StyleSheet.create({
  group: { gap: spacing.lg }, backdrop: { flex: 1, backgroundColor: colors.scrim, justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  dialog: { backgroundColor: colors.surface, padding: spacing.lg, borderRadius: radii.lg, width: '100%', maxWidth: layout.dialogMaxWidth, maxHeight: '90%' },
  quick: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }, month: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  arrow: { minHeight: layout.minTouchTarget, minWidth: layout.minTouchTarget, alignItems: 'center', justifyContent: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' }, day: { width: `${100 / 7}%`, minHeight: layout.minTouchTarget, alignItems: 'center', justifyContent: 'center', borderRadius: radii.sm }, selected: { backgroundColor: colors.accent },
});
