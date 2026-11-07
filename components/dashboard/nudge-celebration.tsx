import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, useWindowDimensions, View } from 'react-native';
import { BeerMugArt, BeerSplashArt, CoffeeCupArt, CoffeeRippleArt, CoffeeSplashArt, CoffeeStainArt, HeartArt, RoseArt, RosePetalArt } from '@/components/dashboard/nudge-art';
import { Text } from '@/components/ui/text';
import { layout } from '@/constants/theme';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import type { PartnerNudge, PartnerNudgeType } from '@/types/nudge';

const played = new Set<string>();
const DURATION = 5200;
const petals = [
  { x: .08, y: .22, drift: -30, turn: -72, size: 31 },
  { x: .81, y: .3, drift: 36, turn: 46, size: 26 },
  { x: .21, y: .52, drift: 25, turn: 128, size: 35 },
  { x: .72, y: .67, drift: -32, turn: -118, size: 29 },
  { x: .34, y: .84, drift: 39, turn: 29, size: 33 },
  { x: .88, y: .87, drift: -18, turn: 153, size: 24 },
  { x: .53, y: .13, drift: 20, turn: -32, size: 23 },
] as const;
const stains = [
  { x: .08, y: .27, turn: -14, size: 76 },
  { x: .74, y: .56, turn: 32, size: 94 },
  { x: .24, y: .8, turn: -27, size: 68 },
] as const;

function CheersScene({ kind, progress, cupSize }: { kind: Extract<PartnerNudgeType, 'coffee' | 'beer'>; progress: Animated.Value; cupSize: number }) {
  const beer = kind === 'beer';
  return <View style={styles.coffeeScene}>
    {([-1, 1] as const).map((side) => <Animated.View key={side} style={{ transform: [
      { translateX: progress.interpolate({ inputRange: [0, .06, .16, .205, .27, .35, 1], outputRange: [side * 42, side * 34, -side * 3, side * 12, side * 6, side * 9, side * 9] }) },
      { translateY: progress.interpolate({ inputRange: [0, .16, .205, .35, 1], outputRange: [14, -5, 1, 0, 0] }) },
      { rotate: progress.interpolate({ inputRange: [0, .16, .205, .27, .35, 1], outputRange: [`${side * 16}deg`, `${-side * 11}deg`, `${side * 5}deg`, `${-side * 2}deg`, '0deg', '0deg'] }) },
    ] }}>
      {beer ? <BeerMugArt size={cupSize * .92} mirrored={side === -1} /> : <CoffeeCupArt size={cupSize} mirrored={side === -1} />}
      {!beer && <Animated.View style={[styles.ripple, { width: cupSize * .62, left: cupSize * (side === -1 ? .28 : .1), top: cupSize * .2,
        opacity: progress.interpolate({ inputRange: [0, .14, .17, .3, .4, 1], outputRange: [0, 0, .85, .3, 0, 0] }),
        transform: [
          { translateX: progress.interpolate({ inputRange: [0, .16, .205, .27, .35, 1], outputRange: [0, side * 5, -side * 3, side * 2, 0, 0] }) },
          { scaleY: progress.interpolate({ inputRange: [0, .16, .205, .27, .35, 1], outputRange: [.6, 1.3, .6, 1.1, 1, 1] }) },
        ],
      }]}><CoffeeRippleArt size={cupSize * .62} /></Animated.View>}
    </Animated.View>)}
    <Animated.View style={[styles.splash, { width: cupSize * 1.04, left: cupSize * .48, top: beer ? -cupSize * .2 : -cupSize * .38,
      opacity: progress.interpolate({ inputRange: [0, .15, .17, .23, .32, 1], outputRange: [0, 0, 1, .8, 0, 0] }),
      transform: [
        { translateY: progress.interpolate({ inputRange: [0, .15, .22, .32, 1], outputRange: [25, 25, -18, 20, 20] }) },
        { scale: progress.interpolate({ inputRange: [0, .15, .22, .32, 1], outputRange: [.15, .15, 1.15, 1.25, 1.25] }) },
      ],
    }]}>{beer ? <BeerSplashArt size={cupSize * 1.04} /> : <CoffeeSplashArt size={cupSize * 1.04} />}</Animated.View>
    {beer && <Animated.View style={[styles.cheersLabel, {
      opacity: progress.interpolate({ inputRange: [0, .18, .24, .5, .62, 1], outputRange: [0, 0, 1, 1, 0, 0] }),
      transform: [
        { translateY: progress.interpolate({ inputRange: [0, .2, .28, .55, 1], outputRange: [18, 18, 0, -8, -8] }) },
        { scale: progress.interpolate({ inputRange: [0, .18, .26, .34, 1], outputRange: [.82, .82, 1.08, 1, 1] }) },
        { rotate: progress.interpolate({ inputRange: [0, .2, .28, .4, 1], outputRange: ['-4deg', '-4deg', '2deg', '0deg', '0deg'] }) },
      ],
    }]}><Text variant="editorial" tone="accent" style={styles.cheersText}>Cheers!!</Text></Animated.View>}
  </View>;
}

export function PartnerNudgeCelebration({ nudge }: { nudge: PartnerNudge }) {
  const reduced = useReducedMotion();
  const window = useWindowDimensions();
  const [bounds, setBounds] = useState({ width: window.width, height: window.height });
  const [fresh] = useState(() => !played.has(nudge.id));
  const [finished, setFinished] = useState(false);
  const [progress] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (!fresh || reduced) return;
    played.add(nudge.id);
    // Keep replay prevention bounded during long sessions.
    if (played.size > 64) played.delete(played.values().next().value!);
    const animation = Animated.timing(progress, { toValue: 1, duration: DURATION, easing: Easing.linear, useNativeDriver: true });
    animation.start(({ finished: completed }) => { if (completed) setFinished(true); });
    return () => animation.stop();
  }, [fresh, nudge.id, progress, reduced]);

  if (!fresh || reduced || finished) return null;
  const { width, height } = bounds;
  const cupSize = Math.min(layout.nudgeCupSize, width * .39);
  const heroSize = Math.min(layout.nudgeHeroSize, width * .62, height * .46);
  const heroOpacity = progress.interpolate({ inputRange: [0, .035, .53, .66, 1], outputRange: [0, 1, 1, 0, 0] });
  const tracesOpacity = progress.interpolate({ inputRange: [0, .14, .22, .68, .94, 1], outputRange: [0, 0, 1, 1, 0, 0] });

  return <View pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
    onLayout={({ nativeEvent: { layout: frame } }) => setBounds({ width: frame.width, height: frame.height })} style={styles.overlay}>
    <Animated.View style={[styles.centerpiece, { opacity: heroOpacity }]}>
      {nudge.type === 'rose' && <Animated.View style={{ transform: [
        { scale: progress.interpolate({ inputRange: [0, .1, .16, .53, 1], outputRange: [.72, 1.035, 1, 1, .96] }) },
        { rotate: progress.interpolate({ inputRange: [0, .16, .53, 1], outputRange: ['-9deg', '2deg', '-2deg', '0deg'] }) },
        { translateY: progress.interpolate({ inputRange: [0, .16, .53, 1], outputRange: [24, 0, -7, -12] }) },
      ] }}><RoseArt size={heroSize} /></Animated.View>}
      {nudge.type === 'heart' && <Animated.View style={{ transform: [{ scale: progress.interpolate({ inputRange: [0, .1, .17, .25, .33, .42, 1], outputRange: [.7, 1.04, 1, 1.07, 1, 1.035, 1] }) }] }}><HeartArt size={heroSize} /></Animated.View>}
      {(nudge.type === 'coffee' || nudge.type === 'beer') && <CheersScene kind={nudge.type} progress={progress} cupSize={cupSize} />}
    </Animated.View>
    {nudge.type === 'rose' && <Animated.View style={[styles.traces, { opacity: tracesOpacity }]}>
      {petals.map((petal, index) => {
        const start = .12 + index * .018;
        const end = .43 + index * .026;
        return <Animated.View key={index} style={[styles.trace, { left: width * petal.x - petal.size / 2, top: height * petal.y, transform: [
          { translateX: progress.interpolate({ inputRange: [0, start, (start + end) / 2, end, 1], outputRange: [petal.drift, petal.drift, -petal.drift * .45, 0, 0] }) },
          { translateY: progress.interpolate({ inputRange: [0, start, end, 1], outputRange: [-height * .4, -height * .4, 0, 0] }) },
          { rotate: progress.interpolate({ inputRange: [0, start, end, 1], outputRange: ['0deg', '0deg', `${petal.turn}deg`, `${petal.turn}deg`] }) },
          { scaleX: progress.interpolate({ inputRange: [0, start, (start + end) / 2, end, 1], outputRange: [1, 1, .4, .9, .9] }) },
        ] }]}><RosePetalArt size={petal.size} /></Animated.View>;
      })}
    </Animated.View>}
    {nudge.type === 'coffee' && <Animated.View style={[styles.traces, { opacity: tracesOpacity }]}>
      {stains.map((stain, index) => <Animated.View key={index} style={[styles.trace, { left: width * stain.x - stain.size * .3, top: height * stain.y,
        opacity: progress.interpolate({ inputRange: [0, .2 + index * .045, .235 + index * .045, 1], outputRange: [0, 0, .65, .65] }),
        transform: [
          { rotate: `${stain.turn}deg` },
          { scale: progress.interpolate({ inputRange: [0, .2 + index * .045, .27 + index * .045, .33 + index * .045, 1], outputRange: [.12, .12, 1.08, 1, 1] }) },
        ],
      }]}><CoffeeStainArt size={stain.size} /></Animated.View>)}
    </Animated.View>}
  </View>;
}

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFill, zIndex: 20, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  centerpiece: { alignItems: 'center', justifyContent: 'center' },
  coffeeScene: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  ripple: { position: 'absolute' },
  splash: { position: 'absolute' },
  cheersLabel: { position: 'absolute', top: '100%', alignSelf: 'center' },
  cheersText: { textAlign: 'center', fontStyle: 'italic' },
  traces: { ...StyleSheet.absoluteFill },
  trace: { position: 'absolute' },
});
