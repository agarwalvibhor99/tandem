import { ActivityIndicator, Pressable, StyleSheet, type PressableProps } from 'react-native';

import { Text } from '@/components/ui/text';
import { colors, layout, radii, spacing } from '@/constants/theme';

type Props = Omit<PressableProps, 'children' | 'style'> & {
  label: string;
  loading?: boolean;
  variant?: 'primary' | 'secondary';
};

export function Button({ label, loading = false, variant = 'primary', disabled, ...props }: Props) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      {...props}
      accessibilityRole="button"
      accessibilityLabel={props.accessibilityLabel ?? label}
      accessibilityState={{ ...props.accessibilityState, disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.button,
        variant === 'secondary' && styles.secondary,
        pressed && (variant === 'secondary' ? styles.secondaryPressed : styles.pressed),
        isDisabled && styles.disabled,
      ]}
    >
      {loading && <ActivityIndicator color={variant === 'secondary' ? colors.accent : colors.onAccent} />}
      <Text variant="label" tone={variant === 'secondary' ? 'accent' : 'inverse'}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: layout.minTouchTarget,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  secondaryPressed: { opacity: 0.75 },
  secondary: { backgroundColor: colors.accentSoft },
  pressed: { backgroundColor: colors.accentPressed },
  disabled: { opacity: 0.5 },
});
