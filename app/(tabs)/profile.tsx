import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AVATARS } from '../../lib/avatars';
import ScreenHeader from '../../components/ScreenHeader';
import { supabase } from '../../lib/supabase';
import { COLORS, FONTS } from '../../lib/theme';

const READER_VIBES: Record<string, string[]> = {
  Fantasy: ['Dragon Hoarder', 'Fantasy Explorer', 'Realm Wanderer', 'Magic Seeker'],
  Romance: ['Slow Burn Romantic', 'Heartfelt Reader', 'Romance Binger'],
  Thriller: ['Plot Twist Addict', 'Suspense Junkie', 'Midnight Thriller Reader'],
  Mystery: ['Mystery Solver', 'Whodunit Expert', 'Clue Collector'],
  'Sci-Fi': ['Space Traveler', 'Future Dreamer', 'Galactic Reader'],
  'Young Adult': ['YA Adventurer', 'Chosen One Enthusiast', 'Dystopian Survivor'],
  'Self-Help': ['Growth Seeker', 'Mindset Master', 'Habit Builder'],
};

export default function ProfileScreen() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [memberships, setMemberships] = useState<any[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [])
  );

  const loadProfile = async () => {
    setLoading(true);

    const { data: userData } = await supabase.auth.getUser();

    if (!userData?.user) {
      setLoading(false);
      router.replace('/login');
      return;
    }

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userData.user.id)
      .single();

    setProfile(profileData);

    const { data: memberData } = await supabase
      .from('members')
      .select('*, clubs (*)')
      .eq('name', profileData?.display_name || '');

    setMemberships(memberData || []);

    setLoading(false);
  };

  const activeClubs = memberships.filter((m) => m.clubs);
  const hostedClubs = activeClubs.filter((m) => m.role === 'host');

  const booksFinished = activeClubs.filter((m) => {
    const total = Number(m.clubs?.total_chapters || 0);

    return (
      total > 0 &&
      Number(m.current_chapter || 0) >= total
    );
  }).length;

  const currentStreak = useMemo(() => {
    if (!memberships.length) return 0;

    return Math.max(
      ...memberships.map((m) =>
        Number(m.streak || 0)
      )
    );
  }, [memberships]);

  const bestStreak = useMemo(() => {
    if (!memberships.length) return 0;

    return Math.max(
      ...memberships.map((m) =>
        Number(
          m.best_streak ||
            m.longest_streak ||
            m.streak ||
            0
        )
      )
    );
  }, [memberships]);

  const memberSince = useMemo(() => {
    if (!profile?.created_at)
      return 'Recently Joined';

    return new Date(
      profile.created_at
    ).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  }, [profile]);

  const readerVibe = useMemo(() => {
    const genres =
      profile?.favorite_genres || [];

    if (!genres.length)
      return 'Page Turner';

    const primary = genres[0];

    const vibes =
      READER_VIBES[primary] || [];

    if (!vibes.length)
      return 'Book Explorer';

    const seed =
      (profile?.display_name?.length ||
        1) % vibes.length;

    return vibes[seed];
  }, [profile]);

  const avatar =
    AVATARS.find(
      (a) => a.id === profile?.avatar_id
    ) || null;

  if (loading) {
    return (
      <SafeAreaView
        style={styles.loadingPage}
        edges={['top']}
      >
        <ActivityIndicator
          size="large"
          color={COLORS.gold}
        />

        <Text style={styles.loadingText}>
          Loading profile...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={styles.page}
      edges={['top']}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={
          styles.content
        }
        showsVerticalScrollIndicator={
          false
        }
      >
        <ScreenHeader
          title="Profile"
          rightAction={
            <TouchableOpacity
              style={styles.settingsButton}
              onPress={() => router.push('/settings')}
            >
              <Text style={styles.settingsIcon}>⚙️</Text>
            </TouchableOpacity>
          }
        />

        <View style={styles.headerCard}>
          <View style={styles.avatar}>
            <Text
              style={styles.avatarText}
            >
              {avatar?.emoji || '📚'}
            </Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.name}>
              {profile?.display_name ||
                'Reader'}
            </Text>

            <Text
              style={styles.readerVibe}
            >
              ✨ {readerVibe}
            </Text>

            <Text
              style={
                styles.avatarTitle
              }
            >
              {avatar?.name ||
                'Book Explorer'}
            </Text>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {booksFinished}
            </Text>

            <Text style={styles.statLabel}>
              Books Finished
            </Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {activeClubs.length}
            </Text>

            <Text style={styles.statLabel}>
              Active Clubs
            </Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              ⚡ {currentStreak}
            </Text>

            <Text style={styles.statLabel}>
              Current Streak
            </Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              🏆 {bestStreak}
            </Text>

            <Text style={styles.statLabel}>
              Best Streak
            </Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {hostedClubs.length}
            </Text>

            <Text style={styles.statLabel}>
              Clubs Hosted
            </Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              📚
            </Text>

            <Text style={styles.statLabel}>
              Since {memberSince}
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>
            READER BIO
          </Text>

          <Text style={styles.bioText}>
            {profile?.bio ||
              'No bio yet.'}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>
            FAVORITE BOOK
          </Text>

          <Text
            style={styles.favoriteBook}
          >
            {profile?.favorite_book ||
              'No favorite book selected yet.'}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>
            FAVORITE GENRES
          </Text>

          <View
            style={styles.genreWrap}
          >
            {(profile?.favorite_genres ||
              []).length === 0 ? (
              <Text
                style={styles.bioText}
              >
                No favorite genres
                selected yet.
              </Text>
            ) : (
              (
                profile?.favorite_genres ||
                []
              ).map(
                (genre: string) => (
                  <View
                    key={genre}
                    style={
                      styles.genrePill
                    }
                  >
                    <Text
                      style={
                        styles.genrePillText
                      }
                    >
                      {genre}
                    </Text>
                  </View>
                )
              )
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor:
      COLORS.background,
  },

  loadingPage: {
    flex: 1,
    backgroundColor:
      COLORS.background,
    justifyContent:
      'center',
    alignItems: 'center',
  },

  loadingText: {
    color:
      COLORS.textSecondary,
    marginTop: 10,
    fontWeight: '800',
  },

  container: {
    flex: 1,
  },

  content: {
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 120,
  },

  settingsButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor:
      COLORS.card,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    alignItems: 'center',
    justifyContent:
      'center',
  },

  settingsIcon: {
    fontSize: 18,
  },

  headerCard: {
    backgroundColor:
      COLORS.card,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    borderRadius: 24,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },

  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor:
      COLORS.gold,
    alignItems: 'center',
    justifyContent:
      'center',
    marginRight: 14,
  },

  avatarText: {
    fontSize: 42,
  },

  avatarTitle: {
    color:
      COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 4,
  },

  name: {
    color:
      COLORS.textPrimary,
    fontSize: 26,
    fontFamily:
      FONTS.title,
  },

  readerVibe: {
    color: COLORS.gold,
    fontWeight: '900',
    marginTop: 4,
  },

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent:
      'space-between',
    marginBottom: 12,
  },

  statCard: {
    width: '48%',
    backgroundColor:
      COLORS.card,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 10,
  },

  statValue: {
    color: COLORS.gold,
    fontSize: 22,
    fontWeight: '900',
  },

  statLabel: {
    color:
      COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '900',
    marginTop: 6,
    textAlign: 'center',
  },

  card: {
    backgroundColor:
      COLORS.card,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    borderRadius: 20,
    padding: 14,
    marginBottom: 12,
  },

  cardLabel: {
    color: COLORS.gold,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 8,
  },

  bioText: {
    color:
      COLORS.textSecondary,
    lineHeight: 20,
    fontWeight: '700',
  },

  favoriteBook: {
    color:
      COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '800',
  },

  genreWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  genrePill: {
    backgroundColor:
      COLORS.gold,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },

  genrePillText: {
    color:
      COLORS.deepForest,
    fontWeight: '900',
    fontSize: 12,
  },
});