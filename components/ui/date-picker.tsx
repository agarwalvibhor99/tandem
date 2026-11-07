import { addDays, addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameDay, isSameMonth, startOfMonth, startOfWeek } from 'date-fns';
import { useState, type ReactNode } from 'react';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Text } from '@/components/ui/text';
import { colors, layout, radii, spacing } from '@/constants/theme';
import { dueDateLabel, dueDateValue } from '@/lib/tasks/dates';

type Props = { value: string | null; onChange: (value: string | null) => void; disabled?: boolean; label?: string; prompt?: string; allowClear?: boolean; renderTrigger?: (open: () => void) => ReactNode };
export function DatePicker({ value, onChange, disabled, label = 'Due date', prompt = 'When is it due?', allowClear = true, renderTrigger }: Props) {
  const [open, setOpen] = useState(false);
  const [nativeDate, setNativeDate] = useState(() => value ? new Date(value) : new Date());
  const [month, setMonth] = useState(() => startOfMonth(value ? new Date(value) : new Date()));
  const days = eachDayOfInterval({ start: startOfWeek(month), end: endOfWeek(endOfMonth(month)) });
  function choose(date: Date | null) { onChange(date ? dueDateValue(date) : null); setOpen(false); }
  const show = () => { if (!disabled) { const next = value ? new Date(value) : new Date(); setNativeDate(next); setMonth(startOfMonth(next)); setOpen(true); } };
  const nativeChange = (event: DateTimePickerEvent, next?: Date) => {
    if (Platform.OS === 'android') setOpen(false);
    if (event.type === 'set' && next) { setNativeDate(next); choose(next); }
  };
  if (Platform.OS !== 'web' && Platform.OS === 'android' && open) return <View style={renderTrigger ? undefined : styles.group}>
    {renderTrigger ? renderTrigger(show) : <><Text variant="label">{label}</Text><Button variant="secondary" label={value ? dueDateLabel(value) : `Choose ${label.toLowerCase()}`} disabled={disabled} onPress={show} /></>}
    <DateTimePicker value={nativeDate} mode="date" display="default" onChange={nativeChange} />
  </View>;
  return <View style={renderTrigger ? undefined : styles.group}>
    {renderTrigger ? renderTrigger(show) : <><Text variant="label">{label}</Text><Button variant="secondary" label={value ? dueDateLabel(value) : `Choose ${label.toLowerCase()}`} disabled={disabled} onPress={show} /></>}
    {Platform.OS !== 'web' ? <Dialog visible={open} title={prompt} onClose={() => setOpen(false)}>
      <DateTimePicker value={nativeDate} mode="date" display="inline" onChange={(_, next) => next && setNativeDate(next)} />
      <View style={styles.actions}><Button label="Set date" onPress={() => choose(nativeDate)} grow /><Button label="Cancel" variant="secondary" onPress={() => setOpen(false)} grow /></View>
    </Dialog> : <Dialog visible={open} title={prompt} onClose={() => setOpen(false)}>
          <ScrollView contentContainerStyle={styles.group}>
            <View style={styles.quick}>
              <Button label="Today" variant="secondary" onPress={() => choose(new Date())} />
              <Button label="Tomorrow" variant="secondary" onPress={() => choose(addDays(new Date(), 1))} />
            </View>
            <View style={styles.month}>
              <Pressable accessibilityRole="button" accessibilityLabel="Previous month" style={styles.arrow} onPress={() => setMonth(addMonths(month, -1))}><ChevronLeft color={colors.text} size={layout.iconSize} /></Pressable>
              <Text variant="heading" accessibilityLiveRegion="polite">{format(month, 'MMMM yyyy')}</Text>
              <Pressable accessibilityRole="button" accessibilityLabel="Next month" style={styles.arrow} onPress={() => setMonth(addMonths(month, 1))}><ChevronRight color={colors.text} size={layout.iconSize} /></Pressable>
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
    </Dialog>}
  </View>;
}
const styles = StyleSheet.create({
  group: { gap: spacing.lg },
  actions: { flexDirection: 'row', gap: spacing.sm },
  quick: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }, month: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  arrow: { minHeight: layout.minTouchTarget, minWidth: layout.minTouchTarget, alignItems: 'center', justifyContent: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' }, day: { width: `${100 / 7}%`, minHeight: layout.minTouchTarget, alignItems: 'center', justifyContent: 'center', borderRadius: radii.sm }, selected: { backgroundColor: colors.accent },
});
