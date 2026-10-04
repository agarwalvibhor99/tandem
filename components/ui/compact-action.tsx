import type { LucideIcon } from 'lucide-react-native';
import { Pressable, StyleSheet, View, type PressableProps } from 'react-native';

import { Text } from '@/components/ui/text';
import { colors, layout, radii, spacing } from '@/constants/theme';

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
        <Icon color={colors.accent} size={20} strokeWidth={1.75} />
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  icon: {
    width: 32,
    height: 32,
    borderRadius: radii.sm,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1 },
  pressed: { backgroundColor: colors.surfaceMuted },
  disabled: { opacity: 0.5 },
});
