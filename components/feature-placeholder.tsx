import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { Screen } from '@/components/ui/screen';
import { Surface } from '@/components/ui/surface';
import { Text } from '@/components/ui/text';
import { colors, layout, radii, spacing } from '@/constants/theme';

type Props = {
  title: string;
  description: string;
  headline: string;
  detail: string;
  icon: LucideIcon;
  children?: ReactNode;
};

export function FeaturePlaceholder({ title, description, headline, detail, icon: Icon, children }: Props) {
  return (
    <Screen title={title} description={description}>
      {children}
      <Surface>
        <View style={styles.icon} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <Icon size={layout.featureIconSize} color={colors.accent} strokeWidth={1.5} />
        </View>
        <View style={styles.copy}>
          <Text variant="title" accessibilityRole="header">{headline}</Text>
          <Text tone="secondary">{detail}</Text>
        </View>
        <View style={styles.badge}>
          <Text variant="caption" tone="accent">Coming to Tandem</Text>
        </View>
      </Surface>
    </Screen>
  );
}

const styles = StyleSheet.create({
  icon: {
    width: layout.iconContainerSize,
    height: layout.iconContainerSize,
    borderRadius: radii.md,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { gap: spacing.sm },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: radii.pill,
    backgroundColor: colors.accentSoft,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
});
