import { forwardRef } from 'react';
import { StyleSheet, TextInput, type TextInputProps } from 'react-native';
import { colors, spacing, typography } from '@/constants/theme';

export const HeroTextField = forwardRef<TextInput, TextInputProps>(function HeroTextField({ style, ...props }, ref) {
  return <TextInput ref={ref} placeholderTextColor={colors.muted} selectionColor={colors.accent} style={[styles.input, style]} {...props} />;
});

const styles = StyleSheet.create({
  input: { ...typography.title, fontSize: 34, lineHeight: 44, color: colors.text, borderBottomWidth: 1.5, borderBottomColor: colors.line, minHeight: 86, paddingTop: spacing.xl, paddingBottom: spacing.md },
});
