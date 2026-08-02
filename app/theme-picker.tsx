import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ScreenHeader from '../components/ScreenHeader';
import ThemedBackground from '../components/ThemedBackground';
import { useTheme } from '../lib/theme-context';
import { Theme } from '../lib/themes';

export default function ThemePickerScreen() {
  const router = useRouter();
  const { theme, themeId, setTheme, themes } = useTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);

  const darkThemes = themes.filter((t) => !t.isLight);
  const lightThemes = themes.filter((t) => t.isLight);

  const renderGrid = (list: Theme[]) => (
    <View style={styles.grid}>
      {list.map((t) => {
        const active = t.id === themeId;

        return (
          <TouchableOpacity
            key={t.id}
            style={[styles.card, active && { borderColor: t.colors.gold, borderWidth: 3 }]}
            activeOpacity={0.85}
            onPress={() => setTheme(t.id)}
          >
            {t.backgroundImage ? (
              <Image source={t.backgroundImage} style={styles.cardImage} contentFit="cover" />
            ) : (
              <View style={styles.swatchGrid}>
                <View style={[styles.swatch, { backgroundColor: t.colors.background }]} />
                <View style={[styles.swatch, { backgroundColor: t.colors.card }]} />
                <View style={[styles.swatch, { backgroundColor: t.colors.gold }]} />
                <View style={[styles.swatch, { backgroundColor: t.colors.textPrimary }]} />
              </View>
            )}

            <View style={styles.cardLabelBar}>
              <Text style={styles.cardLabelText} numberOfLines={1}>{t.name}</Text>
            </View>

            {active && (
              <View style={[styles.checkBadge, { backgroundColor: t.colors.gold }]}>
                <Text style={[styles.checkBadgeText, { color: t.colors.onAccent }]}>✓</Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );

  return (
    <ThemedBackground>
      <SafeAreaView style={styles.page} edges={['top']}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <ScreenHeader title="Appearance" subtitle="Choose your theme" onBack={() => router.back()} />

          <Text style={styles.sectionTitle}>Dark</Text>
          {renderGrid(darkThemes)}

          <Text style={styles.sectionTitle}>Light</Text>
          {renderGrid(lightThemes)}
        </ScrollView>
      </SafeAreaView>
    </ThemedBackground>
  );
}

const getStyles = (theme: Theme) =>
  StyleSheet.create({
    page: { flex: 1, backgroundColor: 'transparent' },
    container: { flex: 1 },
    content: { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 120 },
    sectionTitle: {
      color: theme.colors.textPrimary,
      fontSize: 18,
      fontWeight: '900',
      marginTop: 16,
      marginBottom: 10,
    },
    grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    card: {
      width: '48%',
      height: 150,
      borderRadius: 18,
      overflow: 'hidden',
      backgroundColor: theme.colors.card,
      borderWidth: 2,
      borderColor: theme.colors.border,
      marginBottom: 14,
    },
    cardImage: { ...StyleSheet.absoluteFillObject },
    swatchGrid: { flex: 1, flexDirection: 'row', flexWrap: 'wrap' },
    swatch: { width: '50%', height: '50%' },
    // Fixed white-on-scrim label, not theme-driven — it captions each
    // card's own thumbnail (which varies per theme), not the page chrome.
    cardLabelBar: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      paddingVertical: 8,
      paddingHorizontal: 10,
      backgroundColor: 'rgba(0, 0, 0, 0.45)',
    },
    cardLabelText: { color: '#FFFFFF', fontWeight: '900', fontSize: 13 },
    checkBadge: {
      position: 'absolute',
      top: 8,
      right: 8,
      width: 24,
      height: 24,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkBadgeText: { fontWeight: '900', fontSize: 14 },
  });
