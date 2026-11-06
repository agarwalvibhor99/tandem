import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { colors, layout, radii, reference, spacing } from '@/constants/theme';

/** The reference's breathing shapes and floating heart, without remote assets. */
export function TogetherArt() {
  const reduced = useReducedMotion();
  const [breathe] = useState(() => new Animated.Value(0));
  const [float] = useState(() => new Animated.Value(0));
  const [twinkle] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (reduced) { breathe.setValue(0); float.setValue(0); twinkle.setValue(0); return; }
    const cycle = (value: Animated.Value, duration: number) => Animated.loop(Animated.sequence([
      Animated.timing(value, { toValue: 1, duration: duration / 2, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(value, { toValue: 0, duration: duration / 2, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    ]));
    const animations = [cycle(breathe, reference.breatheDuration), cycle(float, reference.floatDuration), cycle(twinkle, reference.twinkleDuration)];
    animations.forEach(animation => animation.start());
    return () => animations.forEach(animation => animation.stop());
  }, [breathe, float, reduced, twinkle]);
  return <View style={styles.art} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
    <Animated.View style={[styles.sage, { transform: [{ scale: breathe.interpolate({ inputRange: [0, 1], outputRange: [1, reference.breatheScale] }) }, { rotate: breathe.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '8deg'] }) }] }]} />
    <View style={styles.peach} />
    <Animated.View style={{ transform: [{ translateY: float.interpolate({ inputRange: [0, 1], outputRange: [0, reference.floatOffset] }) }, { rotate: float.interpolate({ inputRange: [0, 1], outputRange: ['-10deg', '-5deg'] }) }] }}><Text style={styles.heart}>♡</Text></Animated.View>
    <Animated.View style={[styles.spark, { opacity: twinkle.interpolate({ inputRange: [0, 1], outputRange: [1, .25] }), transform: [{ scale: twinkle.interpolate({ inputRange: [0, 1], outputRange: [1, .7] }) }] }]}><Text variant="title" style={styles.star}>✦</Text></Animated.View>
  </View>;
}
const styles = StyleSheet.create({
  art: { height: layout.welcomeArtHeight, width: layout.welcomeArtWidth, alignSelf: 'center', alignItems: 'center', justifyContent: 'center' },
  sage: { position: 'absolute', width: '95%', height: '82%', borderTopLeftRadius: radii.artLarge, borderTopRightRadius: radii.artSmall, borderBottomLeftRadius: radii.artSmall, borderBottomRightRadius: radii.artLarge, backgroundColor: colors.accentSoft },
  peach: { position: 'absolute', left: spacing.lg, bottom: spacing.sm, width: '66%', height: '66%', borderRadius: radii.pill, backgroundColor: colors.peach },
  heart: { fontFamily: 'Georgia', fontSize: layout.welcomeHeartSize, color: colors.accent },
  spark: { position: 'absolute', top: spacing.xl, right: spacing.md },
  star: { color: colors.warning },
});
