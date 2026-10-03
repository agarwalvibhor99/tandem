import { format } from 'date-fns';
import { useState } from 'react';
import { Modal, ScrollView, StyleSheet, View } from 'react-native';
import { Button } from '@/components/ui/button';
import { ChoiceChips } from '@/components/ui/choice-chips';
import { Text } from '@/components/ui/text';
import { colors, layout, radii, spacing } from '@/constants/theme';

export function TimePicker({ label, value, onChange, disabled }: { label: string; value: string; onChange: (value: string) => void; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const date = new Date(value);
  const [hour, setHour] = useState('9');
  const [minute, setMinute] = useState('00');
  const [period, setPeriod] = useState('AM');
  const show = () => { setHour(String(date.getHours() % 12 || 12)); setMinute(String(date.getMinutes()).padStart(2, '0')); setPeriod(date.getHours() < 12 ? 'AM' : 'PM'); setOpen(true); };
  const save = () => { const next = new Date(value); next.setHours((Number(hour) % 12) + (period === 'PM' ? 12 : 0), Number(minute), 0, 0); onChange(next.toISOString()); setOpen(false); };
  return <View style={styles.group}>
    <Text variant="label">{label}</Text><Button variant="secondary" label={format(date, 'h:mm a')} disabled={disabled} onPress={show} />
    <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}><View style={styles.backdrop}><View style={styles.dialog} accessibilityViewIsModal><ScrollView contentContainerStyle={styles.group}>
      <Text variant="title" accessibilityRole="header">{label}</Text>
      <ChoiceChips label="Hour" value={hour} options={Array.from({ length: 12 }, (_, index) => ({ value: String(index + 1), label: String(index + 1) }))} onChange={setHour} />
      <ChoiceChips label="Minutes" value={minute} options={[...new Set(['00', '15', '30', '45', minute])].sort().map((value) => ({ value, label: value }))} onChange={setMinute} />
      <ChoiceChips label="Time of day" value={period} options={[{ value: 'AM', label: 'AM' }, { value: 'PM', label: 'PM' }]} onChange={setPeriod} />
      <Button label="Set time" onPress={save} /><Button label="Cancel" variant="secondary" onPress={() => setOpen(false)} />
    </ScrollView></View></View></Modal>
  </View>;
}
const styles = StyleSheet.create({ group: { gap: spacing.lg }, backdrop: { flex: 1, backgroundColor: colors.scrim, justifyContent: 'center', alignItems: 'center', padding: spacing.lg }, dialog: { backgroundColor: colors.surface, padding: spacing.lg, borderRadius: radii.lg, width: '100%', maxWidth: layout.dialogMaxWidth, maxHeight: '90%' } });
