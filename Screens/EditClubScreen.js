import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
} from 'react-native';
import { supabase } from '../lib/supabase';

export default function EditClubScreen() {
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
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text>Loading host settings...</Text>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Host Settings</Text>
      <Text style={styles.subtitle}>
        {profile ? `Editing as ${profile.display_name}` : ''}
      </Text>

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
        style={styles.input}
      />

      <Text style={styles.label}>Goal Finish Date</Text>
      <TextInput
        value={goalFinishDate}
        onChangeText={setGoalFinishDate}
        placeholder="YYYY-MM-DD"
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
        <Text style={styles.toggleText}>
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
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },

  content: {
    padding: 20,
    paddingBottom: 50,
  },

  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },

  subtitle: {
    color: '#555',
    marginTop: 6,
    marginBottom: 20,
  },

  label: {
    fontWeight: 'bold',
    marginTop: 15,
  },

  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginTop: 6,
  },

  scheduleText: {
    backgroundColor: '#f2f2f2',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
    fontWeight: 'bold',
  },

  toggleButton: {
    backgroundColor: '#eee',
    padding: 12,
    borderRadius: 8,
    marginTop: 18,
  },

  toggleButtonOn: {
    backgroundColor: '#dff3df',
  },

  toggleText: {
    fontWeight: 'bold',
    textAlign: 'center',
  },

  note: {
    color: '#555',
    marginTop: 15,
    lineHeight: 20,
  },

  button: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    marginTop: 25,
  },

  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});