import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Animated, Dimensions, Easing, PanResponder, StyleSheet, View } from 'react-native';
import { Reveal } from '@/components/ui/motion';
import { Surface } from '@/components/ui/surface';
import { Text } from '@/components/ui/text';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { borders, colors, layout, radii, spacing } from '@/constants/theme';
import type { PartnerNudge as PartnerNudgeRecord, PartnerNudgeType } from '@/types/nudge';

const copy: Record<PartnerNudgeType, { glyph: string; title: string; detail: string }> = {
  rose: { glyph: '🌹', title: 'A little rose for you', detail: 'A small reminder that you are loved.' },
  heart: { glyph: '❤️', title: 'A heart from your partner', detail: 'Sending a little love your way.' },
  coffee: { glyph: '☕', title: 'Coffee cheers', detail: 'A warm hello from your partner.' },
};

export function PartnerNudge({ nudge, senderName, onDismiss }: { nudge: PartnerNudgeRecord; senderName: string; onDismiss?: () => void }) {
  const reduced = useReducedMotion();
  const [scale] = useState(() => new Animated.Value(reduced ? 1 : 0.75));
  const [opacity] = useState(() => new Animated.Value(reduced ? 1 : 0));
  const [translateX] = useState(() => new Animated.Value(0));
  const responder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > Math.abs(gesture.dy) && Math.abs(gesture.dx) > 8,
    onPanResponderMove: Animated.event([null, { dx: translateX }], { useNativeDriver: true }),
    onPanResponderRelease: (_, gesture) => {
      if (Math.abs(gesture.dx) > 84 && onDismiss) {
        Animated.timing(translateX, { toValue: gesture.dx > 0 ? 420 : -420, duration: reduced ? 0 : 180, useNativeDriver: true }).start(({ finished }) => {
          if (finished) onDismiss();
        });
        return;
      }
      Animated.spring(translateX, { toValue: 0, damping: 18, stiffness: 220, useNativeDriver: true }).start();
    },
  });
  const item = copy[nudge.type];
  useEffect(() => {
    if (reduced) return;
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, damping: 12, stiffness: 170, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 220, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    ]).start();
  }, [opacity, reduced, scale]);
  return <Reveal>
    <Animated.View style={{ opacity, transform: [{ scale }] }}>
      <Animated.View {...responder.panHandlers} accessibilityRole="button" accessibilityLabel={`${item.title}. Sent ${formatDistanceToNow(new Date(nudge.created_at), { addSuffix: true })}`} accessibilityHint="Swipe left or right to dismiss" style={[styles.swipeTarget, { transform: [{ translateX }] }]}>
      <View style={styles.effectHost}>
        <NudgeEffect type={nudge.type} />
        <Surface variant="inset" style={styles.card}>
          <View style={styles.glyph}><Text style={styles.emoji}>{item.glyph}</Text></View>
          <View style={styles.copy}>
            <Text variant="label">{item.title}</Text>
            <Text variant="caption" tone="secondary">{senderName} · {item.detail}</Text>
            <Text variant="micro" tone="secondary">Sent {formatDistanceToNow(new Date(nudge.created_at), { addSuffix: true })}</Text>
          </View>
        </Surface>
        <Text variant="micro" tone="secondary" style={styles.dismissHint}>Swipe to dismiss</Text>
      </View>
      </Animated.View>
    </Animated.View>
  </Reveal>;
}

export function PartnerNudgeCelebration({ type }: { type: PartnerNudgeType }) {
  const reduced = useReducedMotion();
  const [progress] = useState(() => new Animated.Value(reduced ? 1 : 0));
  const [heroOpacity] = useState(() => new Animated.Value(reduced ? 0 : 1));
  const [traceOpacity] = useState(() => new Animated.Value(reduced ? 0 : 0));
  useEffect(() => {
    if (reduced) return;
    progress.setValue(0);
    heroOpacity.setValue(1);
    traceOpacity.setValue(0);
    const animation = Animated.parallel([
      Animated.timing(progress, { toValue: 1, duration: 1400, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.sequence([
        Animated.delay(3000),
        Animated.timing(heroOpacity, { toValue: 0, duration: 600, easing: Easing.in(Easing.quad), useNativeDriver: true }),
      ]),
      Animated.sequence([
        Animated.delay(1500),
        Animated.timing(traceOpacity, { toValue: 0.42, duration: 500, useNativeDriver: true }),
      ]),
    ]);
    animation.start();
    return () => animation.stop();
  }, [heroOpacity, progress, reduced, traceOpacity]);
  if (reduced) return null;
  const positions = [0.08, 0.23, 0.42, 0.64, 0.82, 0.94];
  const width = Dimensions.get('window').width;
  const glyph = type === 'rose' ? '🌹' : type === 'heart' ? '❤️' : '☕';
  return <View pointerEvents="none" style={styles.celebrationOverlay}>
    <Animated.View style={[styles.celebrationHero, { opacity: heroOpacity, transform: [{ scale: progress.interpolate({ inputRange: [0, .35, 1], outputRange: [.3, 1.15, 1] }) }, { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [-34, 0] }) }] }]}>
      <Text style={styles.celebrationEmoji}>{glyph}</Text>
      <Text variant="label" style={styles.celebrationTitle}>{type === 'rose' ? 'A rose for your day' : type === 'heart' ? 'A little love for you' : 'Coffee cheers from your partner'}</Text>
    </Animated.View>
    <Animated.View style={[styles.settledTraces, { opacity: traceOpacity }]}>
      {positions.map((position, index) => type === 'rose' ? <Animated.View key={index} style={[styles.settledPetal, { left: width * position, top: 150 + (index % 3) * 92, transform: [{ rotate: `${index * 24 - 18}deg` }] }]} /> : type === 'heart' ? <Text key={index} style={[styles.settledHeart, { left: width * position, top: 142 + (index % 3) * 102 }]}>♡</Text> : <View key={index} style={[styles.settledCoffee, { left: width * position - 18, top: 165 + (index % 3) * 104 }]} />)}
    </Animated.View>
  </View>;
}

function NudgeEffect({ type }: { type: PartnerNudgeType }) {
  const reduced = useReducedMotion();
  const [progress] = useState(() => new Animated.Value(reduced ? 1 : 0));
  const [opacity] = useState(() => new Animated.Value(reduced ? 0 : 1));

  useEffect(() => {
    if (reduced) {
      progress.setValue(1);
      opacity.setValue(0);
      return;
    }
    progress.setValue(0);
    opacity.setValue(1);
    const animation = Animated.sequence([
      Animated.timing(progress, { toValue: 1, duration: 1500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.delay(2600),
      Animated.timing(opacity, { toValue: 0, duration: 650, easing: Easing.in(Easing.quad), useNativeDriver: true }),
    ]);
    animation.start();
    return () => animation.stop();
  }, [opacity, progress, reduced]);

  if (reduced) return null;
  if (type === 'rose') {
    return <Animated.View pointerEvents="none" style={[styles.effectLayer, { opacity }]}>
      {[0, 1, 2, 3, 4].map(index => <Animated.View key={index} style={[styles.petal, {
        left: 28 + index * 25,
        transform: [
          { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [-20 - index * 8, 24 + (index % 2) * 18] }) },
          { translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [index % 2 ? -10 : 12, index % 2 ? 8 : -5] }) },
          { rotate: progress.interpolate({ inputRange: [0, 1], outputRange: [`${index * 35 - 25}deg`, `${index * 80 + 25}deg`] }) },
        ],
      }]} />)}
    </Animated.View>;
  }
  if (type === 'heart') {
    return <Animated.View pointerEvents="none" style={[styles.effectLayer, { opacity }]}>
      {[0, 1, 2].map(index => <Animated.Text key={index} style={[styles.floatingHeart, {
        left: 30 + index * 35,
        transform: [
          { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [14, -20 - index * 8] }) },
          { scale: progress.interpolate({ inputRange: [0, .35, 1], outputRange: [.5, 1.15, .85] }) },
        ],
      }]}>♡</Animated.Text>)}
    </Animated.View>;
  }
  return <Animated.View pointerEvents="none" style={[styles.effectLayer, { opacity }]}>
    <Animated.View style={[styles.coffeeRing, {
      transform: [{ scale: progress.interpolate({ inputRange: [0, 1], outputRange: [.2, 1] }) }],
      opacity: progress.interpolate({ inputRange: [0, .2, 1], outputRange: [0, .9, .55] }),
    }]} />
    <Animated.Text style={[styles.steam, { opacity: progress.interpolate({ inputRange: [0, .4, 1], outputRange: [0, 1, .25] }) }]}>⌁</Animated.Text>
  </Animated.View>;
}

const styles = StyleSheet.create({
  celebrationOverlay: { ...StyleSheet.absoluteFill, zIndex: 20 },
  celebrationHero: { position: 'absolute', top: 116, alignSelf: 'center', alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderRadius: radii.xl, backgroundColor: colors.surface, borderWidth: borders.thin, borderColor: colors.border },
  celebrationEmoji: { fontSize: 58, lineHeight: 68 },
  celebrationTitle: { color: colors.accent },
  settledTraces: { ...StyleSheet.absoluteFill },
  settledPetal: { position: 'absolute', width: 16, height: 9, borderRadius: 14, backgroundColor: colors.partner, opacity: .8 },
  settledHeart: { position: 'absolute', color: colors.accent, fontSize: 24, lineHeight: 28 },
  settledCoffee: { position: 'absolute', width: 36, height: 17, borderRadius: 24, borderWidth: 2, borderColor: colors.partner, opacity: .75 },
  swipeTarget: { width: '100%' },
  effectHost: { position: 'relative' },
  effectLayer: { ...StyleSheet.absoluteFill, zIndex: 2, overflow: 'visible' },
  petal: { position: 'absolute', top: -4, width: 12, height: 8, borderRadius: 12, backgroundColor: colors.partner, opacity: .8 },
  floatingHeart: { position: 'absolute', top: 2, color: colors.accent, fontSize: 22, lineHeight: 28, fontWeight: '700' },
  coffeeRing: { position: 'absolute', right: 30, bottom: -7, width: 46, height: 20, borderRadius: 30, borderWidth: 2, borderColor: colors.partner, opacity: .6 },
  steam: { position: 'absolute', right: 54, top: -14, color: colors.partner, fontSize: 24, lineHeight: 28 },
  dismissHint: { alignSelf: 'flex-end', marginTop: spacing.xs },
  card: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
  glyph: { width: layout.iconContainerSize, height: layout.iconContainerSize, alignItems: 'center', justifyContent: 'center', borderRadius: radii.md, backgroundColor: colors.accentSoft },
  emoji: { fontSize: layout.emojiSize, lineHeight: layout.emojiLineHeight },
  copy: { flex: 1, gap: spacing.xs },
});
