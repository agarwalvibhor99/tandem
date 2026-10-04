import { ActivityIndicator, Pressable, StyleSheet, type PressableProps, type ViewStyle } from 'react-native';

import { Text } from '@/components/ui/text';
import { colors, layout, radii, spacing } from '@/constants/theme';

type Props = Omit<PressableProps, 'children' | 'style'> & {
  label: string;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'quiet' | 'danger' | 'compact';
  grow?: boolean;
  style?: ViewStyle;
};

export function Button({ label, loading = false, variant = 'primary', disabled, grow = false, style, ...props }: Props) {
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
        grow && styles.grow,
        variant === 'secondary' && styles.secondary,
        variant === 'compact' && styles.compact,
        variant === 'danger' && styles.danger,
        variant === 'quiet' && styles.quiet,
        pressed && (variant === 'primary' ? styles.pressed : variant === 'danger' ? styles.dangerPressed : styles.secondaryPressed),
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading && <ActivityIndicator color={variant === 'primary' || variant === 'danger' || variant === 'compact' ? colors.onAccent : colors.accent} />}
      <Text variant="label" tone={variant === 'primary' || variant === 'danger' || variant === 'compact' ? 'inverse' : 'accent'}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1 },
  button: {
    minHeight: layout.minTouchTarget,
    borderRadius: radii.pill,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  secondaryPressed: { opacity: 0.75 },
  secondary: { backgroundColor: colors.chip },
  compact: { backgroundColor: colors.accent, alignSelf: 'center', paddingHorizontal: spacing.lg },
  danger: { backgroundColor: colors.error },
  dangerPressed: { opacity: 0.82 },
  quiet: { minHeight: 32, backgroundColor: 'transparent', paddingVertical: spacing.xs, paddingHorizontal: 0, alignSelf: 'flex-start' },
  pressed: { backgroundColor: colors.accentPressed },
  disabled: { backgroundColor: colors.disabled, opacity: 1 },
});
