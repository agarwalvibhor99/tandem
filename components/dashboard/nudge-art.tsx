import { Image, type ImageSourcePropType } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';

// Bundled transparent photography keeps these gestures available offline and
// avoids platform-dependent emoji rendering. See assets/nudges/README.md.
const artwork = {
  rose: require('@/assets/nudges/rose.png') as ImageSourcePropType,
  heart: require('@/assets/nudges/heart.png') as ImageSourcePropType,
  cup: require('@/assets/nudges/cup.png') as ImageSourcePropType,
  petal: require('@/assets/nudges/petal.png') as ImageSourcePropType,
  splash: require('@/assets/nudges/splash.png') as ImageSourcePropType,
  stain: require('@/assets/nudges/stain.png') as ImageSourcePropType,
  beerMug: require('@/assets/nudges/beer-mug.png') as ImageSourcePropType,
  beerSplash: require('@/assets/nudges/beer-splash.png') as ImageSourcePropType,
};

function Cutout({ source, width, height, mirrored = false }: { source: ImageSourcePropType; width: number; height: number; mirrored?: boolean }) {
  return <Image source={source} resizeMode="contain" accessible={false} fadeDuration={0}
    style={{ width, height, transform: [{ scaleX: mirrored ? -1 : 1 }] }} />;
}

export function RoseArt({ size = 240 }: { size?: number }) {
  return <Cutout source={artwork.rose} width={size} height={size * 1.33} />;
}

export function HeartArt({ size = 220 }: { size?: number }) {
  return <Cutout source={artwork.heart} width={size} height={size * .914} />;
}

export function CoffeeCupArt({ size = 146, mirrored = false }: { size?: number; mirrored?: boolean }) {
  return <Cutout source={artwork.cup} width={size} height={size} mirrored={mirrored} />;
}

export function CoffeeSplashArt({ size = 120 }: { size?: number }) {
  return <Cutout source={artwork.splash} width={size} height={size * 2 / 3} />;
}

export function RosePetalArt({ size = 27 }: { size?: number }) {
  return <Cutout source={artwork.petal} width={size} height={size * .75} />;
}

export function CoffeeStainArt({ size = 60 }: { size?: number }) {
  return <Cutout source={artwork.stain} width={size} height={size * 2 / 3} />;
}

export function BeerMugArt({ size = 146, mirrored = false }: { size?: number; mirrored?: boolean }) {
  return <Cutout source={artwork.beerMug} width={size} height={size * 1.16} mirrored={mirrored} />;
}

export function BeerSplashArt({ size = 130 }: { size?: number }) {
  return <Cutout source={artwork.beerSplash} width={size} height={size * .54} />;
}

// Fine reflected wavelets sit over the photographic coffee, disappearing as
// the slosh settles. Transparent strokes preserve the real liquid underneath.
export function CoffeeRippleArt({ size = 84 }: { size?: number }) {
  return <Svg width={size} height={size * .38} viewBox="0 0 100 38">
    <Defs><LinearGradient id="crema" x1="0" y1="0" x2="1" y2="0">
      <Stop offset="0" stopColor="#C48A48" stopOpacity="0" />
      <Stop offset=".3" stopColor="#E2B66F" stopOpacity=".6" />
      <Stop offset=".55" stopColor="#FFF1D5" stopOpacity=".8" />
      <Stop offset="1" stopColor="#BA7D3E" stopOpacity="0" />
    </LinearGradient></Defs>
    <Path d="M5 19C22 4 68 3 94 17M13 25C33 14 66 13 87 23" fill="none" stroke="url(#crema)" strokeWidth="1.2" />
    <Path d="M25 30C39 24 63 23 77 28" fill="none" stroke="url(#crema)" strokeWidth=".65" />
  </Svg>;
}
