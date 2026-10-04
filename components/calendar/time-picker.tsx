import { format } from 'date-fns';
import { useState } from 'react';
import { Modal, ScrollView, StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { ChoiceChips } from '@/components/ui/choice-chips';
import { FormField } from '@/components/ui/form-field';
import { Notice } from '@/components/ui/notice';
import { Text } from '@/components/ui/text';
import { colors, layout, radii, spacing } from '@/constants/theme';

const hourOptions = Array.from({ length: 12 }, (_, index) => ({ value: String(index + 1), label: String(index + 1) }));
const minuteOptions = Array.from({ length: 60 }, (_, index) => {
  const value = String(index).padStart(2, '0');
  return { value, label: value };
});
const periodOptions = [{ value: 'AM', label: 'AM' }, { value: 'PM', label: 'PM' }];

function digitsOnly(value: string, maxLength: number) {
  return value.replace(/\D/g, '').slice(0, maxLength);
}

function parseTimePart(value: string) {
  if (!/^\d+$/.test(value)) return null;
  return Number(value);
}

export function TimePicker({ label, value, onChange, disabled }: { label: string; value: string; onChange: (value: string) => void; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const date = new Date(value);
  const [hour, setHour] = useState('9');
  const [minute, setMinute] = useState('00');
  const [period, setPeriod] = useState('AM');
  const [error, setError] = useState<string | null>(null);

  const show = () => {
    setHour(String(date.getHours() % 12 || 12));
    setMinute(String(date.getMinutes()).padStart(2, '0'));
    setPeriod(date.getHours() < 12 ? 'AM' : 'PM');
    setError(null);
    setOpen(true);
  };

  const save = () => {
    const parsedHour = parseTimePart(hour);
    const parsedMinute = parseTimePart(minute);

    if (parsedHour === null || parsedHour < 1 || parsedHour > 12 || parsedMinute === null || parsedMinute < 0 || parsedMinute > 59) {
      setError('Enter a valid time. Use hour 1-12 and minute 0-59.');
      return;
    }

    const next = new Date(value);
    next.setHours((parsedHour % 12) + (period === 'PM' ? 12 : 0), parsedMinute, 0, 0);
    onChange(next.toISOString());
    setOpen(false);
  };

  return <View style={styles.group}>
    <Text variant="label">{label}</Text><Button variant="secondary" label={format(date, 'h:mm a')} disabled={disabled} onPress={show} />
    <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}><View style={styles.backdrop}><View style={styles.dialog} accessibilityViewIsModal><ScrollView contentContainerStyle={styles.content}>
      <Text variant="title" accessibilityRole="header">{label}</Text>
      <View style={styles.timeInputs}>
        <FormField
          label="Hour"
          value={hour}
          keyboardType="number-pad"
          inputMode="numeric"
          maxLength={2}
          onChangeText={(next) => { setError(null); setHour(digitsOnly(next, 2)); }}
          placeholder="9"
        />
        <FormField
          label="Minute"
          value={minute}
          keyboardType="number-pad"
          inputMode="numeric"
          maxLength={2}
          onChangeText={(next) => { setError(null); setMinute(digitsOnly(next, 2)); }}
          placeholder="00"
        />
      </View>
      <ChoiceChips label="Hour" value={hour} options={hourOptions} onChange={(next) => { setError(null); setHour(next); }} scrollable />
      <ChoiceChips label="Minute" value={minute.padStart(2, '0')} options={minuteOptions} onChange={(next) => { setError(null); setMinute(next); }} scrollable />
      <ChoiceChips label="Time of day" value={period} options={periodOptions} onChange={setPeriod} />
      {error && <Notice error message={error} />}
      <Button label="Set time" onPress={save} /><Button label="Cancel" variant="secondary" onPress={() => setOpen(false)} />
    </ScrollView></View></View></Modal>
  </View>;
}
const styles = StyleSheet.create({
  group: { gap: spacing.lg },
  content: { gap: spacing.lg },
  timeInputs: { flexDirection: 'row', gap: spacing.md },
  backdrop: { flex: 1, backgroundColor: colors.scrim, justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  dialog: { backgroundColor: colors.surface, padding: spacing.lg, borderRadius: radii.lg, width: '100%', maxWidth: layout.dialogMaxWidth, maxHeight: '90%' },
});
