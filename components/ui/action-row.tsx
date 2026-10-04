import type { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';
import { spacing } from '@/constants/theme';

export function ActionRow({ children }: PropsWithChildren) {
  return <View style={styles.row}>{children}</View>;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
});
