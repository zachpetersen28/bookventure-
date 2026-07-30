import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { COLORS, FONTS } from '../lib/theme';

export default function JoinClubScreen() {
  const router = useRouter();

  const [profile, setProfile] = useState(null);
  const [clubs, setClubs] = useState([]);
  const [memberships, setMemberships] = useState([]);
  const [memberCounts, setMemberCounts] = useState({});
  const [searchText, setSearchText] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [selectedPrivateClub, setSelectedPrivateClub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joiningClubId, setJoiningClubId] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
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

    const { data: clubRows, error: clubError } = await supabase
      .from('clubs')
      .select('*')
      .order('created_at', { ascending: false });

    if (clubError) {
      setLoading(false);
      Alert.alert('Club error', clubError.message);
      return;
    }

    const { data: memberRows, error: memberError } = await supabase
      .from('members')
      .select('*');

    if (memberError) {
      setLoading(false);
      Alert.alert('Member error', memberError.message);
      return;
    }

    const myMemberships = (memberRows || []).filter(
      (member) =>
        String(member.name || '').trim().toLowerCase() ===
        String(profileData.display_name || '').trim().toLowerCase()
    );

    const counts = {};
    (memberRows || []).forEach((member) => {
      counts[member.club_id] = (counts[member.club_id] || 0) + 1;
    });

    setClubs(clubRows || []);
    setMemberships(myMemberships);
    setMemberCounts(counts);
    setLoading(false);
  };

  const getVotingStatus = (club) => {
    if (club.first_book_mode !== 'vote') return null;

    const now = new Date();
    const startsAt = club.voting_starts_at ? new Date(`${club.voting_starts_at}T00:00:00`) : null;
    const endsAt = club.voting_ends_at ? new Date(`${club.voting_ends_at}T23:59:59`) : null;

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

  const isAlreadyJoined = (club) => {
    return memberships.some((member) => member.club_id === club.id);
  };

  const getClubState = (club) => {
    const currentCount = memberCounts[club.id] || 0;
    const maxMembers = Number(club.max_members || 0);
    const full = maxMembers > 0 && currentCount >= maxMembers;
    const joined = isAlreadyJoined(club);
    const locked = Boolean(club.voting_locked);

    if (joined) return { label: 'Joined', disabled: true, reason: 'already joined' };
    if (locked) return { label: 'Locked', disabled: true, reason: 'locked' };
    if (full) return { label: 'Full', disabled: true, reason: 'full' };
    if (club.visibility === 'private') return { label: 'Enter Code', disabled: false, reason: 'private' };
    return { label: 'Join', disabled: false, reason: 'public' };
  };

  const filteredClubs = useMemo(() => {
    const search = searchText.trim().toLowerCase();

    const sorted = [...clubs].sort((a, b) => {
      const aJoined = isAlreadyJoined(a);
      const bJoined = isAlreadyJoined(b);
      const aCount = memberCounts[a.id] || 0;
      const bCount = memberCounts[b.id] || 0;

      if (aJoined !== bJoined) return aJoined ? 1 : -1;
      if (a.visibility !== b.visibility) return a.visibility === 'public' ? -1 : 1;
      return bCount - aCount;
    });

    if (!search) return sorted;

    return sorted.filter((club) => {
      return (
        String(club.name || '').toLowerCase().includes(search) ||
        String(club.book || '').toLowerCase().includes(search) ||
        String(club.book_author || '').toLowerCase().includes(search)
      );
    });
  }, [clubs, memberships, memberCounts, searchText]);

  const joinClub = async (club, codeOverride = null) => {
    if (!profile) {
      Alert.alert('Profile missing', 'Please log in again.');
      return;
    }

    if (isAlreadyJoined(club)) {
      Alert.alert('Already joined', 'You are already a member of this club.');
      return;
    }

    const currentCount = memberCounts[club.id] || 0;
    const maxMembers = Number(club.max_members || 0);

    if (maxMembers > 0 && currentCount >= maxMembers) {
      Alert.alert('Club full', 'This club has reached its member limit.');
      return;
    }

    if (club.voting_locked) {
      Alert.alert('Joining locked', 'This club is no longer accepting members.');
      return;
    }

    if (club.visibility === 'private') {
      const cleanCode = String(codeOverride || '').trim().toUpperCase();
      const expectedCode = String(club.join_code || '').trim().toUpperCase();

      if (!cleanCode) {
        setSelectedPrivateClub(club);
        setInviteCode('');
        return;
      }

      if (cleanCode !== expectedCode) {
        Alert.alert('Incorrect code', 'Check the invite code and try again.');
        return;
      }
    }

    setJoiningClubId(club.id);

    const { error } = await supabase.from('members').insert([
      {
        club_id: club.id,
        name: profile.display_name,
        role: 'member',
        current_chapter: 0,
        streak: 0,
      },
    ]);

    setJoiningClubId(null);

    if (error) {
      Alert.alert('Join error', error.message);
      return;
    }

    setSelectedPrivateClub(null);
    setInviteCode('');
    Alert.alert('Joined', `You joined ${club.name}.`);
    await loadData();
  };

  const submitPrivateCode = async () => {
    if (!selectedPrivateClub) return;
    await joinClub(selectedPrivateClub, inviteCode);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingPage} edges={['top']}>
        <ActivityIndicator size="large" color={COLORS.gold} />
        <Text style={styles.loadingText}>Loading clubs...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.page} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Find Clubs</Text>
              
            </View>

            <Image
              source={require('../assets/bookventure-logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          <View style={styles.searchOnlyWrap}>
            <TextInput
              value={searchText}
              onChangeText={setSearchText}
              placeholder="Search clubs, books, or authors..."
              placeholderTextColor={COLORS.textMuted}
              style={styles.input}
            />
          </View>

          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Available Clubs</Text>
            <Text style={styles.countPill}>{filteredClubs.length}</Text>
          </View>

          {filteredClubs.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No clubs found</Text>
              <Text style={styles.emptyText}>Try a different search or create a new club.</Text>
            </View>
          ) : (
            filteredClubs.map((club) => {
              const currentCount = memberCounts[club.id] || 0;
              const maxMembers = Number(club.max_members || 0);
              const state = getClubState(club);
              const votingStatus = getVotingStatus(club);
              const hasBook = club.book && club.book !== 'Voting not started';
              const isPrivate = club.visibility === 'private';
              const loadingThisClub = joiningClubId === club.id;

              return (
                <View key={club.id} style={styles.clubCard}>
                  {club.book_cover_url ? (
                    <Image source={{ uri: club.book_cover_url }} style={styles.cover} />
                  ) : (
                    <View style={styles.coverPlaceholder}>
                      <Text style={styles.coverText}>{hasBook ? '📖' : '🗳️'}</Text>
                    </View>
                  )}

                  <View style={{ flex: 1 }}>
                    <View style={styles.clubTopRow}>
                      <Text style={styles.clubName} numberOfLines={1}>{club.name}</Text>

                      <View style={[styles.typeBadge, isPrivate && styles.privateBadge]}>
                        <Text style={[styles.typeBadgeText, isPrivate && styles.privateBadgeText]}>
                          {isPrivate ? 'PRIVATE' : 'PUBLIC'}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.clubBook} numberOfLines={1}>
                      {hasBook ? club.book : 'Voting not started'}
                    </Text>

                    <View style={styles.clubMetaRow}>
                      <Text style={styles.clubMeta}>
                        {currentCount}/{maxMembers || '∞'} members
                      </Text>
                      {votingStatus && <Text style={styles.voteMeta} numberOfLines={1}>{votingStatus}</Text>}
                    </View>

                    <TouchableOpacity
                      style={[styles.joinButton, state.disabled && styles.joinButtonDisabled]}
                      onPress={() => joinClub(club)}
                      disabled={state.disabled || loadingThisClub}
                    >
                      {loadingThisClub ? (
                        <ActivityIndicator color={COLORS.deepForest} />
                      ) : (
                        <Text style={[styles.joinButtonText, state.disabled && styles.joinButtonTextDisabled]}>
                          {state.label}
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>

        <Modal
          visible={Boolean(selectedPrivateClub)}
          transparent
          animationType="slide"
          onRequestClose={() => setSelectedPrivateClub(null)}
        >
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.modalKeyboardView}
            >
              <View style={styles.codePanel}>
                <View style={styles.codePanelHeader}>
                  <View>
                    <Text style={styles.cardLabel}>PRIVATE CLUB</Text>
                    <Text style={styles.codePanelTitle}>Enter invite code</Text>
                  </View>

                  <TouchableOpacity onPress={() => setSelectedPrivateClub(null)}>
                    <Text style={styles.closeText}>✕</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.codePanelText}>
                  Enter the invite code for {selectedPrivateClub?.name}.
                </Text>

                <TextInput
                  value={inviteCode}
                  onChangeText={setInviteCode}
                  placeholder="Example: A1B2C3"
                  autoCapitalize="characters"
                  placeholderTextColor={COLORS.textMuted}
                  style={styles.codeInput}
                />

                <TouchableOpacity
                  style={styles.codeButton}
                  onPress={submitPrivateCode}
                  disabled={joiningClubId === selectedPrivateClub?.id}
                >
                  {joiningClubId === selectedPrivateClub?.id ? (
                    <ActivityIndicator color={COLORS.deepForest} />
                  ) : (
                    <Text style={styles.codeButtonText}>Join Club</Text>
                  )}
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: COLORS.background },
  keyboardView: { flex: 1 },
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 120 },
  loadingPage: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: { color: COLORS.textSecondary, marginTop: 12, fontWeight: '800' },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 32,
    fontFamily: FONTS?.title,
    fontWeight: '900',
  },
  subtitle: {
    color: COLORS.gold,
    marginTop: 4,
    fontWeight: '800',
    lineHeight: 19,
  },
  logo: {
    width: 64,
    height: 64,
    marginLeft: 12,
  },

  searchOnlyWrap: {
    marginBottom: 2,
  },
  cardLabel: {
    color: COLORS.gold,
    fontWeight: '900',
    fontSize: 11,
    letterSpacing: 1,
  },
  input: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 13,
    marginTop: 0,
    color: COLORS.textPrimary,
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
  },
  emptyTitle: {
    color: COLORS.textPrimary,
    textAlign: 'center',
    fontWeight: '900',
    fontSize: 16,
  },
  emptyText: {
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 5,
    fontWeight: '700',
    lineHeight: 19,
  },

  clubCard: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    padding: 12,
    marginBottom: 10,
    flexDirection: 'row',
  },
  cover: {
    width: 58,
    height: 86,
    borderRadius: 10,
    marginRight: 12,
  },
  coverPlaceholder: {
    width: 58,
    height: 86,
    borderRadius: 10,
    marginRight: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.softBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverText: { fontSize: 25 },
  clubTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  clubName: {
    flex: 1,
    color: COLORS.textPrimary,
    fontWeight: '900',
    fontSize: 17,
  },
  typeBadge: {
    backgroundColor: COLORS.gold,
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 4,
  },
  typeBadgeText: {
    color: COLORS.deepForest,
    fontSize: 9,
    fontWeight: '900',
  },
  privateBadge: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.softBorder,
  },
  privateBadgeText: {
    color: COLORS.gold,
  },
  clubBook: {
    color: COLORS.textSecondary,
    marginTop: 4,
    fontWeight: '700',
  },
  clubMetaRow: {
    marginTop: 5,
  },
  clubMeta: {
    color: COLORS.gold,
    fontWeight: '900',
    fontSize: 12,
  },
  voteMeta: {
    color: COLORS.textSecondary,
    fontWeight: '700',
    fontSize: 12,
    marginTop: 2,
  },
  joinButton: {
    backgroundColor: COLORS.gold,
    borderRadius: 999,
    paddingVertical: 9,
    alignItems: 'center',
    marginTop: 10,
  },
  joinButtonDisabled: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.softBorder,
  },
  joinButtonText: {
    color: COLORS.deepForest,
    fontWeight: '900',
    fontSize: 12,
  },
  joinButtonTextDisabled: {
    color: COLORS.textMuted,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.58)',
    justifyContent: 'flex-end',
  },
  modalKeyboardView: {
    justifyContent: 'flex-end',
  },
  codePanel: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 18,
    paddingBottom: 32,
  },
  codePanelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  codePanelTitle: {
    color: COLORS.textPrimary,
    fontSize: 22,
    fontWeight: '900',
    marginTop: 5,
  },
  closeText: {
    color: COLORS.gold,
    fontSize: 20,
    fontWeight: '900',
  },
  codePanelText: {
    color: COLORS.textSecondary,
    fontWeight: '700',
    lineHeight: 20,
    marginTop: 8,
  },
  codeInput: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.softBorder,
    borderRadius: 16,
    padding: 14,
    marginTop: 14,
    color: COLORS.textPrimary,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  codeButton: {
    backgroundColor: COLORS.gold,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 14,
  },
  codeButtonText: {
    color: COLORS.deepForest,
    fontWeight: '900',
  },
});
