import { Text as NativeText, StyleSheet, type TextProps } from 'react-native';

import { colors, typography } from '@/constants/theme';

type Props = TextProps & {
  variant?: keyof typeof typography;
  tone?: 'default' | 'secondary' | 'accent' | 'inverse';
};

export function Text({ variant = 'body', tone = 'default', style, ...props }: Props) {
  return (
    <NativeText
      {...props}
      style={[styles.base, typography[variant], styles[tone], style]}
    />
  );
}

const styles = StyleSheet.create({
  base: { flexShrink: 1 },
  default: { color: colors.text },
  secondary: { color: colors.textSecondary },
  accent: { color: colors.accent },
  inverse: { color: colors.onAccent },
});
