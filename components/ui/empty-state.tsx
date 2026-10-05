import type { ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';

import { Button } from '@/components/ui/button';
import { Surface } from '@/components/ui/surface';
import { Text } from '@/components/ui/text';
import { spacing } from '@/constants/theme';

type Props = {
  title: string;
  description: string;
  action?: { label: string; onPress: () => void };
  icon?: ReactNode;
};

export function EmptyState({ title, description, action, icon }: Props) {
  return <Surface>
    {icon}
    <View style={styles.copy}>
      <Text variant="heading" accessibilityRole="header">{title}</Text>
      <Text tone="secondary">{description}</Text>
    </View>
    {action && <Button label={action.label} variant="quiet" onPress={action.onPress} />}
  </Surface>;
}

const styles = StyleSheet.create({ copy: { gap: spacing.sm } });
