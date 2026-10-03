import { Text as NativeText, StyleSheet, type TextProps } from 'react-native';

import { colors, typography } from '@/constants/theme';

type Props = TextProps & {
  variant?: keyof typeof typography;
  tone?: 'default' | 'secondary' | 'accent' | 'inverse';
};

const toneColors = {
  default: colors.text,
  secondary: colors.textSecondary,
  accent: colors.accent,
  inverse: colors.onAccent,
};

export function Text({ variant = 'body', tone = 'default', style, ...props }: Props) {
  return (
    <NativeText
      {...props}
      style={[styles.base, typography[variant], { color: toneColors[tone] }, style]}
    />
  );
}

const styles = StyleSheet.create({ base: { flexShrink: 1 } });
