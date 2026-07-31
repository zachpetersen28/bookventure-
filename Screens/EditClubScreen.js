import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ScreenHeader from '../components/ScreenHeader';
import { supabase } from '../lib/supabase';
import { useTheme } from '../lib/theme-context';

export default function EditClubScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);

  const router = useRouter();
  const params = useLocalSearchParams();

  const [profile, setProfile] = useState(null);
  const [isHost, setIsHost] = useState(false);
  const [loading, setLoading] = useState(true);

  const [clubName, setClubName] = useState('');
  const [bookName, setBookName] = useState('');
  const [totalChapters, setTotalChapters] = useState('10');
  const [totalPages, setTotalPages] = useState('');
  const [goalFinishDate, setGoalFinishDate] = useState('');
  const [maxMembers, setMaxMembers] = useState('10');
  const [lockAfterVoting, setLockAfterVoting] = useState(false);

  useEffect(() => {
    loadHostSettings();
  }, []);

  const loadHostSettings = async () => {
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
      Alert.alert('Profile error', profileError.message);
      return;
    }

    setProfile(profileData);

    const { data: memberData, error: memberError } = await supabase
      .from('members')
      .select('*')
      .eq('club_id', params.id)
      .eq('name', profileData.display_name)
      .single();

    if (memberError || memberData?.role !== 'host') {
      setLoading(false);
      setIsHost(false);
      Alert.alert('Host only', 'Only the host can edit club settings.');
      router.back();
      return;
    }

    setIsHost(true);

    const { data: clubData, error: clubError } = await supabase
      .from('clubs')
      .select('*')
      .eq('id', params.id)
      .single();

    setLoading(false);

    if (clubError) {
      Alert.alert('Club error', clubError.message);
      return;
    }

    setClubName(clubData.name || '');
    setBookName(clubData.book || '');
    setTotalChapters(String(clubData.total_chapters || '10'));
    setTotalPages(clubData.total_pages ? String(clubData.total_pages) : '');
    setGoalFinishDate(clubData.goal_finish_date || '');
    setMaxMembers(String(clubData.max_members || '10'));
    setLockAfterVoting(Boolean(clubData.lock_after_voting));
  };

  const calculateSchedule = () => {
    const chapters = Number(totalChapters);
    const pages = Number(totalPages);

    if (
      !goalFinishDate ||
      Number.isNaN(chapters) ||
      Number.isNaN(pages) ||
      chapters <= 0 ||
      pages <= 0
    ) {
      return null;
    }

    const today = new Date();
    const goalDate = new Date(goalFinishDate + 'T00:00:00');

    const diffMs = goalDate - today;
    const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (days <= 0) return null;

    const weeks = Math.max(days / 7, 1);

    return {
      days,
      pagesPerDay: Math.ceil(pages / days),
      chaptersPerWeek: Number((chapters / weeks).toFixed(1)),
    };
  };

  const saveChanges = async () => {
    if (!isHost) {
      Alert.alert('Host only', 'Only the host can save these settings.');
      return;
    }

    if (!clubName.trim()) {
      Alert.alert('Missing club name', 'Club name cannot be blank.');
      return;
    }

    const chaptersNum = Number(totalChapters);
    const pagesNum = totalPages.trim() ? Number(totalPages) : null;
    const maxMembersNum = Number(maxMembers);

    if (Number.isNaN(chaptersNum) || chaptersNum <= 0) {
      Alert.alert('Invalid chapters', 'Total chapters must be greater than 0.');
      return;
    }

    if (totalPages.trim() && (Number.isNaN(pagesNum) || pagesNum <= 0)) {
      Alert.alert('Invalid pages', 'Total pages must be greater than 0.');
      return;
    }

    if (Number.isNaN(maxMembersNum) || maxMembersNum <= 0) {
      Alert.alert('Invalid max members', 'Max members must be greater than 0.');
      return;
    }

    const { error } = await supabase
      .from('clubs')
      .update({
        name: clubName.trim(),
        book: bookName.trim() || 'No book selected yet',
        total_chapters: chaptersNum,
        total_pages: pagesNum,
        goal_finish_date: goalFinishDate.trim() || null,
        max_members: maxMembersNum,
        lock_after_voting: lockAfterVoting,
      })
      .eq('id', params.id);

    if (error) {
      Alert.alert('Save error', error.message);
      return;
    }

    Alert.alert('Saved', 'Host settings updated.');
    router.back();
  };

  const schedule = calculateSchedule();

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingPage} edges={['top']}>
        <ActivityIndicator size="large" color={theme.colors.gold} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.page} edges={['top']}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <ScreenHeader
          title="Edit Club"
          subtitle={profile ? `Editing as ${profile.display_name}` : undefined}
          onBack={() => router.back()}
        />

        <Text style={styles.label}>Club Name</Text>
        <TextInput
          value={clubName}
          onChangeText={setClubName}
          style={styles.input}
        />

        <Text style={styles.label}>Current Book</Text>
        <TextInput
          value={bookName}
          onChangeText={setBookName}
          style={styles.input}
        />

        <Text style={styles.label}>Total Chapters</Text>
        <TextInput
          value={totalChapters}
          onChangeText={setTotalChapters}
          keyboardType="numeric"
          style={styles.input}
        />

        <Text style={styles.label}>Total Pages</Text>
        <TextInput
          value={totalPages}
          onChangeText={setTotalPages}
          keyboardType="numeric"
          placeholder="Example: 320"
          placeholderTextColor={theme.colors.textMuted}
          style={styles.input}
        />

        <Text style={styles.label}>Goal Finish Date</Text>
        <TextInput
          value={goalFinishDate}
          onChangeText={setGoalFinishDate}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={theme.colors.textMuted}
          style={styles.input}
        />

        {schedule && (
          <Text style={styles.scheduleText}>
            Suggested pace: {schedule.pagesPerDay} pages/day and{' '}
            {schedule.chaptersPerWeek} chapters/week.
          </Text>
        )}

        <Text style={styles.label}>Max Members</Text>
        <TextInput
          value={maxMembers}
          onChangeText={setMaxMembers}
          keyboardType="numeric"
          style={styles.input}
        />

        <TouchableOpacity
          style={[styles.toggleButton, lockAfterVoting && styles.toggleButtonOn]}
          onPress={() => setLockAfterVoting(!lockAfterVoting)}
        >
          <Text style={[styles.toggleText, lockAfterVoting && styles.toggleTextOn]}>
            {lockAfterVoting
              ? 'Joining locks after voting/book starts: ON'
              : 'Joining locks after voting/book starts: OFF'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.note}>
          Group average is calculated automatically from member progress.
        </Text>

        <TouchableOpacity style={styles.button} onPress={saveChanges}>
          <Text style={styles.buttonText}>Save Host Settings</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (theme) =>
  StyleSheet.create({
  page: { flex: 1, backgroundColor: theme.colors.background },
  loadingPage: {
    flex: 1,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: { flex: 1 },

  content: {
    padding: 20,
    paddingBottom: 120,
  },

  label: {
    fontWeight: '900',
    marginTop: 15,
    color: theme.colors.textPrimary,
  },

  input: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 14,
    padding: 12,
    marginTop: 6,
    color: theme.colors.textPrimary,
  },

  scheduleText: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    color: theme.colors.gold,
    padding: 12,
    borderRadius: 14,
    marginTop: 10,
    fontWeight: '900',
  },

  toggleButton: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 12,
    borderRadius: 14,
    marginTop: 18,
  },

  toggleButtonOn: {
    backgroundColor: theme.colors.gold,
    borderColor: theme.colors.gold,
  },

  toggleText: {
    fontWeight: '900',
    textAlign: 'center',
    color: theme.colors.textPrimary,
  },

  toggleTextOn: {
    color: theme.colors.deepForest,
  },

  note: {
    color: theme.colors.textSecondary,
    marginTop: 15,
    lineHeight: 20,
  },

  button: {
    backgroundColor: theme.colors.gold,
    padding: 14,
    borderRadius: 16,
    marginTop: 25,
  },

  buttonText: {
    color: theme.colors.deepForest,
    textAlign: 'center',
    fontWeight: '900',
  },
});