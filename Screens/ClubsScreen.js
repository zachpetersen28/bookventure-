import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ScreenHeader from '../components/ScreenHeader';
import { supabase } from '../lib/supabase';
import { COLORS } from '../lib/theme';

export default function ClubsScreen() {
  const router = useRouter();

  const [profile, setProfile] = useState(null);
  const [clubs, setClubs] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(true);


  useFocusEffect(
    useCallback(() => {
      loadProfileAndClubs();
    }, [])
  );

  const loadProfileAndClubs = async () => {
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

    const { data: memberRows, error: memberError } = await supabase
      .from('members')
      .select('club_id, role, current_chapter, streak')
      .eq('name', profileData.display_name);

    if (memberError) {
      setLoading(false);
      Alert.alert('Error loading memberships', memberError.message);
      return;
    }

    const clubIds = (memberRows || []).map((member) => member.club_id);

    if (clubIds.length === 0) {
      setClubs([]);
      setLoading(false);
      return;
    }

    const { data: clubRows, error: clubError } = await supabase
      .from('clubs')
      .select('*')
      .in('id', clubIds)
      .order('created_at', { ascending: false });

    setLoading(false);

    if (clubError) {
      Alert.alert('Error loading clubs', clubError.message);
      return;
    }

    const formattedClubs = (clubRows || []).map((club) => {
      const membership = (memberRows || []).find((member) => member.club_id === club.id);
      const totalChapters = Number(club.total_chapters || 0);
      const currentChapter = Number(membership?.current_chapter || club.current_chapter || 0);
      const percent = totalChapters > 0 ? Math.round((currentChapter / totalChapters) * 100) : 0;

      return {
        id: club.id,
        name: club.name,
        book: club.book,
        bookAuthor: club.book_author,
        bookCoverUrl: club.book_cover_url,
        currentChapter,
        totalChapters,
        groupAverage: club.group_average,
        joinCode: club.join_code,
        role: membership?.role || 'member',
        visibility: club.visibility || 'private',
        firstBookMode: club.first_book_mode,
        votingStartsAt: club.voting_starts_at,
        votingEndsAt: club.voting_ends_at,
        percent,
        streak: Number(membership?.streak || 0),
      };
    });

    setClubs(formattedClubs);
  };

  const getVotingStatus = (club) => {
    if (club.firstBookMode !== 'vote') return null;

    const now = new Date();
    const startsAt = club.votingStartsAt ? new Date(`${club.votingStartsAt}T00:00:00`) : null;
    const endsAt = club.votingEndsAt ? new Date(`${club.votingEndsAt}T23:59:59`) : null;

    if (startsAt && now < startsAt) {
      const days = Math.ceil((startsAt - now) / (1000 * 60 * 60 * 24));
      return `Voting opens in ${days} day${days === 1 ? '' : 's'}`;
    }

    if (startsAt && endsAt && now >= startsAt && now <= endsAt) {
      const days = Math.ceil((endsAt - now) / (1000 * 60 * 60 * 24));
      return `Voting closes in ${days} day${days === 1 ? '' : 's'}`;
    }

    if (endsAt && now > endsAt && (!club.book || club.book === 'Voting not started')) {
      return 'Voting closed';
    }

    return null;
  };

  const openClub = (club) => {
    router.push({
      pathname: '/club',
      params: {
        id: club.id,
        name: club.name,
        book: club.book,
        totalChapters: String(club.totalChapters || 10),
        joinCode: club.role === 'host' ? club.joinCode || '' : '',
      },
    });
  };

  const filteredClubs = useMemo(() => {
    const search = searchText.trim().toLowerCase();

    const sorted = [...clubs].sort((a, b) => {
      const aComplete = a.totalChapters > 0 && a.currentChapter >= a.totalChapters;
      const bComplete = b.totalChapters > 0 && b.currentChapter >= b.totalChapters;

      if (aComplete !== bComplete) return aComplete ? 1 : -1;
      if (a.percent !== b.percent) return b.percent - a.percent;
      return b.streak - a.streak;
    });

    if (!search) return sorted;

    return sorted.filter((club) => {
      return (
        String(club.name || '').toLowerCase().includes(search) ||
        String(club.book || '').toLowerCase().includes(search) ||
        String(club.bookAuthor || '').toLowerCase().includes(search)
      );
    });
  }, [clubs, searchText]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.gold} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.page} edges={['top']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader
          title="Clubs"
          subtitle={`${clubs.length} ${clubs.length === 1 ? 'club' : 'clubs'}`}
        />

        <View style={styles.actionCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.actionTitle}>Start or join an adventure</Text>
            <Text style={styles.actionSubtitle}>
              Create a new club, join a private club, or browse public clubs.
            </Text>
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.joinButton} onPress={() => router.push('/join-club')}>
              <Text style={styles.joinButtonText}>Join</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.createButton} onPress={() => router.push('/create-club')}>
              <Text style={styles.createButtonText}>Create</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TextInput
          value={searchText}
          onChangeText={setSearchText}
          placeholder="Search clubs, books, or authors..."
          placeholderTextColor={COLORS.textMuted}
          style={styles.searchInput}
        />

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>My Clubs</Text>
          <Text style={styles.countPill}>{filteredClubs.length}</Text>
        </View>

        {filteredClubs.length === 0 && (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No clubs found</Text>
            <Text style={styles.emptyText}>
              Create a club or join one with a private code to begin.
            </Text>
          </View>
        )}

        {filteredClubs.map((club) => {
          const isHost = club.role === 'host';
          const votingStatus = getVotingStatus(club);
          const hasBook = club.book && club.book !== 'Voting not started';
          const chapterText = hasBook
            ? `Chapter ${club.currentChapter || 0} of ${club.totalChapters || '?'}`
            : votingStatus || 'Voting not started';

          return (
            <TouchableOpacity
              key={club.id}
              style={styles.clubCard}
              onPress={() => openClub(club)}
              activeOpacity={0.86}
            >
              {club.bookCoverUrl ? (
                <Image source={{ uri: club.bookCoverUrl }} style={styles.clubCover} />
              ) : (
                <View style={styles.clubIcon}>
                  <Text style={styles.clubIconText}>{hasBook ? '📖' : '🗳️'}</Text>
                </View>
              )}

              <View style={styles.clubInfo}>
                <View style={styles.clubTitleRow}>
                  <Text style={styles.clubName} numberOfLines={1}>
                    {club.name}
                  </Text>

                  <View style={styles.badgeRow}>
                    <View style={styles.visibilityBadge}>
                      <Text style={styles.visibilityBadgeText}>
                        {club.visibility === 'public' ? 'PUBLIC' : 'PRIVATE'}
                      </Text>
                    </View>

                    {isHost && (
                      <View style={styles.hostBadge}>
                        <Text style={styles.hostBadgeText}>HOST</Text>
                      </View>
                    )}
                  </View>
                </View>

                <Text style={styles.bookName} numberOfLines={1}>
                  {hasBook ? club.book : 'Book not selected yet'}
                </Text>

                <View style={styles.clubMetaRow}>
                  <Text style={styles.clubMeta}>{chapterText}</Text>
                  {hasBook && <Text style={styles.clubPercent}>{club.percent}%</Text>}
                </View>

                {hasBook && (
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${Math.min(club.percent, 100)}%` }]} />
                  </View>
                )}
              </View>

              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  container: {
    flex: 1,
  },

  content: {
    paddingHorizontal: 18,
    paddingTop: 4,
    paddingBottom: 120,
  },

  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },

  actionCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 22,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },

  actionTitle: {
    color: COLORS.textPrimary,
    fontSize: 17,
    fontWeight: '900',
  },

  actionSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 4,
    lineHeight: 17,
  },

  actionButtons: {
    gap: 8,
    marginLeft: 10,
  },

  joinButton: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.softBorder,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
  },

  joinButtonText: {
    color: COLORS.gold,
    fontWeight: '900',
    textAlign: 'center',
    fontSize: 12,
  },

  createButton: {
    backgroundColor: COLORS.gold,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
  },

  createButtonText: {
    color: COLORS.deepForest,
    fontWeight: '900',
    textAlign: 'center',
    fontSize: 12,
  },

  searchInput: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    paddingVertical: 13,
    paddingHorizontal: 14,
    marginTop: 14,
    color: COLORS.textPrimary,
    fontSize: 15,
  },

  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 22,
    marginBottom: 10,
  },

  sectionTitle: {
    color: COLORS.textPrimary,
    fontSize: 22,
    fontWeight: '900',
  },

  countPill: {
    marginLeft: 8,
    backgroundColor: COLORS.surface,
    color: COLORS.gold,
    fontWeight: '900',
    fontSize: 12,
    paddingHorizontal: 9,
    paddingVertical: 2,
    borderRadius: 999,
    overflow: 'hidden',
  },

  emptyCard: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    padding: 18,
    marginTop: 14,
  },

  emptyTitle: {
    color: COLORS.textPrimary,
    fontWeight: '900',
    textAlign: 'center',
    fontSize: 16,
  },

  emptyText: {
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 19,
    fontSize: 13,
  },

  clubCard: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    padding: 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },

  clubCover: {
    width: 54,
    height: 78,
    borderRadius: 9,
    marginRight: 12,
  },

  clubIcon: {
    width: 54,
    height: 78,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.softBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  clubIconText: {
    fontSize: 25,
  },

  clubInfo: {
    flex: 1,
  },

  clubTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  clubName: {
    flex: 1,
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.textPrimary,
  },

  badgeRow: {
    flexDirection: 'row',
    gap: 5,
  },

  visibilityBadge: {
    backgroundColor: COLORS.surface,
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 7,
    borderWidth: 1,
    borderColor: COLORS.softBorder,
  },

  visibilityBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: COLORS.textMuted,
  },

  hostBadge: {
    backgroundColor: COLORS.gold,
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 7,
  },

  hostBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: COLORS.deepForest,
  },

  bookName: {
    color: COLORS.textSecondary,
    marginTop: 4,
    fontSize: 14,
    fontWeight: '700',
  },

  clubMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 5,
  },

  clubMeta: {
    color: COLORS.gold,
    fontWeight: '900',
    fontSize: 12,
    flex: 1,
  },

  clubPercent: {
    color: COLORS.gold,
    fontWeight: '900',
    fontSize: 12,
    marginLeft: 8,
  },

  progressTrack: {
    height: 6,
    backgroundColor: COLORS.surface,
    borderRadius: 999,
    marginTop: 8,
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    backgroundColor: COLORS.gold,
  },

  chevron: {
    color: COLORS.gold,
    fontSize: 26,
    fontWeight: '900',
    marginLeft: 8,
  },
});
