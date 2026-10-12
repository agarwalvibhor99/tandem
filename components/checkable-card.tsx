import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Checkbox } from '@/components/ui/checkbox';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Text } from '@/components/ui/text';
import { borders, colors, layout, radii, shadows, spacing } from '@/constants/theme';

type Props = {
  title: string;
  completed: boolean;
  pending: boolean;
  onToggle: () => void;
  onOpen: () => void;
  openLabel: string;
  children: ReactNode;
};

export function CheckableCard({ title, completed, pending, onToggle, onOpen, openLabel, children }: Props) {
  return <View style={styles.card}>
    <Checkbox label={`${completed ? 'Reopen' : 'Complete'} ${title}`} checked={completed} loading={pending} onPress={onToggle} />
    <PressableScale accessibilityRole="button" accessibilityLabel={openLabel} onPress={onOpen} style={styles.content}>
      <Text variant="heading" style={completed ? styles.completed : undefined}>{title}</Text>
      {children}
      {pending && <Text variant="caption" tone="secondary" accessibilityLiveRegion="polite">Saving…</Text>}
    </PressableScale>
  </View>;
}

export function CheckableCardMeta({ children }: { children: ReactNode }) {
  return <View style={styles.meta}>{children}</View>;
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: colors.surface, borderRadius: radii.md, borderWidth: borders.thin, borderColor: colors.border, padding: spacing.sm, ...shadows.soft },
  content: { flex: 1, minHeight: layout.minTouchTarget, paddingVertical: spacing.sm, paddingRight: spacing.sm, gap: spacing.sm },
  meta: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, alignItems: 'center' },
  completed: { textDecorationLine: 'line-through', color: colors.textSecondary },
});
