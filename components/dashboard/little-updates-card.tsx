import { router } from 'expo-router';
import { Plus, ChevronRight } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { QuickActions } from '@/components/dashboard/quick-actions';
import { Button } from '@/components/ui/button';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Surface } from '@/components/ui/surface';
import { Text } from '@/components/ui/text';
import { borders, colors, layout, radii, spacing } from '@/constants/theme';
import type { PartnerNudgeType } from '@/types/nudge';

export type LittleUpdate = {
  id: string;
  glyph: string;
  title: string;
  detail: string;
  href?: '/tasks' | '/lists' | '/money' | '/calendar' | '/reminders';
};

export function LittleUpdatesCard({ updates, onAdd }: { updates: LittleUpdate[]; onAdd: () => void }) {
  return <Surface variant="panel" style={styles.card}>
    <View style={styles.header}>
      <Text variant="heading" accessibilityRole="header">Little updates</Text>
      <Button label="Add" variant="quiet" size="compact" accessibilityLabel="Add an update" onPress={onAdd} style={styles.addButton} />
    </View>
    {updates.length === 0 ? <View style={styles.empty}>
      <Text variant="body" tone="secondary">Small moments from your shared life will show up here.</Text>
      <Button label="Add something" variant="secondary" size="compact" onPress={onAdd} />
    </View> : updates.map((update) => <PressableScale key={update.id} accessibilityRole="button" accessibilityLabel={`${update.title}. ${update.detail}`} onPress={() => update.href && router.push(update.href)} style={styles.row}>
      <View style={styles.glyph}><Text variant="glyph">{update.glyph}</Text></View>
      <View style={styles.copy}><Text variant="label">{update.title}</Text><Text variant="caption" tone="secondary">{update.detail}</Text></View>
      {update.href && <ChevronRight color={colors.textSecondary} size={layout.iconSize} strokeWidth={1.5} />}
    </PressableScale>)}
  </Surface>;
}

export function LittleUpdatesActions({ onClose, onSendNudge, onPreviewNudge, canSendNudge = true }: { onClose: () => void; onSendNudge: (type: PartnerNudgeType) => void; onPreviewNudge?: (type: PartnerNudgeType) => void; canSendNudge?: boolean }) {
  const nudges: { type: PartnerNudgeType; glyph: string; label: string; detail: string }[] = [
    { type: 'rose', glyph: '🌹', label: 'Send a rose', detail: 'A little love' },
    { type: 'heart', glyph: '❤️', label: 'Send a heart', detail: 'Thinking of you' },
    { type: 'coffee', glyph: '☕', label: 'Coffee cheers', detail: 'Warm hello' },
    { type: 'beer', glyph: '🍺', label: 'Beer cheers', detail: 'Cheers!!' },
  ];
  return <Surface variant="panel" style={styles.actionsCard}>
    <View style={styles.actionsHeader}><View style={styles.actionsTitle}><View style={styles.addIcon}><Plus color={colors.accent} size={layout.iconSize} /></View><View><Text variant="title">Add to your day</Text><Text variant="caption" tone="secondary">Choose what you want to capture.</Text></View></View><Button label="Done" variant="quiet" size="compact" onPress={onClose} /></View>
    {canSendNudge && <View style={styles.nudgeSection}><Text variant="caption" tone="secondary">Send something small</Text><View style={styles.nudgeRow}>{nudges.map((nudge) => <PressableScale key={nudge.type} accessibilityRole="button" accessibilityLabel={nudge.label} onPress={() => onSendNudge(nudge.type)} style={styles.nudge}><Text style={styles.nudgeGlyph}>{nudge.glyph}</Text><View style={styles.nudgeCopy}><Text variant="caption">{nudge.label}</Text><Text variant="micro" tone="secondary">{nudge.detail}</Text></View></PressableScale>)}</View></View>}
    {__DEV__ && onPreviewNudge && <View style={styles.nudgeSection}><Text variant="caption" tone="secondary">Preview on this device · only you can see this</Text><View style={styles.nudgeRow}>{nudges.map((nudge) => <PressableScale key={nudge.type} accessibilityRole="button" accessibilityLabel={`Preview ${nudge.type} animation`} onPress={() => onPreviewNudge(nudge.type)} style={styles.preview}><Text style={styles.nudgeGlyph}>{nudge.glyph}</Text><Text variant="micro">Preview</Text></PressableScale>)}</View></View>}
    <QuickActions hideTitle onAction={onClose} />
  </Surface>;
}

const styles = StyleSheet.create({
  card: { gap: spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  addButton: { minHeight: layout.minTouchTarget, paddingHorizontal: spacing.sm },
  row: { minHeight: layout.listRowHeight, flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm, borderTopWidth: borders.thin, borderColor: colors.border },
  glyph: { width: layout.iconContainerSize, height: layout.iconContainerSize, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accentSoft },
  copy: { flex: 1, gap: spacing.xs },
  empty: { gap: spacing.md, paddingVertical: spacing.sm },
  actionsCard: { gap: spacing.lg },
  actionsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  actionsTitle: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  addIcon: { width: layout.iconContainerSize, height: layout.iconContainerSize, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accentSoft },
  nudgeSection: { gap: spacing.sm },
  nudgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  nudge: { flexGrow: 1, flexBasis: '46%', minHeight: layout.listRowHeight, padding: spacing.sm, borderRadius: radii.md, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center', gap: spacing.xs },
  nudgeGlyph: { fontSize: layout.emojiSize, lineHeight: layout.emojiLineHeight },
  nudgeCopy: { alignItems: 'center', gap: spacing.xs },
  preview: { flexGrow: 1, flexBasis: '46%', minHeight: layout.minTouchTarget, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, borderRadius: radii.md, backgroundColor: colors.surfaceMuted },
});
