import type { PropsWithChildren } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { X } from 'lucide-react-native';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Reveal } from '@/components/ui/motion';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { colors, layout, radii, reference, spacing } from '@/constants/theme';

type Props = PropsWithChildren<{
  visible: boolean;
  title: string;
  eyebrow?: string;
  onClose: () => void;
  variant?: 'dialog' | 'sheet';
}>;

export function Dialog({ visible, title, onClose, children, variant = 'dialog', eyebrow }: Props) {
  const reducedMotion = useReducedMotion();
  return <Modal visible={visible} transparent animationType={reducedMotion ? "none" : "fade"} onRequestClose={onClose}>
    <View style={[styles.backdrop, variant === 'sheet' && styles.sheetBackdrop]}>
      <Pressable accessibilityRole="button" accessibilityLabel="Close dialog" onPress={onClose} style={StyleSheet.absoluteFill} />
      <Reveal style={[styles.panel, variant === 'sheet' && styles.sheetPanel]}>
        <View accessibilityViewIsModal>
        {eyebrow && <Text variant="eyebrow" tone="secondary">{eyebrow}</Text>}
        <View style={styles.header}><Text variant="title" accessibilityRole="header">{title}</Text>{variant !== 'sheet' && <PressableScale accessibilityRole="button" accessibilityLabel="Close" onPress={onClose} style={styles.close}><X color={colors.muted} size={layout.iconSize} /></PressableScale>}</View>
        </View>
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.children}>{children}</ScrollView>
        {variant === 'sheet' && <View style={styles.footer}><Button label="Close" variant="quiet" onPress={onClose} /></View>}
      </Reveal>
    </View>
  </Modal>;
}

const styles = StyleSheet.create({
  children: { gap: spacing.lg },
  footer: { alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  close: { minWidth: layout.minTouchTarget, minHeight: layout.minTouchTarget, alignItems: 'center', justifyContent: 'center' },
  sheetBackdrop: { justifyContent: 'flex-end', padding: 0 },
  sheetPanel: { borderTopLeftRadius: radii.xl, borderTopRightRadius: radii.xl, borderBottomLeftRadius: 0, borderBottomRightRadius: 0, padding: reference.sheetPadding, backgroundColor: colors.background, maxWidth: layout.contentMaxWidth },
  backdrop: { flex: 1, backgroundColor: colors.scrim, justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  panel: { gap: spacing.lg, backgroundColor: colors.surface, padding: spacing.lg, borderRadius: radii.lg, width: '100%', maxWidth: layout.dialogMaxWidth, maxHeight: '90%' },
});
