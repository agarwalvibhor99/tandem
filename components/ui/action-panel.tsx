import type { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';
import { Surface } from '@/components/ui/surface';
import { Text } from '@/components/ui/text';
import { spacing } from '@/constants/theme';

export function ActionPanel({ title = 'Actions', description, children }: PropsWithChildren<{ title?: string; description?: string }>) {
  return <Surface style={styles.panel}>
    <View style={styles.copy}>
      <Text variant="heading">{title}</Text>
      {description ? <Text variant="caption" tone="secondary">{description}</Text> : null}
    </View>
    <View style={styles.actions}>{children}</View>
  </Surface>;
}

const styles = StyleSheet.create({
  panel: { gap: spacing.lg },
  copy: { gap: spacing.xs },
  actions: { gap: spacing.sm },
});
