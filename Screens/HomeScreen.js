import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import {
  useCallback,
  useMemo,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ThemedBackground from '../components/ThemedBackground';
import { supabase } from '../lib/supabase';
import { FONTS } from '../lib/theme';
import { useTheme } from '../lib/theme-context';

const SCREEN_WIDTH = Dimensions.get('window').width;
const FEATURED_CARD_WIDTH = SCREEN_WIDTH - 36;

export default function HomeScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);

  const [profile, setProfile] = useState(null);
  const [clubs, setClubs] = useState([]);
  const [memberships, setMemberships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [markingRead, setMarkingRead] = useState(false);

  useFocusEffect(
  useCallback(() => {
    loadDashboard();
  }, [])
);

  const getTodayString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  };

  const getStreakEmoji = (streak) => {
    const days = Number(streak || 0);

    if (days >= 100) return '💎';
    if (days >= 51) return '👑';
    if (days >= 21) return '🔥';
    if (days >= 1) return '⚡';
    return '🌱';
  };

  const loadDashboard = async () => {
    setLoading(true);

    const { data: userData } = await supabase.auth.getUser();

    if (!userData?.user) {
      router.replace('/login');
      return;
    }

    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userData.user.id)
      .single();

    if (profileError) {
      setLoading(false);
      Alert.alert('Profile error', profileError.message);
      return;
    }

    setProfile(profileData);

    const { data: memberData, error: memberError } = await supabase
      .from('members')
      .select('*')
      .ilike('name', profileData.display_name);

    if (memberError) {
      setLoading(false);
      Alert.alert('Member error', memberError.message);
      return;
    }

    const loadedMemberships = memberData || [];
    setMemberships(loadedMemberships);

    if (loadedMemberships.length === 0) {
      setClubs([]);
      setLoading(false);
      return;
    }

    const clubIds = loadedMemberships.map((member) => member.club_id);

    const { data: clubData, error: clubError } = await supabase
      .from('clubs')
      .select('*')
      .in('id', clubIds)
      .order('created_at', { ascending: false });

    if (clubError) {
      setLoading(false);
      Alert.alert('Club error', clubError.message);
      return;
    }

    setClubs(clubData || []);

    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboard();
    setRefreshing(false);
  };

  const getMembershipForClub = (clubId) => {
    return memberships.find((member) => member.club_id === clubId);
  };

  const hasReadToday = useMemo(() => {
    const today = getTodayString();
    return profile?.last_read_date === today;
  }, [profile]);

  const currentStreak = useMemo(() => {
    return Number(profile?.current_streak || 0);
  }, [profile]);

  const bestStreak = useMemo(() => {
    return Number(profile?.best_streak || 0);
  }, [profile]);

  const totalChaptersRead = useMemo(() => {
    return memberships.reduce(
      (sum, member) => sum + Number(member.current_chapter || 0),
      0
    );
  }, [memberships]);

  const markReadToday = async () => {
    if (!profile) {
      Alert.alert('Profile missing', 'Please log in again.');
      return;
    }

    if (hasReadToday) return;

    const today = getTodayString();
    setMarkingRead(true);

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const year = yesterday.getFullYear();
    const month = String(yesterday.getMonth() + 1).padStart(2, '0');
    const day = String(yesterday.getDate()).padStart(2, '0');
    const yesterdayString = `${year}-${month}-${day}`;

    const continuingStreak = profile.last_read_date === yesterdayString;
    const newStreak = continuingStreak ? Number(profile.current_streak || 0) + 1 : 1;
    const newBestStreak = Math.max(newStreak, Number(profile.best_streak || 0));

    const { error } = await supabase
      .from('profiles')
      .update({
        current_streak: newStreak,
        best_streak: newBestStreak,
        last_read_date: today,
      })
      .eq('id', profile.id);

    setMarkingRead(false);

    if (error) {
      Alert.alert('Streak error', error.message);
      return;
    }

    await loadDashboard();
  };

  const currentlyReadingClubs = useMemo(() => {
    return clubs
      .map((club) => {
        const membership = getMembershipForClub(club.id);
        const totalChapters = Number(club.total_chapters || 0);
        const currentChapter = Number(membership?.current_chapter || 0);
        const percent = totalChapters > 0 ? Math.round((currentChapter / totalChapters) * 100) : 0;
        const isActiveReading = totalChapters > 0 && currentChapter < totalChapters;
        const isComplete = totalChapters > 0 && currentChapter >= totalChapters;
        const isVoting = !club.book || club.book === 'Voting not started';

        return {
          ...club,
          membership,
          currentChapter,
          totalChapters,
          percent,
          isActiveReading,
          isComplete,
          isVoting,
        };
      })
      .sort((a, b) => {
        if (a.isComplete !== b.isComplete) return a.isComplete ? 1 : -1;
        if (a.isActiveReading !== b.isActiveReading) return a.isActiveReading ? -1 : 1;
        if (a.isVoting !== b.isVoting) return a.isVoting ? 1 : -1;
        if (b.currentChapter !== a.currentChapter) return b.currentChapter - a.currentChapter;
        return Number(b.membership?.streak || 0) - Number(a.membership?.streak || 0);
      });
  }, [clubs, memberships]);

  const featuredClubs = useMemo(() => {
    return currentlyReadingClubs;
  }, [currentlyReadingClubs]);

  const dashboardStats = useMemo(() => {
    return {
      totalChaptersRead,
      bestStreak,
    };
  }, [totalChaptersRead, bestStreak]);

  const getVotingStatus = (club) => {
    if (club.first_book_mode !== 'vote') return null;

    const now = new Date();
    const startsAt = club.voting_starts_at
      ? new Date(club.voting_starts_at + 'T00:00:00')
      : null;
    const endsAt = club.voting_ends_at
      ? new Date(club.voting_ends_at + 'T23:59:59')
      : null;

    if (startsAt && now < startsAt) {
      const days = Math.ceil((startsAt - now) / (1000 * 60 * 60 * 24));
      return `Voting opens in ${days} day${days === 1 ? '' : 's'}`;
    }

    if (startsAt && endsAt && now >= startsAt && now <= endsAt) {
      const days = Math.ceil((endsAt - now) / (1000 * 60 * 60 * 24));
      return `Voting closes in ${days} day${days === 1 ? '' : 's'}`;
    }

    if (endsAt && now > endsAt) {
      return 'Voting closed — host can start the book';
    }

    return null;
  };

  const todayActions = useMemo(() => {
    const actions = [];

    clubs.forEach((club) => {
      const membership = getMembershipForClub(club.id);
      const totalChapters = Number(club.total_chapters || 0);
      const currentChapter = Number(membership?.current_chapter || 0);
      const votingStatus = getVotingStatus(club);

      if (votingStatus) {
        actions.push({
          id: `vote-${club.id}`,
          title: votingStatus,
          subtitle: club.name,
          type: 'vote',
          club,
        });
      }

      if (totalChapters > 0 && currentChapter < totalChapters) {
        actions.push({
          id: `chapter-${club.id}`,
          title: `Read Chapter ${currentChapter + 1}`,
          subtitle: `${club.name} • ${club.book || 'Current book'}`,
          type: 'chapter',
          club,
        });
      }

      if (!votingStatus && !(totalChapters > 0 && currentChapter < totalChapters)) {
        actions.push({
          id: `open-${club.id}`,
          title: 'Open Club',
          subtitle: club.name,
          type: 'open',
          club,
        });
      }
    });

    return actions.slice(0, 4);
  }, [clubs, memberships]);

  const openClub = (club) => {
    router.push({
      pathname: '/club',
      params: {
        id: club.id,
        name: club.name,
        book: club.book,
        totalChapters: String(club.total_chapters || 10),
        joinCode: club.join_code || '',
      },
    });
  };

  if (loading) {
    return (
      <ThemedBackground>
        <SafeAreaView style={styles.loadingPage} edges={['top']}>
          <ActivityIndicator size="large" color={theme.colors.gold} />
          <Text style={styles.loadingText}>Loading your dashboard...</Text>
        </SafeAreaView>
      </ThemedBackground>
    );
  }

  return (
    <ThemedBackground>
    <SafeAreaView style={styles.page} edges={['top']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.gold} />
        }
      >
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.brandTitle} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
              Bookventure
            </Text>
            <Text style={styles.welcomeText}>Welcome back, {profile?.display_name || 'Reader'}</Text>
          </View>

          <Image
            source={require('../assets/bookventure-logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <View style={styles.readTodayCard}>
          <View style={styles.readTodayTopRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardLabel}>TODAY’S READING</Text>
              <Text style={styles.readTodayTitle}>Did you read today?</Text>
            </View>

            <View style={styles.streakBadge}>
              <View style={styles.streakInlineRow}>
                <Text style={styles.streakEmoji}>{getStreakEmoji(currentStreak)}</Text>
                <Text style={styles.streakNumber}>{currentStreak}</Text>
              </View>
              <Text style={styles.streakLabel}>DAY STREAK</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.readTodayButton, hasReadToday && styles.readTodayButtonDone]}
            onPress={markReadToday}
            disabled={markingRead}
          >
            <Text style={[styles.readTodayButtonText, hasReadToday && styles.readTodayButtonDoneText]}>
              {markingRead ? 'Updating...' : 'I Read Today'}
            </Text>
            {hasReadToday && <Text style={styles.checkIcon}>✓</Text>}
          </TouchableOpacity>
        </View>

        {featuredClubs.length > 0 ? (
          <>
            <View style={styles.sectionHeaderRowTight}>
              <Text style={styles.sectionTitle}>Currently Reading</Text>
              <Text style={styles.countPill}>{featuredClubs.length}</Text>
            </View>

            <ScrollView
              horizontal
              pagingEnabled
              snapToInterval={FEATURED_CARD_WIDTH}
              decelerationRate="fast"
              showsHorizontalScrollIndicator={false}
              style={styles.currentlyReadingScroller}
              contentContainerStyle={styles.currentlyReadingContent}
            >
              {featuredClubs.map((club) => (
                <TouchableOpacity
                  key={club.id}
                  style={styles.heroCardHorizontal}
                  onPress={() => openClub(club)}
                  activeOpacity={0.86}
                >
                  <View style={styles.heroTopRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cardLabel}>{club.name}</Text>
                      <Text style={styles.heroTitle} numberOfLines={2}>
                        {club.book || 'Voting not started'}
                      </Text>
                      <Text style={styles.heroSubtitle} numberOfLines={1}>
                        Chapter {club.currentChapter} of {club.totalChapters || '?'}
                      </Text>
                    </View>

                    {club.book_cover_url ? (
                      <Image source={{ uri: club.book_cover_url }} style={styles.bookCover} />
                    ) : (
                      <View style={styles.bookCoverPlaceholder}>
                        <Text style={styles.bookCoverText}>📖</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.progressInfoRow}>
                    <Text style={styles.progressText}>Progress</Text>
                    <Text style={styles.progressPercent}>{club.percent}%</Text>
                  </View>

                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${Math.min(club.percent, 100)}%` }]} />
                  </View>

                  <View style={styles.continueButton}>
                    <Text style={styles.continueButtonText}>Continue</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        ) : (
          <View style={styles.emptyHero}>
            <Text style={styles.emptyEmoji}>📚</Text>
            <Text style={styles.emptyTitle}>No clubs yet</Text>
            <Text style={styles.emptyText}>
              Head to the Clubs tab to create or join your first book club.
            </Text>
          </View>
        )}

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>My Activity</Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{clubs.length}</Text>
            <Text style={styles.statLabel}>{clubs.length === 1 ? 'Club' : 'Clubs'}</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{dashboardStats.totalChaptersRead}</Text>
            <Text style={styles.statLabel}>Chapters Read</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statStreakRow}>
              <Text style={styles.statEmoji}>{getStreakEmoji(dashboardStats.bestStreak)}</Text>
              <Text style={styles.statNumberSmall}>{dashboardStats.bestStreak}</Text>
            </View>
            <Text style={styles.statLabel}>Best Streak</Text>
          </View>
        </View>

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Actions</Text>
          <Text style={styles.countPill}>{todayActions.length}</Text>
        </View>

        {todayActions.length === 0 ? (
          <View style={styles.card}>
            <Text style={styles.emptyText}>No urgent actions right now.</Text>
          </View>
        ) : (
          todayActions.map((action) => (
            <TouchableOpacity
              key={action.id}
              style={styles.actionCard}
              onPress={() => openClub(action.club)}
            >
              <View style={styles.actionIcon}>
                <Text style={styles.actionIconText}>
                  {action.type === 'vote' ? '🗳️' : action.type === 'chapter' ? '📖' : '📚'}
                </Text>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.actionTitle}>{action.title}</Text>
                <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
              </View>

              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          ))
        )}

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Active Clubs</Text>
          <Text style={styles.countPill}>{clubs.length}</Text>
        </View>

        {clubs.map((club) => {
          const membership = getMembershipForClub(club.id);
          const currentChapter = Number(membership?.current_chapter || 0);
          const totalChapters = Number(club.total_chapters || 0);
          const percent = totalChapters > 0 ? Math.round((currentChapter / totalChapters) * 100) : 0;
          const votingStatus = getVotingStatus(club);

          return (
            <TouchableOpacity key={club.id} style={styles.clubCard} onPress={() => openClub(club)}>
              {club.book_cover_url ? (
                <Image source={{ uri: club.book_cover_url }} style={styles.smallCover} />
              ) : (
                <View style={styles.smallCoverPlaceholder}>
                  <Text style={styles.smallCoverText}>📖</Text>
                </View>
              )}

              <View style={{ flex: 1 }}>
                <Text style={styles.clubName}>{club.name}</Text>
                <Text style={styles.clubBook} numberOfLines={1}>
                  {club.book || 'Voting not started'}
                </Text>
                <Text style={styles.clubMeta}>
                  {votingStatus || `Chapter ${currentChapter} of ${totalChapters || '?'}`}
                </Text>
              </View>

              <Text style={styles.clubPercent}>{totalChapters > 0 ? `${percent}%` : 'Vote'}</Text>
            </TouchableOpacity>
          );
        })}
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
    loadingText: { color: theme.colors.textSecondary, marginTop: 12, fontWeight: '800' },
    container: { flex: 1 },
    content: { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 120 },

    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
    },

    brandTitle: {
      color: theme.colors.textPrimary,
      fontSize: 34,
      fontFamily: FONTS.title,
      marginTop: 2,
      maxWidth: SCREEN_WIDTH - 104,
    },

    welcomeText: {
      color: theme.colors.textSecondary,
      fontSize: 15,
      fontWeight: '800',
      marginTop: 1,
    },

    logo: {
      width: 150,
      height: 150,
      marginLeft: 8,
    },

    readTodayCard: {
      backgroundColor: theme.colors.card,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 24,
      padding: 16,
      marginBottom: 16,
    },

    readTodayTopRow: { flexDirection: 'row', alignItems: 'center' },
    cardLabel: { color: theme.colors.gold, fontSize: 11, fontWeight: '900', letterSpacing: 1 },
    readTodayTitle: { color: theme.colors.textPrimary, fontSize: 21, fontWeight: '900', marginTop: 5 },

    streakBadge: {
      width: 92,
      height: 92,
      borderRadius: 46,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.softBorder,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: 12,
    },

    streakInlineRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 1,
    },
    streakEmoji: { fontSize: 22, marginRight: 5 },
    streakNumber: { color: theme.colors.gold, fontSize: 28, fontWeight: '900' },
    streakLabel: { color: theme.colors.textSecondary, fontSize: 8, fontWeight: '900', letterSpacing: 0.5 },

    readTodayButton: {
      backgroundColor: theme.colors.gold,
      borderRadius: 16,
      paddingVertical: 13,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      marginTop: 15,
    },

    readTodayButtonDone: {
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.gold,
    },

    readTodayButtonText: { color: theme.colors.onAccent, fontWeight: '900' },
    readTodayButtonDoneText: { color: theme.colors.gold },
    checkIcon: { color: theme.colors.gold, fontWeight: '900', fontSize: 17, marginLeft: 8 },

    sectionHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 22,
      marginBottom: 10,
    },

    sectionHeaderRowTight: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 2,
      marginBottom: 10,
    },

    sectionTitle: { color: theme.colors.textPrimary, fontSize: 22, fontWeight: '900' },
    countPill: {
      marginLeft: 8,
      backgroundColor: theme.colors.surface,
      color: theme.colors.gold,
      fontWeight: '900',
      fontSize: 12,
      paddingHorizontal: 9,
      paddingVertical: 2,
      borderRadius: 999,
      overflow: 'hidden',
    },

    statsGrid: { flexDirection: 'row', gap: 10 },
    statCard: {
      flex: 1,
      backgroundColor: theme.colors.card,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 18,
      padding: 14,
      alignItems: 'center',
      minHeight: 92,
      justifyContent: 'center',
    },
    statNumber: { color: theme.colors.gold, fontSize: 25, fontWeight: '900' },
    statNumberSmall: { color: theme.colors.gold, fontSize: 22, fontWeight: '900' },
    statStreakRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    statEmoji: { fontSize: 20, marginRight: 5 },
    statLabel: {
      color: theme.colors.textSecondary,
      fontSize: 12,
      fontWeight: '800',
      marginTop: 4,
      textAlign: 'center',
    },

    emptyHero: {
      backgroundColor: theme.colors.card,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 24,
      padding: 22,
      alignItems: 'center',
      marginBottom: 4,
    },
    emptyEmoji: { fontSize: 34 },
    emptyTitle: { color: theme.colors.textPrimary, fontSize: 20, fontWeight: '900', marginTop: 8 },
    emptyText: {
      color: theme.colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
      marginTop: 5,
      fontWeight: '700',
    },

    currentlyReadingScroller: {
      width: FEATURED_CARD_WIDTH,
      marginBottom: 2,
      overflow: 'hidden',
    },
    currentlyReadingContent: {
      paddingRight: 0,
    },

    heroCardHorizontal: {
      width: FEATURED_CARD_WIDTH,
      backgroundColor: theme.colors.card,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 26,
      padding: 16,
      marginRight: 0,
      marginBottom: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.14,
      shadowRadius: 18,
      elevation: 4,
    },

    heroTopRow: { flexDirection: 'row' },
    heroTitle: {
      color: theme.colors.textPrimary,
      fontSize: 20,
      fontWeight: '900',
      marginTop: 6,
      lineHeight: 27,
    },
    heroSubtitle: { color: theme.colors.textSecondary, fontWeight: '800', marginTop: 6 },
    bookCover: { width: 64, height: 94, borderRadius: 11, marginLeft: 12 },
    bookCoverPlaceholder: {
      width: 64,
      height: 94,
      borderRadius: 12,
      marginLeft: 14,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.softBorder,
      alignItems: 'center',
      justifyContent: 'center',
    },
    bookCoverText: { fontSize: 30 },

    progressInfoRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 14 },
    progressText: { color: theme.colors.textSecondary, fontWeight: '800' },
    progressPercent: { color: theme.colors.gold, fontWeight: '900' },
    progressTrack: {
      height: 9,
      backgroundColor: theme.colors.surface,
      borderRadius: 999,
      marginTop: 8,
      overflow: 'hidden',
    },
    progressFill: { height: '100%', backgroundColor: theme.colors.gold },
    continueButton: {
      backgroundColor: theme.colors.gold,
      borderRadius: 16,
      paddingVertical: 10,
      alignItems: 'center',
      marginTop: 12,
    },
    continueButtonText: { color: theme.colors.onAccent, fontWeight: '900' },

    card: {
      backgroundColor: theme.colors.card,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 18,
      padding: 14,
    },

    actionCard: {
      backgroundColor: theme.colors.card,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 18,
      padding: 13,
      marginBottom: 10,
      flexDirection: 'row',
      alignItems: 'center',
    },
    actionIcon: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: theme.colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 11,
    },
    actionIconText: { fontSize: 20 },
    actionTitle: { color: theme.colors.textPrimary, fontWeight: '900', fontSize: 15 },
    actionSubtitle: {
      color: theme.colors.textSecondary,
      marginTop: 3,
      fontSize: 12,
      fontWeight: '700',
    },
    chevron: { color: theme.colors.gold, fontSize: 28, fontWeight: '900', marginLeft: 8 },

    clubCard: {
      backgroundColor: theme.colors.card,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 18,
      padding: 12,
      marginBottom: 10,
      flexDirection: 'row',
      alignItems: 'center',
    },
    smallCover: { width: 52, height: 76, borderRadius: 9, marginRight: 12 },
    smallCoverPlaceholder: {
      width: 52,
      height: 76,
      borderRadius: 9,
      marginRight: 12,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.softBorder,
      alignItems: 'center',
      justifyContent: 'center',
    },
    smallCoverText: { fontSize: 22 },
    clubName: { color: theme.colors.textPrimary, fontWeight: '900', fontSize: 16 },
    clubBook: { color: theme.colors.textSecondary, marginTop: 4, fontWeight: '700' },
    clubMeta: { color: theme.colors.gold, marginTop: 5, fontSize: 12, fontWeight: '800' },
    clubPercent: { color: theme.colors.gold, fontWeight: '900', marginLeft: 10 },
  });