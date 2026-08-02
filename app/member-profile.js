import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AVATARS } from '../lib/avatars';
import ScreenHeader from '../components/ScreenHeader';
import ThemedBackground from '../components/ThemedBackground';
import { supabase } from '../lib/supabase';
import { useTheme } from '../lib/theme-context';

const NEUTRAL_AVATAR_EMOJI = '👤';

const getAvatarEmoji = (avatarId) => {
  const match = AVATARS.find((avatar) => avatar.id === avatarId);
  return match?.emoji || NEUTRAL_AVATAR_EMOJI;
};

const getStreakEmoji = (streak) => {
  const days = Number(streak || 0);

  if (days >= 100) return '💎';
  if (days >= 51) return '👑';
  if (days >= 21) return '🔥';
  if (days >= 1) return '⚡';
  return '🌱';
};

const formatMemberSince = (createdAt) => {
  if (!createdAt) return '';

  const date = new Date(createdAt);
  return `Member since ${date.toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  })}`;
};

export default function MemberProfileScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);

  const router = useRouter();
  const { id } = useLocalSearchParams();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    loadProfile();
  }, [id]);

  const loadProfile = async () => {
    setLoading(true);
    setNotFound(false);

    if (!id) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    setProfile(data);
    setLoading(false);
  };

  if (loading) {
    return (
      <ThemedBackground>
        <SafeAreaView style={styles.loadingPage}>
          <ActivityIndicator size="large" color={theme.colors.gold} />
        </SafeAreaView>
      </ThemedBackground>
    );
  }

  if (notFound || !profile) {
    return (
      <ThemedBackground>
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView style={styles.page}>
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🔍</Text>
            <Text style={styles.emptyTitle}>Profile not found</Text>
            <Text style={styles.emptyText}>This reader's profile could not be loaded.</Text>

            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Text style={styles.backButtonText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </ThemedBackground>
    );
  }

  const genres = profile.favorite_genres || [];

  return (
    <ThemedBackground>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.page}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.headerWrap}>
            <ScreenHeader
              title={profile.display_name || 'Reader'}
              subtitle={profile.created_at ? formatMemberSince(profile.created_at) : undefined}
              rightAction={
                <TouchableOpacity onPress={() => router.back()}>
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              }
            />
          </View>

          <View style={styles.avatarWrap}>
            <Text style={styles.avatarEmoji}>{getAvatarEmoji(profile.avatar_id)}</Text>
          </View>

          {profile.bio ? (
            <View style={styles.card}>
              <Text style={styles.cardLabel}>BIO</Text>
              <Text style={styles.cardText}>{profile.bio}</Text>
            </View>
          ) : null}

          {profile.favorite_book ? (
            <View style={styles.card}>
              <Text style={styles.cardLabel}>FAVORITE BOOK</Text>
              <Text style={styles.cardText}>{profile.favorite_book}</Text>
            </View>
          ) : null}

          {genres.length > 0 ? (
            <View style={styles.card}>
              <Text style={styles.cardLabel}>FAVORITE GENRES</Text>
              <View style={styles.genreWrap}>
                {genres.map((genre) => (
                  <View key={genre} style={styles.genrePill}>
                    <Text style={styles.genreText}>{genre}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statEmoji}>{getStreakEmoji(profile.current_streak)}</Text>
              <Text style={styles.statNumber}>{Number(profile.current_streak || 0)}</Text>
              <Text style={styles.statLabel}>Current Streak</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statEmoji}>{getStreakEmoji(profile.best_streak)}</Text>
              <Text style={styles.statNumber}>{Number(profile.best_streak || 0)}</Text>
              <Text style={styles.statLabel}>Best Streak</Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedBackground>
  );
}

const getStyles = (theme) =>
  StyleSheet.create({
  page: { flex: 1, backgroundColor: 'transparent' },
  loadingPage: {
    flex: 1,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { padding: 18, paddingBottom: 120, alignItems: 'center' },

  closeButtonText: { color: theme.colors.textSecondary, fontSize: 20, fontWeight: '900' },
  headerWrap: { width: '100%' },

  avatarWrap: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.softBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  avatarEmoji: { fontSize: 52 },

  card: {
    width: '100%',
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 18,
    padding: 14,
    marginTop: 16,
  },
  cardLabel: {
    color: theme.colors.gold,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
  cardText: {
    color: theme.colors.textPrimary,
    marginTop: 8,
    lineHeight: 20,
    fontWeight: '700',
  },

  genreWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  genrePill: {
    backgroundColor: theme.colors.surface,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  genreText: { color: theme.colors.textSecondary, fontWeight: '800', fontSize: 12 },

  statsRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    marginTop: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 18,
    padding: 14,
    alignItems: 'center',
  },
  statEmoji: { fontSize: 22 },
  statNumber: { color: theme.colors.gold, fontSize: 24, fontWeight: '900', marginTop: 4 },
  statLabel: { color: theme.colors.textSecondary, fontSize: 12, fontWeight: '800', marginTop: 4 },

  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyEmoji: { fontSize: 34 },
  emptyTitle: { color: theme.colors.textPrimary, fontSize: 20, fontWeight: '900', marginTop: 10 },
  emptyText: {
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    fontWeight: '700',
  },
  backButton: {
    backgroundColor: theme.colors.gold,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 20,
  },
  backButtonText: { color: theme.colors.onAccent, fontWeight: '900' },
});
