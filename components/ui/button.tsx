import { ActivityIndicator, StyleSheet, type PressableProps, type ViewStyle } from 'react-native';

import { PressableScale } from '@/components/ui/pressable-scale';
import { Text } from '@/components/ui/text';
import { borders, colors, layout, radii, spacing, shadows } from '@/constants/theme';

type Props = Omit<PressableProps, 'children' | 'style'> & {
  label: string;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'quiet' | 'danger' | 'ghost';
  size?: 'regular' | 'compact' | 'large';
  grow?: boolean;
  style?: ViewStyle;
};

export function Button({ label, loading = false, variant = 'primary', size = 'regular', disabled, grow = false, style, ...props }: Props) {
  const isDisabled = disabled || loading;

  return (
    <PressableScale
      {...props}
      accessibilityRole="button"
      accessibilityLabel={props.accessibilityLabel ?? label}
      accessibilityState={{ ...props.accessibilityState, disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      pressedStyle={variant === 'primary' ? styles.primaryPressed : styles.secondaryPressed}
      style={[
        styles.button,
        grow && styles.grow,
        variant === 'secondary' && styles.secondary,
        size === 'compact' && styles.compact,
        size === 'large' && styles.large,
        variant === 'danger' && styles.danger,
        variant === 'quiet' && styles.quiet,
        variant === 'ghost' && styles.ghost,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading && <ActivityIndicator color={variant === 'primary' || variant === 'danger' ? colors.onAccent : colors.accent} />}
      <Text variant="label" tone={variant === 'primary' || variant === 'danger' ? 'inverse' : variant === 'ghost' ? 'default' : 'accent'}>{label}</Text>
    </PressableScale>
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
    ...shadows.soft,
  },
  secondaryPressed: { opacity: 0.75 },
  secondary: { backgroundColor: colors.chip, boxShadow: 'none' },
  compact: { backgroundColor: colors.accent, alignSelf: 'center', paddingHorizontal: spacing.lg },
  large: { minHeight: 56, paddingVertical: spacing.lg },
  danger: { backgroundColor: colors.error },
  quiet: { minHeight: layout.minTouchTarget, backgroundColor: 'transparent', paddingVertical: spacing.xs, paddingHorizontal: 0, alignSelf: 'flex-start', boxShadow: 'none' },
  ghost: { backgroundColor: colors.surface, borderWidth: borders.thin, borderColor: colors.border, boxShadow: 'none' },
  primaryPressed: { opacity: 0.88 },
  disabled: { backgroundColor: colors.disabled, opacity: 1 },
});
