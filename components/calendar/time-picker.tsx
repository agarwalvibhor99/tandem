import { format } from 'date-fns';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { FormField } from '@/components/ui/form-field';
import { Notice } from '@/components/ui/notice';
import { Text } from '@/components/ui/text';
import { borders, colors, layout, radii, spacing } from '@/constants/theme';

const hourOptions = Array.from({ length: 12 }, (_, index) => String(index + 1));
const minuteOptions = Array.from({ length: 12 }, (_, index) => String(index * 5).padStart(2, '0'));
const periodOptions = ['AM', 'PM'];

type TimePickerProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  autoOpen?: boolean;
  hideTrigger?: boolean;
  onDismiss?: () => void;
};

function digitsOnly(value: string, maxLength: number) {
  return value.replace(/\D/g, '').slice(0, maxLength);
}

function parseTimePart(value: string) {
  if (!/^\d+$/.test(value)) return null;
  return Number(value);
}

function PickerColumn({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return <View style={styles.column}>
    <Text variant="caption" tone="secondary" style={styles.columnLabel}>{label}</Text>
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.columnContent} accessibilityLabel={label}>
      {options.map((option) => {
        const selected = option === value;
        return <Pressable key={option} accessibilityRole="button" accessibilityState={{ selected }} onPress={() => onChange(option)} style={[styles.option, selected && styles.selectedOption]}>
          <Text variant={selected ? 'heading' : 'body'} tone={selected ? 'accent' : 'secondary'}>{option}</Text>
        </Pressable>;
      })}
    </ScrollView>
  </View>;
}

export function TimePicker({ label, value, onChange, disabled, autoOpen = false, hideTrigger = false, onDismiss }: TimePickerProps) {
  const [open, setOpen] = useState(false);
  const openedAutomatically = useRef(false);
  const date = useMemo(() => new Date(value), [value]);
  const [hour, setHour] = useState('9');
  const [minute, setMinute] = useState('00');
  const [period, setPeriod] = useState('AM');
  const [exactMinute, setExactMinute] = useState('00');
  const [error, setError] = useState<string | null>(null);

  const show = useCallback(() => {
    const nextHour = String(date.getHours() % 12 || 12);
    const nextMinute = String(date.getMinutes()).padStart(2, '0');
    setHour(nextHour);
    setMinute(minuteOptions.includes(nextMinute) ? nextMinute : '00');
    setExactMinute(nextMinute);
    setPeriod(date.getHours() < 12 ? 'AM' : 'PM');
    setError(null);
    setOpen(true);
  }, [date]);
  const close = () => { setOpen(false); onDismiss?.(); };

  useEffect(() => {
    if (autoOpen && !openedAutomatically.current && !disabled) {
      openedAutomatically.current = true;
      show();
    }
  }, [autoOpen, disabled, show]);

  const save = () => {
    const parsedHour = parseTimePart(hour);
    const parsedMinute = parseTimePart(exactMinute || minute);

    if (parsedHour === null || parsedHour < 1 || parsedHour > 12 || parsedMinute === null || parsedMinute < 0 || parsedMinute > 59) {
      setError('Enter a valid time. Use hour 1-12 and minute 0-59.');
      return;
    }

    const next = new Date(value);
    next.setHours((parsedHour % 12) + (period === 'PM' ? 12 : 0), parsedMinute, 0, 0);
    onChange(next.toISOString());
    close();
  };

  return <View style={hideTrigger ? styles.hiddenGroup : styles.group}>
    {!hideTrigger && <><Text variant="label">{label}</Text><Button variant="secondary" label={format(date, 'h:mm a')} disabled={disabled} onPress={show} /></>}
    <Dialog visible={open} title={label} onClose={close}>
      <Text tone="secondary">Scroll to choose a common time, or type an exact minute.</Text>
      <View style={styles.pickerFrame}>
        <PickerColumn label="Hour" value={hour} options={hourOptions} onChange={setHour} />
        <PickerColumn label="Minute" value={minute} options={minuteOptions} onChange={(next) => { setMinute(next); setExactMinute(next); }} />
        <PickerColumn label="" value={period} options={periodOptions} onChange={setPeriod} />
      </View>
      <FormField
        label="Exact minute"
        value={exactMinute}
        keyboardType="number-pad"
        inputMode="numeric"
        maxLength={2}
        onChangeText={(next) => { setError(null); setExactMinute(digitsOnly(next, 2)); }}
        placeholder="00"
      />
      {error && <Notice error message={error} />}
      <Button label="Set time" onPress={save} /><Button label="Cancel" variant="secondary" onPress={close} />
    </Dialog>
  </View>;
}
const styles = StyleSheet.create({
  group: { gap: spacing.lg },
  hiddenGroup: { height: 0, overflow: 'hidden' },
  pickerFrame: { height: layout.pickerHeight, flexDirection: 'row', gap: spacing.sm, borderRadius: radii.lg, backgroundColor: colors.chip, padding: spacing.sm },
  column: { flex: 1, gap: spacing.xs },
  columnLabel: { textAlign: 'center' },
  columnContent: { paddingVertical: spacing.xl, gap: spacing.xs },
  option: { minHeight: layout.minTouchTarget, alignItems: 'center', justifyContent: 'center', borderRadius: radii.md },
  selectedOption: { backgroundColor: colors.accentSoft, borderWidth: borders.strong, borderColor: colors.accent },
});
