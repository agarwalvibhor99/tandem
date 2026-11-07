import { format } from 'date-fns';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Text } from '@/components/ui/text';
import { colors, radii, spacing } from '@/constants/theme';

type TimePickerProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  autoOpen?: boolean;
  hideTrigger?: boolean;
  onDismiss?: () => void;
  renderTrigger?: (open: () => void) => ReactNode;
};

const wheelHours = Array.from({ length: 12 }, (_, index) => index + 1);
const wheelMinutes = Array.from({ length: 60 }, (_, index) => index);
const wheelPeriods = ['AM', 'PM'] as const;
const WHEEL_ROW_HEIGHT = 48;

type WheelColumnProps = {
  items: readonly string[];
  selectedIndex: number;
  onChange: (index: number) => void;
};

function WheelColumn({ items, selectedIndex, onChange }: WheelColumnProps) {
  const scrollRef = useRef<ScrollView>(null);
  const clamp = (index: number) => Math.max(0, Math.min(items.length - 1, index));

  useEffect(() => {
    const timeout = setTimeout(() => scrollRef.current?.scrollTo({ y: selectedIndex * WHEEL_ROW_HEIGHT, animated: false }), 80);
    return () => clearTimeout(timeout);
  }, [selectedIndex]);

  return <ScrollView
    ref={scrollRef}
    style={styles.wheelColumn}
    contentContainerStyle={styles.wheelContent}
    showsVerticalScrollIndicator={false}
    snapToInterval={WHEEL_ROW_HEIGHT}
    decelerationRate="fast"
    scrollEventThrottle={16}
    onScroll={(event) => onChange(clamp(Math.round(event.nativeEvent.contentOffset.y / WHEEL_ROW_HEIGHT)))}
  >
    {items.map((item, index) => <PressableScale
      key={item}
      accessibilityRole="button"
      accessibilityState={{ selected: index === selectedIndex }}
      onPress={() => {
        onChange(index);
        scrollRef.current?.scrollTo({ y: index * WHEEL_ROW_HEIGHT, animated: true });
      }}
      style={styles.wheelItem}
    >
      <Text variant={index === selectedIndex ? 'label' : 'body'} tone={index === selectedIndex ? 'default' : 'secondary'}>{item}</Text>
    </PressableScale>)}
  </ScrollView>;
}

export function TimePicker({ label, value, onChange, disabled, autoOpen = false, hideTrigger = false, onDismiss, renderTrigger }: TimePickerProps) {
  const [open, setOpen] = useState(false);
  const [draftDate, setDraftDate] = useState(() => new Date(value));
  const openedAutomatically = useRef(false);
  const date = useMemo(() => new Date(value), [value]);
  const close = () => { setOpen(false); onDismiss?.(); };
  const show = useCallback(() => {
    setDraftDate(new Date(value));
    setOpen(true);
  }, [value]);

  useEffect(() => {
    if (autoOpen && !openedAutomatically.current && !disabled) {
      openedAutomatically.current = true;
      show();
    }
  }, [autoOpen, disabled, show]);

  const nativeChange = (event: DateTimePickerEvent, next?: Date) => {
    if (Platform.OS === 'android') setOpen(false);
    if (event.type === 'set' && next) { setDraftDate(next); onChange(next.toISOString()); onDismiss?.(); }
  };
  const save = () => { onChange(draftDate.toISOString()); close(); };
  const draftHour = draftDate.getHours();
  const draftHourIndex = (draftHour % 12 || 12) - 1;
  const draftMinuteIndex = draftDate.getMinutes();
  const draftPeriodIndex = draftHour >= 12 ? 1 : 0;
  const updateWheelTime = (kind: 'hour' | 'minute' | 'period', index: number) => {
    const nextDate = new Date(draftDate);
    const hour = kind === 'hour' ? (wheelHours[index] ?? 12) : (draftHour % 12 || 12);
    const minute = kind === 'minute' ? (wheelMinutes[index] ?? 0) : draftDate.getMinutes();
    const period = kind === 'period' ? index : draftPeriodIndex;
    nextDate.setHours((hour % 12) + (period === 1 ? 12 : 0), minute, 0, 0);
    setDraftDate(nextDate);
  };
  const trigger = renderTrigger ? renderTrigger(show) : <><Text variant="label">{label}</Text><Button variant="secondary" label={format(date, 'h:mm a')} disabled={disabled} onPress={show} /></>;

  if (Platform.OS !== 'web' && Platform.OS === 'android' && open) return <View style={hideTrigger ? styles.hiddenGroup : styles.group}>{!hideTrigger && trigger}<DateTimePicker value={draftDate} mode="time" display="default" onChange={nativeChange} /></View>;

  return <View style={hideTrigger ? styles.hiddenGroup : styles.group}>
    {!hideTrigger && trigger}
    {Platform.OS !== 'web' ? <Dialog visible={open} title={label} onClose={close}>
      <DateTimePicker value={draftDate} mode="time" display="spinner" onChange={(_, next) => next && setDraftDate(next)} />
      <View style={styles.actions}><Button label="Set time" onPress={save} grow /><Button label="Cancel" variant="secondary" onPress={close} grow /></View>
    </Dialog> : <Dialog visible={open} title={label} onClose={close}>
      <View style={styles.timeHero}><Text variant="title">{format(draftDate, 'h:mm a')}</Text><Text variant="caption" tone="secondary">Scroll to choose a time.</Text></View>
      <View style={styles.wheelFrame}>
        <View pointerEvents="none" style={styles.wheelSelection} />
        <View style={styles.wheels}>
          <WheelColumn items={wheelHours.map(String)} selectedIndex={draftHourIndex} onChange={(index) => updateWheelTime('hour', index)} />
          <WheelColumn items={wheelMinutes.map((minute) => String(minute).padStart(2, '0'))} selectedIndex={draftMinuteIndex} onChange={(index) => updateWheelTime('minute', index)} />
          <WheelColumn items={wheelPeriods} selectedIndex={draftPeriodIndex} onChange={(index) => updateWheelTime('period', index)} />
        </View>
      </View>
      <View style={styles.actions}><Button label="Set time" onPress={save} grow /><Button label="Cancel" variant="secondary" onPress={close} grow /></View>
    </Dialog>}
  </View>;
}

const styles = StyleSheet.create({
  group: { gap: spacing.lg },
  hiddenGroup: { height: 0, overflow: 'hidden' },
  timeHero: { alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.sm },
  wheelFrame: { position: 'relative', height: WHEEL_ROW_HEIGHT * 5, overflow: 'hidden', borderRadius: radii.lg, backgroundColor: colors.surfaceMuted },
  wheels: { flexDirection: 'row', flex: 1, zIndex: 1 },
  wheelColumn: { flex: 1 },
  wheelContent: { paddingVertical: WHEEL_ROW_HEIGHT * 2 },
  wheelItem: { height: WHEEL_ROW_HEIGHT, alignItems: 'center', justifyContent: 'center' },
  wheelSelection: { position: 'absolute', zIndex: 0, left: spacing.xs, right: spacing.xs, top: WHEEL_ROW_HEIGHT * 2, height: WHEEL_ROW_HEIGHT, borderRadius: radii.pill, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  actions: { flexDirection: 'row', gap: spacing.sm },
});
