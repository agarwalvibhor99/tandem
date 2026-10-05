import { forwardRef } from 'react';
import { StyleSheet, TextInput, type TextInputProps } from 'react-native';
import { borders, colors, layout, spacing, typography } from '@/constants/theme';

export const HeroTextField = forwardRef<TextInput, TextInputProps>(function HeroTextField({ style, ...props }, ref) {
  return <TextInput ref={ref} placeholderTextColor={colors.muted} selectionColor={colors.accent} style={[styles.input, style]} {...props} />;
});

const styles = StyleSheet.create({
  input: { ...typography.heroInput, color: colors.text, borderBottomWidth: borders.strong, borderBottomColor: colors.line, minHeight: layout.heroFieldHeight, paddingTop: spacing.xl, paddingBottom: spacing.md },
});
