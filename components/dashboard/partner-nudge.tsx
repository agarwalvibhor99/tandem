import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { Reveal } from '@/components/ui/motion';
import { Surface } from '@/components/ui/surface';
import { Text } from '@/components/ui/text';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { colors, layout, radii, spacing } from '@/constants/theme';
import type { PartnerNudge as PartnerNudgeRecord, PartnerNudgeType } from '@/types/nudge';

const copy: Record<PartnerNudgeType, { glyph: string; title: string; detail: string }> = {
  rose: { glyph: '🌹', title: 'A little rose for you', detail: 'A small reminder that you are loved.' },
  heart: { glyph: '❤️', title: 'A heart from your partner', detail: 'Sending a little love your way.' },
  coffee: { glyph: '☕', title: 'Coffee cheers', detail: 'A warm hello from your partner.' },
};

export function PartnerNudge({ nudge, senderName }: { nudge: PartnerNudgeRecord; senderName: string }) {
  const reduced = useReducedMotion();
  const [scale] = useState(() => new Animated.Value(reduced ? 1 : 0.75));
  const [opacity] = useState(() => new Animated.Value(reduced ? 1 : 0));
  const item = copy[nudge.type];
  useEffect(() => {
    if (reduced) return;
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, damping: 12, stiffness: 170, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 220, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    ]).start();
  }, [opacity, reduced, scale]);
  return <Reveal><Animated.View style={{ opacity, transform: [{ scale }] }}><Surface variant="inset" style={styles.card}><View style={styles.glyph}><Text style={styles.emoji}>{item.glyph}</Text></View><View style={styles.copy}><Text variant="label">{item.title}</Text><Text variant="caption" tone="secondary">{senderName} · {item.detail}</Text></View></Surface></Animated.View></Reveal>;
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
  glyph: { width: layout.iconContainerSize, height: layout.iconContainerSize, alignItems: 'center', justifyContent: 'center', borderRadius: radii.md, backgroundColor: colors.accentSoft },
  emoji: { fontSize: layout.emojiSize, lineHeight: layout.emojiLineHeight },
  copy: { flex: 1, gap: spacing.xs },
});
