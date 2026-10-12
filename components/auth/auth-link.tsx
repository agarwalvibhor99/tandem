import { Link, type Href } from 'expo-router';
import { StyleSheet } from 'react-native';

import { colors, layout, spacing, typography } from '@/constants/theme';

export function AuthLink({ href, label }: { href: Href | string; label: string }) {
  return <Link href={href as Href} replace style={styles.link}>{label}</Link>;
}

const styles = StyleSheet.create({
  link: { ...typography.label, color: colors.accent, textAlign: 'center', minHeight: layout.minTouchTarget, padding: spacing.md },
});
