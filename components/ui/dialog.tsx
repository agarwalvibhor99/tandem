import type { PropsWithChildren } from 'react';
import { Modal, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { colors, layout, radii, spacing } from '@/constants/theme';

type Props = PropsWithChildren<{
  visible: boolean;
  title: string;
  onClose: () => void;
}>;

export function Dialog({ visible, title, onClose, children }: Props) {
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <View style={styles.backdrop}>
      <View style={styles.panel} accessibilityViewIsModal>
        <Text variant="title" accessibilityRole="header">{title}</Text>
        {children}
      </View>
    </View>
  </Modal>;
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: colors.scrim, justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  panel: { gap: spacing.lg, backgroundColor: colors.surface, padding: spacing.lg, borderRadius: radii.lg, width: '100%', maxWidth: layout.dialogMaxWidth, maxHeight: '90%' },
});
