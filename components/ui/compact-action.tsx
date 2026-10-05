import type { LucideIcon } from 'lucide-react-native';
import { Pressable, StyleSheet, View, type PressableProps } from 'react-native';

import { Text } from '@/components/ui/text';
import { borders, colors, layout, radii, spacing } from '@/constants/theme';

type CompactActionProps = Omit<PressableProps, 'children' | 'style'> & {
  label: string;
  description?: string;
  icon: LucideIcon;
};

export function CompactAction({ label, description, icon: Icon, disabled, ...props }: CompactActionProps) {
  const isDisabled = !!disabled;

  return (
    <Pressable
      {...props}
      accessibilityRole="button"
      accessibilityLabel={props.accessibilityLabel ?? label}
      accessibilityState={{ ...props.accessibilityState, disabled: isDisabled }}
      disabled={isDisabled}
      style={({ pressed }) => [styles.action, pressed && styles.pressed, isDisabled && styles.disabled]}
    >
      <View style={styles.icon}>
        <Icon color={colors.accent} size={layout.iconSize} strokeWidth={borders.strong} />
      </View>
      <View style={styles.copy}>
        <Text variant="label">{label}</Text>
        {description ? <Text variant="caption" tone="secondary">{description}</Text> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  action: {
    minHeight: layout.minTouchTarget,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    maxWidth: '100%',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: borders.thin,
    borderColor: colors.border,
  },
  icon: {
    width: layout.compactIconSize,
    height: layout.compactIconSize,
    borderRadius: radii.pill,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1 },
  pressed: { backgroundColor: colors.surfaceMuted },
  disabled: { opacity: 0.5 },
});
