import { forwardRef, useId, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { Text } from '@/components/ui/text';
import { colors, layout, radii, spacing, typography } from '@/constants/theme';

type Props = TextInputProps & { label: string; error?: string; hint?: string; password?: boolean };

export const FormField = forwardRef<TextInput, Props>(function FormField({ label, error, hint, password = false, style, ...props }, ref) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.field}>
      <Text variant="label" nativeID={`${id}-label`}>{label}</Text>
      <View style={[styles.inputContainer, focused && styles.focused, !!error && styles.invalid]}>
        <TextInput
          {...props}
          ref={ref}
          accessibilityLabel={label}
          accessibilityHint={error ?? hint}
          aria-invalid={!!error}
          aria-describedby={error || hint ? `${id}-detail` : undefined}
          secureTextEntry={password && !visible}
          placeholderTextColor={colors.textSecondary}
          selectionColor={colors.accent}
          onFocus={(event) => { setFocused(true); props.onFocus?.(event); }}
          onBlur={(event) => { setFocused(false); props.onBlur?.(event); }}
          style={[styles.input, style]}
        />
        {password && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={visible ? 'Hide password' : 'Show password'}
            accessibilityState={{ expanded: visible }}
            onPress={() => setVisible((value) => !value)}
            style={styles.toggle}
          >
            <Text variant="label" tone="accent">{visible ? 'Hide' : 'Show'}</Text>
          </Pressable>
        )}
      </View>
      {(error || hint) && <Text nativeID={`${id}-detail`} accessibilityLiveRegion="polite" variant="caption" style={error ? styles.error : undefined} tone="secondary">{error ?? hint}</Text>}
    </View>
  );
});

const styles = StyleSheet.create({
  field: { gap: spacing.sm },
  inputContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, borderRadius: radii.md },
  focused: { borderColor: colors.accent },
  invalid: { borderColor: colors.error },
  input: { ...typography.body, color: colors.text, flex: 1, minWidth: 0, minHeight: layout.minTouchTarget, padding: spacing.md },
  toggle: { minHeight: layout.minTouchTarget, minWidth: layout.minTouchTarget, justifyContent: 'center', alignItems: 'center', paddingHorizontal: spacing.md },
  error: { color: colors.error },
});
