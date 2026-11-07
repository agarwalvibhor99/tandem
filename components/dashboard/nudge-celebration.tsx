import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, useWindowDimensions, View } from 'react-native';
import { CoffeeCupArt, CoffeeRippleArt, CoffeeSplashArt, CoffeeStainArt, HeartArt, RoseArt, RosePetalArt } from '@/components/dashboard/nudge-art';
import { layout } from '@/constants/theme';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import type { PartnerNudge } from '@/types/nudge';

const played = new Set<string>();
const petalPositions = [
  { x: .09, y: .18, drift: -38, turn: '-42deg' },
  { x: .82, y: .26, drift: 30, turn: '32deg' },
  { x: .17, y: .48, drift: 18, turn: '72deg' },
  { x: .77, y: .63, drift: -25, turn: '-56deg' },
  { x: .39, y: .78, drift: 36, turn: '24deg' },
] as const;
const stainPositions = [
  { x: .08, y: .24, turn: '-14deg' },
  { x: .75, y: .49, turn: '32deg' },
  { x: .3, y: .74, turn: '-27deg' },
] as const;

export function PartnerNudgeCelebration({ nudge }: { nudge: PartnerNudge }) {
  const reduced = useReducedMotion();
  const { width, height } = useWindowDimensions();
  const [fresh] = useState(() => !played.has(nudge.id));
  const [progress] = useState(() => new Animated.Value(0));
  const [heroOpacity] = useState(() => new Animated.Value(1));
  const [traceOpacity] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (!fresh || reduced) return;
    played.add(nudge.id);
    const animation = Animated.parallel([
      Animated.timing(progress, { toValue: 1, duration: 1800, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.sequence([Animated.delay(2700), Animated.timing(heroOpacity, { toValue: 0, duration: 550, useNativeDriver: true })]),
      Animated.sequence([Animated.delay(900), Animated.timing(traceOpacity, { toValue: 1, duration: 1000, useNativeDriver: true })]),
    ]);
    animation.start();
    return () => animation.stop();
  }, [fresh, heroOpacity, nudge.id, progress, reduced, traceOpacity]);

  if (!fresh || reduced) return null;
  return <View pointerEvents="none" style={styles.overlay}>
    <Animated.View style={[styles.centerpiece, { opacity: heroOpacity }]}>
      {nudge.type === 'rose' && <Animated.View style={{ transform: [
        { scale: progress.interpolate({ inputRange: [0, .48, .72, 1], outputRange: [.58, 1.09, .98, 1] }) },
        { rotate: progress.interpolate({ inputRange: [0, 1], outputRange: ['-10deg', '0deg'] }) },
      ] }}><RoseArt size={layout.nudgeHeroSize} /></Animated.View>}
      {nudge.type === 'heart' && <Animated.View style={{ transform: [{ scale: progress.interpolate({ inputRange: [0, .35, .56, .75, 1], outputRange: [.65, 1.08, .97, 1.07, 1] }) }] }}><HeartArt size={layout.nudgeHeroSize} /></Animated.View>}
      {nudge.type === 'coffee' && <View style={styles.coffeeScene}>
        <Animated.View style={{ transform: [
          { translateX: progress.interpolate({ inputRange: [0, .42, .58, 1], outputRange: [-45, -8, -18, -13] }) },
          { rotate: progress.interpolate({ inputRange: [0, .42, .58, 1], outputRange: ['-23deg', '12deg', '-8deg', '0deg'] }) },
        ] }}><CoffeeCupArt size={layout.nudgeCupSize} /><Animated.View style={[styles.ripple, { transform: [{ translateX: progress.interpolate({ inputRange: [0, .42, .6, 1], outputRange: [-6, 5, -4, 0] }) }, { rotate: progress.interpolate({ inputRange: [0, .42, .6, 1], outputRange: ['5deg', '-7deg', '4deg', '0deg'] }) }] }]}><CoffeeRippleArt /></Animated.View></Animated.View>
        <Animated.View style={{ transform: [
          { translateX: progress.interpolate({ inputRange: [0, .42, .58, 1], outputRange: [45, 8, 18, 13] }) },
          { rotate: progress.interpolate({ inputRange: [0, .42, .58, 1], outputRange: ['23deg', '-12deg', '8deg', '0deg'] }) },
        ] }}><CoffeeCupArt size={layout.nudgeCupSize} mirrored /><Animated.View style={[styles.ripple, { transform: [{ translateX: progress.interpolate({ inputRange: [0, .42, .6, 1], outputRange: [6, -5, 4, 0] }) }, { rotate: progress.interpolate({ inputRange: [0, .42, .6, 1], outputRange: ['-5deg', '7deg', '-4deg', '0deg'] }) }] }]}><CoffeeRippleArt /></Animated.View></Animated.View>
        <Animated.View style={[styles.splash, { opacity: progress.interpolate({ inputRange: [0, .31, .43, .68, 1], outputRange: [0, 0, 1, .55, 0] }), transform: [{ scale: progress.interpolate({ inputRange: [0, .35, .65, 1], outputRange: [.25, .5, 1.1, 1.35] }) }] }]}><CoffeeSplashArt /></Animated.View>
      </View>}
    </Animated.View>
    {nudge.type === 'rose' && <Animated.View style={[styles.traces, { opacity: traceOpacity }]}>
      {petalPositions.map((petal, index) => <Animated.View key={index} style={[styles.trace, { left: width * petal.x, top: height * petal.y, transform: [
        { translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [petal.drift, 0] }) },
        { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [-height * (.45 + index * .09), 0] }) },
        { rotate: progress.interpolate({ inputRange: [0, 1], outputRange: ['0deg', petal.turn] }) },
      ] }]}><RosePetalArt size={index % 2 ? 21 : 27} /></Animated.View>)}
    </Animated.View>}
    {nudge.type === 'coffee' && <Animated.View style={[styles.traces, { opacity: traceOpacity }]}>
      {stainPositions.map((stain, index) => <Animated.View key={index} style={[styles.trace, { left: width * stain.x, top: height * stain.y, transform: [
        { rotate: stain.turn },
        { scale: progress.interpolate({ inputRange: [0, .36, .8, 1], outputRange: [.2, .2, 1.12, 1] }) },
      ] }]}><CoffeeStainArt size={index === 1 ? layout.nudgeTraceSize * 1.25 : layout.nudgeTraceSize} /></Animated.View>)}
    </Animated.View>}
  </View>;
}

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFill, zIndex: 20, justifyContent: 'center', alignItems: 'center' },
  centerpiece: { alignItems: 'center', justifyContent: 'center' },
  coffeeScene: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  ripple: { position: 'absolute', left: layout.nudgeCupSize * .21, top: layout.nudgeCupSize * .31 },
  splash: { position: 'absolute', alignSelf: 'center', top: -layout.nudgeTraceSize },
  traces: { ...StyleSheet.absoluteFill },
  trace: { position: 'absolute' },
});
