import Svg, { Circle, Ellipse, Path } from 'react-native-svg';
import { colors } from '@/constants/theme';

export function RoseArt({ size = 240 }: { size?: number }) {
  return <Svg width={size} height={size * 1.08} viewBox="0 0 240 260">
    <Path d="M116 132c-5 42-3 80 7 115" stroke={colors.nudgeStem} strokeWidth="8" strokeLinecap="round" fill="none" />
    <Path d="M118 200c-31-28-59-25-72-15 14 26 43 33 72 15Z" fill={colors.nudgeLeaf} />
    <Path d="M118 200c-24-10-42-13-65-13" stroke={colors.nudgeStem} strokeWidth="3" fill="none" />
    <Path d="M120 221c25-35 51-36 70-28-13 27-36 34-70 28Z" fill={colors.nudgeStem} />
    <Path d="M121 219c22-17 40-22 62-25" stroke={colors.nudgeLeaf} strokeWidth="3" fill="none" />
    <Path d="M71 116c-32-7-42-34-24-56 7 15 17 19 29 17-9-22-3-43 19-52 3 14 10 25 24 31 13-24 35-32 55-21-8 14-8 26 1 39 20-5 38 6 39 28-14-3-23 1-31 15-31 26-83 34-112-1Z" fill={colors.nudgeRoseDeep} />
    <Path d="M63 79c-9-29 9-48 31-52 0 19 13 35 28 44-16 13-41 17-59 8Z" fill={colors.nudgeRose} />
    <Path d="M175 36c27 12 31 36 15 53-21 3-40-6-51-22 19-7 30-18 36-31Z" fill={colors.nudgeRose} />
    <Path d="M44 61c10 16 24 23 45 21-7 21-22 35-39 35-19-16-21-39-6-56Z" fill={colors.nudgeRoseLight} />
    <Path d="M196 65c19 21 14 42-7 55-18-2-28-11-35-27 20-2 31-12 42-28Z" fill={colors.nudgeRoseLight} />
    <Path d="M82 60c7-22 25-32 38-33 10 0 28 11 32 31-13 12-23 19-34 20-17-2-27-8-36-18Z" fill={colors.nudgeRoseLight} />
    <Path d="M64 94c21-11 38-6 52 9 16-19 39-20 63-7-6 29-31 48-60 49-30 0-49-17-55-51Z" fill={colors.nudgeRose} />
    <Path d="M89 73c16-15 42-15 59 1 10 10 12 24 4 36-10 14-25 19-39 15-19-7-29-25-24-52Z" fill={colors.nudgeRoseDeep} />
    <Path d="M95 75c12-10 31-12 43-4 9 7 11 17 5 25-9-10-21-13-32-8-4 7-1 14 6 17 10 4 19 1 24-6-2 15-13 23-28 22-22-2-33-23-18-46Z" fill={colors.nudgeRoseLight} />
    <Path d="M114 86c7-4 17-3 21 4 3 8-3 14-10 14-6 0-10-4-9-9 1-3 3-4 6-5" stroke={colors.nudgeRoseDeep} strokeWidth="4" strokeLinecap="round" fill="none" />
    <Path d="M70 114c31 14 67 17 101 2" stroke={colors.nudgeRoseVein} strokeWidth="2" opacity=".4" fill="none" />
  </Svg>;
}

export function HeartArt({ size = 220 }: { size?: number }) {
  return <Svg width={size} height={size} viewBox="0 0 220 220">
    <Path d="M110 189C53 145 18 111 18 73c0-28 20-47 47-47 21 0 36 11 45 27 9-16 24-27 45-27 27 0 47 19 47 47 0 38-35 72-92 116Z" fill={colors.nudgeRoseDeep} />
    <Path d="M110 177C58 136 28 105 28 74c0-22 15-38 37-38 23 0 36 16 45 33 9-17 22-33 45-33 22 0 37 16 37 38 0 31-30 62-82 103Z" fill={colors.nudgeRose} />
    <Path d="M45 76c0-15 10-25 23-25" stroke={colors.nudgeRoseLight} strokeWidth="8" strokeLinecap="round" fill="none" opacity=".85" />
    <Path d="M66 145c15 15 29 27 44 38" stroke={colors.nudgeRoseLight} strokeWidth="4" strokeLinecap="round" fill="none" opacity=".36" />
  </Svg>;
}

export function CoffeeCupArt({ size = 146, mirrored = false }: { size?: number; mirrored?: boolean }) {
  return <Svg width={size} height={size * .96} viewBox="0 0 180 173" style={mirrored ? { transform: [{ scaleX: -1 }] } : undefined}>
    <Path d="M130 64c33-15 47 2 43 23-3 22-23 28-43 28" stroke={colors.nudgeCupShade} strokeWidth="14" strokeLinecap="round" fill="none" />
    <Path d="M130 64c28-11 40 3 35 21-3 15-15 20-35 20" stroke={colors.nudgeCup} strokeWidth="9" strokeLinecap="round" fill="none" />
    <Path d="M29 58h112l-9 75c-2 17-19 28-45 28-26 0-43-11-45-28L29 58Z" fill={colors.nudgeCupShade} />
    <Path d="M34 58h101l-9 72c-2 16-17 25-39 25-22 0-37-9-39-25L34 58Z" fill={colors.nudgeCup} />
    <Ellipse cx="85" cy="60" rx="57" ry="17" fill={colors.nudgeCupShade} />
    <Ellipse cx="85" cy="58" rx="52" ry="13" fill={colors.nudgeCoffee} />
    <Path d="M39 59c15 9 67 12 91-1" stroke={colors.nudgeCoffeeLight} strokeWidth="4" strokeLinecap="round" fill="none" opacity=".75" />
    <Path d="M48 77c3 27 6 45 9 54" stroke={colors.surface} strokeWidth="5" strokeLinecap="round" opacity=".68" />
    <Path d="M36 163c28 8 73 9 101 0" stroke={colors.nudgeCupShade} strokeWidth="5" strokeLinecap="round" fill="none" opacity=".7" />
  </Svg>;
}

export function CoffeeSplashArt({ size = 120 }: { size?: number }) {
  return <Svg width={size} height={size} viewBox="0 0 120 120">
    <Path d="M17 77c18-7 24-20 34-25 5-3 7 7 14 7 9 0 14-18 20-20 5-1 5 17 19 19-10 3-22 2-27 13-6 12-19 9-30 4-11-5-19 4-30 2Z" fill={colors.nudgeCoffeeLight} opacity=".9" />
    <Circle cx="26" cy="44" r="5" fill={colors.nudgeCoffee} />
    <Circle cx="96" cy="28" r="4" fill={colors.nudgeCoffeeLight} />
    <Circle cx="72" cy="20" r="3" fill={colors.nudgeCoffee} />
    <Path d="M12 58c8-5 14-3 20 2M90 85c9-4 16-3 21 2" stroke={colors.nudgeCoffeeLight} strokeWidth="5" strokeLinecap="round" fill="none" />
  </Svg>;
}

export function CoffeeRippleArt({ size = 84 }: { size?: number }) {
  return <Svg width={size} height={size * .19} viewBox="0 0 84 16">
    <Path d="M2 8c12-5 20-5 31 0 11 5 20 5 31 0 7-3 13-4 18-2" stroke={colors.nudgeCoffeeLight} strokeWidth="3" strokeLinecap="round" fill="none" opacity=".9" />
    <Path d="M10 13c15-2 26-1 37 1" stroke={colors.nudgeCup} strokeWidth="1.5" strokeLinecap="round" fill="none" opacity=".55" />
  </Svg>;
}

export function RosePetalArt({ size = 27 }: { size?: number }) {
  return <Svg width={size} height={size * 1.28} viewBox="0 0 27 35">
    <Path d="M14 1C4 6 1 17 5 25c2 5 7 8 10 9 5-4 10-11 11-20C26 7 20 3 14 1Z" fill={colors.nudgeRose} />
    <Path d="M14 4c-3 10-2 20 1 27M13 20c-3-2-5-5-7-9M14 23c3-3 6-7 8-13" stroke={colors.nudgeRoseVein} strokeWidth="1" fill="none" opacity=".55" />
    <Path d="M7 13c2-4 4-6 7-8" stroke={colors.nudgeRoseLight} strokeWidth="2" fill="none" opacity=".7" />
  </Svg>;
}

export function CoffeeStainArt({ size = 60 }: { size?: number }) {
  return <Svg width={size} height={size * .83} viewBox="0 0 70 58">
    <Path d="M7 28C3 18 13 12 25 10c12-4 29 0 35 10 5 8 2 20-8 25-12 6-33 5-42-3-5-4-3-8-3-14Z" fill={colors.nudgeCoffee} opacity=".17" />
    <Path d="M9 32c-3 8-4 14-7 17 8-2 10-8 15-7 7 2 10 10 18 9 8-1 12-7 18-5 7 1 10 8 14 7-4-7-3-15-7-20-13 9-37 12-51 0Z" fill={colors.nudgeCoffee} opacity=".2" />
    <Path d="M12 26c1-11 11-18 23-18 13-1 25 6 26 18 2 13-10 22-25 22-14 0-25-8-24-22Z" fill="none" stroke={colors.nudgeCoffee} strokeWidth="3.4" strokeLinecap="round" strokeDasharray="43 3 19 6 18 2" opacity=".62" />
    <Path d="M17 27c0-8 8-14 18-14 11 0 20 6 20 14 0 9-9 16-20 16-10 0-18-7-18-16Z" fill="none" stroke={colors.nudgeCoffeeLight} strokeWidth="2" opacity=".53" />
    <Path d="M12 34c3 6 8 9 14 11 5 2 8 5 5 7-6 2-16-2-21-8-3-4-2-7 2-10ZM51 42c7-3 11-4 13-2 3 3-3 7-9 8-5 1-7-3-4-6Z" fill={colors.nudgeCoffee} opacity=".28" />
    <Path d="M4 48c3-3 7-2 7 1 0 4-7 5-8 2-1-1 0-2 1-3ZM63 3c3-2 6 0 5 3-1 4-7 4-7 1 0-2 1-3 2-4ZM61 49c2-2 5-1 5 2 0 2-4 4-6 2-1-1 0-3 1-4Z" fill={colors.nudgeCoffee} opacity=".46" />
  </Svg>;
}
