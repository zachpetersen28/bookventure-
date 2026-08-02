import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../lib/theme-context';

const HEADER_SCRIM_HEIGHT = 160;
const FULL_WASH_OPACITY = 0.32;
const HEADER_SCRIM_OPACITY = 0.85;

function hexToRgba(hex: string, alpha: number) {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

type ThemedBackgroundProps = {
  children: ReactNode;
};

// Full-bleed background for a screen: paints the theme's background color,
// and — for art-backed themes — layers the theme's illustration behind the
// content with a scrim so text stays legible. Palette-only themes
// (backgroundImage: null) render as a flat color with no extra layers.
export default function ThemedBackground({ children }: ThemedBackgroundProps) {
  const { theme } = useTheme();

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      {theme.backgroundImage ? (
        <>
          <Image
            source={theme.backgroundImage}
            style={styles.imageLayer}
            contentFit="cover"
            pointerEvents="none"
          />

          {/* Subtle full-screen wash so cards/text stay legible over busy art. */}
          <View
            pointerEvents="none"
            style={[
              styles.imageLayer,
              { backgroundColor: theme.colors.background, opacity: FULL_WASH_OPACITY },
            ]}
          />

          {/* Stronger scrim behind the header band so titles never fight bright art. */}
          <LinearGradient
            pointerEvents="none"
            colors={[
              hexToRgba(theme.colors.background, HEADER_SCRIM_OPACITY),
              hexToRgba(theme.colors.background, 0),
            ]}
            style={styles.headerScrim}
          />
        </>
      ) : null}

      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  imageLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  headerScrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: HEADER_SCRIM_HEIGHT,
  },
  content: {
    flex: 1,
  },
});
