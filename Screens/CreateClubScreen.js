import DateTimePicker from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
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

export default function CreateClubScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [profile, setProfile] = useState(null);
  const [clubName, setClubName] = useState('');
  const [visibility, setVisibility] = useState('private');

  const [firstBookMode, setFirstBookMode] = useState(
    params.bookTitle ? 'preselected' : 'vote'
  );

  const [bookSearch, setBookSearch] = useState('');
  const [bookResults, setBookResults] = useState([]);
  const [searchingBooks, setSearchingBooks] = useState(false);

  const [bookName, setBookName] = useState(
    typeof params.bookTitle === 'string' ? params.bookTitle : ''
  );
  const [bookAuthor, setBookAuthor] = useState(
    typeof params.bookAuthor === 'string' ? params.bookAuthor : ''
  );
  const [bookCover, setBookCover] = useState(
    typeof params.bookCover === 'string' ? params.bookCover : ''
  );
  const [bookDescription, setBookDescription] = useState(
    typeof params.bookDescription === 'string' ? params.bookDescription : ''
  );

  const [totalChapters, setTotalChapters] = useState('');
  const [totalPages, setTotalPages] = useState(
    typeof params.totalPages === 'string' ? params.totalPages : ''
  );

  const [votingStartDate, setVotingStartDate] = useState(null);
  const [votingEndDate, setVotingEndDate] = useState(null);
  const [goalFinishDate, setGoalFinishDate] = useState(null);

  const [activeDatePicker, setActiveDatePicker] = useState(null);
  const [tempDate, setTempDate] = useState(new Date());

  const [maxMembers, setMaxMembers] = useState('10');
  const [allowJoinAfterBookSelected, setAllowJoinAfterBookSelected] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const { data: userData } = await supabase.auth.getUser();

    if (!userData?.user) {
      router.replace('/login');
      return;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userData.user.id)
      .single();

    if (error) {
      Alert.alert('Profile error', error.message);
      return;
    }

    setProfile(data);
  };

  const generateJoinCode = (length = 8) => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

  let result = '';

  for (let i = 0; i < length; i++) {
    result += chars.charAt(
      Math.floor(Math.random() * chars.length)
    );
  }

  return result;
};

  const formatDateForDisplay = (date) => {
    if (!date) return '';

    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateForSupabase = (date) => {
    if (!date) return null;

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  };

  const openDatePicker = (type) => {
    if (type === 'votingStart') setTempDate(votingStartDate || new Date());
    if (type === 'votingEnd') setTempDate(votingEndDate || votingStartDate || new Date());
    if (type === 'goalFinish') setTempDate(goalFinishDate || new Date());
    setActiveDatePicker(type);
  };

  const closeDatePicker = () => {
    setActiveDatePicker(null);
  };

  const saveDatePicker = () => {
    if (activeDatePicker === 'votingStart') setVotingStartDate(tempDate);
    if (activeDatePicker === 'votingEnd') setVotingEndDate(tempDate);
    if (activeDatePicker === 'goalFinish') setGoalFinishDate(tempDate);
    setActiveDatePicker(null);
  };

  const searchBooks = async () => {
    const query = bookSearch.trim();

    if (!query) {
      Alert.alert('Search missing', 'Enter a book title or author.');
      return;
    }

    setSearchingBooks(true);

    try {
      const apiKey = process.env.EXPO_PUBLIC_GOOGLE_BOOKS_API_KEY;
      const response = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(
          query
        )}&maxResults=10&key=${apiKey}`
      );

      const json = await response.json();

      const formattedBooks = (json.items || []).map((item) => {
        const info = item.volumeInfo || {};

        return {
          id: item.id,
          title: info.title || 'Untitled',
          author: info.authors ? info.authors.join(', ') : 'Unknown author',
          coverUrl: info.imageLinks?.thumbnail?.replace('http://', 'https://') || '',
          description: info.description || '',
          pageCount: info.pageCount || '',
        };
      });

      setBookResults(formattedBooks);
    } catch (error) {
      Alert.alert('Search error', 'Could not search Google Books.');
    }

    setSearchingBooks(false);
  };

  const selectBook = (book) => {
    setBookName(book.title);
    setBookAuthor(book.author);
    setBookCover(book.coverUrl);
    setBookDescription(book.description);
    setTotalPages(book.pageCount ? String(book.pageCount) : '');
    setBookResults([]);
    setBookSearch('');
  };

  const calculateSchedule = () => {
    const chapters = Number(totalChapters);
    const pages = Number(totalPages);

    if (
      firstBookMode !== 'preselected' ||
      !goalFinishDate ||
      Number.isNaN(chapters) ||
      Number.isNaN(pages) ||
      chapters <= 0 ||
      pages <= 0
    ) {
      return null;
    }

    const today = new Date();
    const diffMs = goalFinishDate - today;
    const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (days <= 0) return null;

    const weeks = Math.max(days / 7, 1);

    return {
      pagesPerDay: Math.ceil(pages / days),
      chaptersPerWeek: Number((chapters / weeks).toFixed(1)),
    };
  };

  const createClub = async () => {
    if (!profile) {
      Alert.alert('Profile missing', 'Please log in again.');
      return;
    }

    if (!clubName.trim()) {
      Alert.alert('Missing club name', 'Please enter a club name.');
      return;
    }

    const maxMembersNum = Number(maxMembers);

    if (Number.isNaN(maxMembersNum) || maxMembersNum <= 0) {
      Alert.alert('Invalid max members', 'Max members must be greater than 0.');
      return;
    }

    if (firstBookMode === 'vote') {
      if (!votingStartDate) {
        Alert.alert('Missing start date', 'Please select when voting begins.');
        return;
      }

      if (!votingEndDate) {
        Alert.alert('Missing end date', 'Please select when voting ends.');
        return;
      }

      if (votingEndDate <= votingStartDate) {
        Alert.alert('Invalid voting dates', 'Voting end date must be after the voting start date.');
        return;
      }

      if (!goalFinishDate) {
        Alert.alert('Missing goal finish date', 'Please select the group goal finish date.');
        return;
      }

      if (goalFinishDate <= votingEndDate) {
        Alert.alert('Invalid goal finish date', 'Goal finish date should be after voting ends.');
        return;
      }
    }

    let chaptersNum = 0;
    let pagesNum = null;

    if (firstBookMode === 'preselected') {
      if (!bookName.trim()) {
        Alert.alert('Missing book', 'Please select or enter a book.');
        return;
      }

      if (!totalChapters.trim()) {
        Alert.alert('Missing chapters', 'Please enter the total number of chapters.');
        return;
      }

      chaptersNum = Number(totalChapters);
      pagesNum = totalPages.trim() ? Number(totalPages) : null;

      if (Number.isNaN(chaptersNum) || chaptersNum <= 0) {
        Alert.alert('Invalid chapters', 'Total chapters must be greater than 0.');
        return;
      }

      if (totalPages.trim() && (Number.isNaN(pagesNum) || pagesNum <= 0)) {
        Alert.alert('Invalid pages', 'Total pages must be greater than 0.');
        return;
      }
    }

    setLoading(true);

    const votingWindowDays =
      votingStartDate && votingEndDate
        ? Math.ceil((votingEndDate - votingStartDate) / (1000 * 60 * 60 * 24))
        : null;

    const { data: clubData, error: clubError } = await supabase
      .from('clubs')
      .insert([
        {
          name: clubName.trim(),
          visibility,
          first_book_mode: firstBookMode,
          book: firstBookMode === 'preselected' ? bookName.trim() : 'Voting not started',
          book_author:
            firstBookMode === 'preselected' && bookAuthor.trim() ? bookAuthor.trim() : null,
          book_cover_url: firstBookMode === 'preselected' && bookCover ? bookCover : null,
          book_description:
            firstBookMode === 'preselected' && bookDescription ? bookDescription : null,
          current_chapter: 0,
          total_chapters: firstBookMode === 'preselected' ? chaptersNum : 0,
          total_pages: firstBookMode === 'preselected' ? pagesNum : null,
          goal_finish_date: formatDateForSupabase(goalFinishDate),
          group_average: 0,
          join_code: visibility === 'private' ? generateJoinCode() : null,
          max_members: maxMembersNum,
          lock_after_voting: !allowJoinAfterBookSelected,
          voting_locked: false,
          voting_window_days: firstBookMode === 'vote' ? votingWindowDays : null,
          voting_starts_at:
            firstBookMode === 'vote' ? formatDateForSupabase(votingStartDate) : null,
          voting_ends_at: firstBookMode === 'vote' ? formatDateForSupabase(votingEndDate) : null,
        },
      ])
      .select()
      .single();

    if (clubError) {
      setLoading(false);
      Alert.alert('Supabase club error', clubError.message);
      return;
    }

    const { error: memberError } = await supabase.from('members').insert([
      {
        club_id: clubData.id,
        name: profile.display_name,
        role: 'host',
        current_chapter: 0,
        streak: 0,
      },
    ]);

    setLoading(false);

    if (memberError) {
      Alert.alert('Supabase member error', memberError.message);
      return;
    }

    Alert.alert('Created', 'Your club has been created.');
    router.back();
  };

  const schedule = calculateSchedule();

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
          <Text style={styles.title}>Create Club</Text>
          <Text style={styles.subtitle}>Start a new Bookventure club.</Text>

          <Text style={styles.label}>Club Name</Text>
          <TextInput
            value={clubName}
            onChangeText={setClubName}
            placeholder="Example: Sunday Readers"
            placeholderTextColor={COLORS.textMuted}
            style={styles.input}
          />

          <Text style={styles.sectionTitle}>Club Visibility</Text>
          <View style={styles.modeRow}>
            <TouchableOpacity
              style={[styles.modeCard, visibility === 'private' && styles.modeCardActive]}
              onPress={() => setVisibility('private')}
            >
              <Text style={[styles.modeTitle, visibility === 'private' && styles.modeTitleActive]}>
                Private Club
              </Text>
              <Text style={[styles.modeText, visibility === 'private' && styles.modeTextActive]}>
                Invite-only. A join code will be generated.
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modeCard, visibility === 'public' && styles.modeCardActive]}
              onPress={() => setVisibility('public')}
            >
              <Text style={[styles.modeTitle, visibility === 'public' && styles.modeTitleActive]}>
                Public Club
              </Text>
              <Text style={[styles.modeText, visibility === 'public' && styles.modeTextActive]}>
                Discoverable. Members can join without a code.
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>First Book Setup</Text>
          <View style={styles.modeRow}>
            <TouchableOpacity
              style={[styles.modeCard, firstBookMode === 'vote' && styles.modeCardActive]}
              onPress={() => setFirstBookMode('vote')}
            >
              <Text style={[styles.modeTitle, firstBookMode === 'vote' && styles.modeTitleActive]}>
                Vote as a Group
              </Text>
              <Text style={[styles.modeText, firstBookMode === 'vote' && styles.modeTextActive]}>
                Let members join first, then vote during a set window.
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modeCard, firstBookMode === 'preselected' && styles.modeCardActive]}
              onPress={() => setFirstBookMode('preselected')}
            >
              <Text
                style={[styles.modeTitle, firstBookMode === 'preselected' && styles.modeTitleActive]}
              >
                Start with a Book
              </Text>
              <Text style={[styles.modeText, firstBookMode === 'preselected' && styles.modeTextActive]}>
                Choose the first book now and begin right away.
              </Text>
            </TouchableOpacity>
          </View>

          {firstBookMode === 'vote' && (
            <View style={styles.card}>
              <Text style={styles.cardLabel}>VOTING WINDOW</Text>
              <Text style={styles.cardText}>
                Choose when voting opens and closes. This gives members time to join before voting begins.
              </Text>

              <Text style={styles.label}>Voting Starts</Text>
              <TouchableOpacity style={styles.dateButton} onPress={() => openDatePicker('votingStart')}>
                <View>
                  <Text style={styles.dateButtonTinyLabel}>START DATE</Text>
                  <Text style={[styles.dateButtonText, !votingStartDate && styles.dateButtonPlaceholder]}>
                    {votingStartDate ? formatDateForDisplay(votingStartDate) : 'Select start date'}
                  </Text>
                </View>
                <Text style={styles.dateIcon}>📅</Text>
              </TouchableOpacity>

              <Text style={styles.label}>Voting Ends</Text>
              <TouchableOpacity style={styles.dateButton} onPress={() => openDatePicker('votingEnd')}>
                <View>
                  <Text style={styles.dateButtonTinyLabel}>END DATE</Text>
                  <Text style={[styles.dateButtonText, !votingEndDate && styles.dateButtonPlaceholder]}>
                    {votingEndDate ? formatDateForDisplay(votingEndDate) : 'Select end date'}
                  </Text>
                </View>
                <Text style={styles.dateIcon}>📅</Text>
              </TouchableOpacity>

              <Text style={styles.label}>Goal Finish Date</Text>
              <TouchableOpacity style={styles.dateButton} onPress={() => openDatePicker('goalFinish')}>
                <View>
                  <Text style={styles.dateButtonTinyLabel}>FINISH DATE</Text>
                  <Text style={[styles.dateButtonText, !goalFinishDate && styles.dateButtonPlaceholder]}>
                    {goalFinishDate ? formatDateForDisplay(goalFinishDate) : 'Select goal finish date'}
                  </Text>
                </View>
                <Text style={styles.dateIcon}>📅</Text>
              </TouchableOpacity>

              <Text style={styles.dateHelpText}>
                This is the target date for finishing whichever book the group selects.
              </Text>
            </View>
          )}

          {firstBookMode === 'preselected' && (
            <View style={styles.card}>
              <Text style={styles.cardLabel}>BOOK SEARCH</Text>
              <Text style={styles.cardText}>Search Google Books or enter the book details manually.</Text>

              <View style={styles.searchRow}>
                <TextInput
                  value={bookSearch}
                  onChangeText={setBookSearch}
                  placeholder="Search title or author..."
                  placeholderTextColor={COLORS.textMuted}
                  style={styles.searchInput}
                  returnKeyType="search"
                  onSubmitEditing={searchBooks}
                />

                <TouchableOpacity style={styles.searchButton} onPress={searchBooks} disabled={searchingBooks}>
                  {searchingBooks ? (
                    <ActivityIndicator color={COLORS.deepForest} />
                  ) : (
                    <Text style={styles.searchButtonText}>Search</Text>
                  )}
                </TouchableOpacity>
              </View>

              {bookResults.map((book) => (
                <TouchableOpacity key={book.id} style={styles.resultCard} onPress={() => selectBook(book)}>
                  {book.coverUrl ? (
                    <Image source={{ uri: book.coverUrl }} style={styles.resultCover} />
                  ) : (
                    <View style={styles.resultCoverPlaceholder}>
                      <Text style={styles.resultCoverPlaceholderText}>📖</Text>
                    </View>
                  )}

                  <View style={{ flex: 1 }}>
                    <Text style={styles.resultTitle} numberOfLines={2}>{book.title}</Text>
                    <Text style={styles.resultAuthor} numberOfLines={1}>{book.author}</Text>
                    <Text style={styles.resultMeta}>{book.pageCount ? `${book.pageCount} pages` : 'Pages unknown'}</Text>
                  </View>
                </TouchableOpacity>
              ))}

              {bookName ? (
                <View style={styles.selectedBookCard}>
                  {bookCover ? (
                    <Image source={{ uri: bookCover }} style={styles.bookCover} />
                  ) : (
                    <View style={styles.bookCoverPlaceholder}>
                      <Text style={styles.bookCoverPlaceholderText}>📖</Text>
                    </View>
                  )}

                  <View style={{ flex: 1 }}>
                    <Text style={styles.selectedBookLabel}>SELECTED BOOK</Text>
                    <Text style={styles.selectedBookTitle} numberOfLines={2}>{bookName}</Text>
                    <Text style={styles.selectedBookAuthor} numberOfLines={1}>{bookAuthor || 'Unknown author'}</Text>
                  </View>
                </View>
              ) : null}

              <Text style={styles.label}>Current Book</Text>
              <TextInput
                value={bookName}
                onChangeText={setBookName}
                placeholder="Example: Atomic Habits"
                placeholderTextColor={COLORS.textMuted}
                style={styles.input}
              />

              <Text style={styles.label}>Book Author</Text>
              <TextInput
                value={bookAuthor}
                onChangeText={setBookAuthor}
                placeholder="Example: James Clear"
                placeholderTextColor={COLORS.textMuted}
                style={styles.input}
              />

              <Text style={styles.requiredLabel}>Total Chapters *</Text>
              <TextInput
                value={totalChapters}
                onChangeText={setTotalChapters}
                keyboardType="numeric"
                placeholder="Required"
                placeholderTextColor={COLORS.textMuted}
                style={styles.input}
              />

              <Text style={styles.label}>Total Pages</Text>
              <TextInput
                value={totalPages}
                onChangeText={setTotalPages}
                keyboardType="numeric"
                placeholder="Example: 320"
                placeholderTextColor={COLORS.textMuted}
                style={styles.input}
              />

              <Text style={styles.label}>Goal Finish Date</Text>
              <TouchableOpacity style={styles.dateButton} onPress={() => openDatePicker('goalFinish')}>
                <View>
                  <Text style={styles.dateButtonTinyLabel}>FINISH DATE</Text>
                  <Text style={[styles.dateButtonText, !goalFinishDate && styles.dateButtonPlaceholder]}>
                    {goalFinishDate ? formatDateForDisplay(goalFinishDate) : 'Select goal finish date'}
                  </Text>
                </View>
                <Text style={styles.dateIcon}>📅</Text>
              </TouchableOpacity>

              {schedule && (
                <Text style={styles.scheduleText}>
                  Suggested pace: {schedule.pagesPerDay} pages/day and {schedule.chaptersPerWeek} chapters/week.
                </Text>
              )}
            </View>
          )}

          <Text style={styles.label}>Max Members</Text>
          <TextInput
            value={maxMembers}
            onChangeText={setMaxMembers}
            keyboardType="numeric"
            style={styles.input}
          />

          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setAllowJoinAfterBookSelected(!allowJoinAfterBookSelected)}
          >
            <View style={[styles.checkbox, allowJoinAfterBookSelected && styles.checkboxChecked]}>
              {allowJoinAfterBookSelected && <Text style={styles.checkboxCheck}>✓</Text>}
            </View>

            <Text style={styles.checkboxText}>Allow members to join after book has been selected</Text>
          </TouchableOpacity>

          <Text style={styles.note}>
            {visibility === 'private'
              ? 'A private join code will be created automatically and shown only to the host.'
              : 'Public clubs can be found and joined without a code.'}
          </Text>

          <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={createClub} disabled={loading}>
            <Text style={styles.buttonText}>{loading ? 'Creating...' : 'Create Club'}</Text>
          </TouchableOpacity>
        </ScrollView>

        {activeDatePicker && (
          <View style={styles.dateOverlay}>
            <View style={styles.datePanel}>
              <View style={styles.datePanelHeader}>
                <Text style={styles.datePanelTitle}>Select Date</Text>
                <TouchableOpacity onPress={closeDatePicker}>
                  <Text style={styles.datePanelClose}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.datePickerWrap}>
                <DateTimePicker
                  value={tempDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'calendar'}
                  themeVariant="dark"
                  textColor={COLORS.textPrimary}
                  onChange={(event, selectedDate) => {
                    if (Platform.OS === 'android') {
                      if (event.type === 'dismissed') {
                        closeDatePicker();
                        return;
                      }

                      if (selectedDate) {
                        if (activeDatePicker === 'votingStart') setVotingStartDate(selectedDate);
                        if (activeDatePicker === 'votingEnd') setVotingEndDate(selectedDate);
                        if (activeDatePicker === 'goalFinish') setGoalFinishDate(selectedDate);
                      }

                      closeDatePicker();
                      return;
                    }

                    if (selectedDate) setTempDate(selectedDate);
                  }}
                />
              </View>

              {Platform.OS === 'ios' && (
                <TouchableOpacity style={styles.dateSaveButton} onPress={saveDatePicker}>
                  <Text style={styles.dateSaveButtonText}>Save Date</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: COLORS.background },
  keyboardView: { flex: 1 },
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 120 },

  title: {
    fontSize: 32,
    fontFamily: FONTS?.title,
    fontWeight: '900',
    color: COLORS.textPrimary,
  },

  subtitle: {
    color: COLORS.gold,
    marginTop: 4,
    marginBottom: 16,
    fontWeight: '800',
  },

  sectionTitle: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: '900',
    marginTop: 22,
    marginBottom: 10,
  },

  label: {
    fontWeight: '900',
    marginTop: 15,
    color: COLORS.textPrimary,
  },

  requiredLabel: {
    fontWeight: '900',
    marginTop: 15,
    color: COLORS.gold,
  },

  input: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: 12,
    marginTop: 6,
    color: COLORS.textPrimary,
  },

  dateButton: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.softBorder,
    borderRadius: 16,
    padding: 13,
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  dateButtonTinyLabel: {
    color: COLORS.gold,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 3,
  },

  dateButtonText: {
    color: COLORS.textPrimary,
    fontWeight: '900',
    fontSize: 15,
  },

  dateButtonPlaceholder: {
    color: COLORS.textMuted,
  },

  dateIcon: {
    fontSize: 22,
    marginLeft: 12,
  },

  dateHelpText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17,
    marginTop: 8,
  },

  modeRow: {
    flexDirection: 'row',
    gap: 10,
  },

  modeCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    padding: 13,
  },

  modeCardActive: {
    backgroundColor: COLORS.gold,
    borderColor: COLORS.gold,
  },

  modeTitle: {
    color: COLORS.textPrimary,
    fontWeight: '900',
    fontSize: 14,
  },

  modeTitleActive: {
    color: COLORS.deepForest,
  },

  modeText: {
    color: COLORS.textSecondary,
    marginTop: 6,
    fontSize: 12,
    lineHeight: 17,
  },

  modeTextActive: {
    color: COLORS.deepForest,
  },

  card: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    padding: 14,
    marginTop: 14,
  },

  cardLabel: {
    color: COLORS.gold,
    fontWeight: '900',
    fontSize: 11,
    letterSpacing: 1,
  },

  cardText: {
    color: COLORS.textSecondary,
    marginTop: 6,
    lineHeight: 19,
  },

  searchRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },

  searchInput: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: 12,
    color: COLORS.textPrimary,
  },

  searchButton: {
    backgroundColor: COLORS.gold,
    paddingHorizontal: 14,
    borderRadius: 14,
    justifyContent: 'center',
  },

  searchButtonText: {
    color: COLORS.deepForest,
    fontWeight: '900',
  },

  resultCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 10,
    marginTop: 10,
  },

  resultCover: {
    width: 50,
    height: 74,
    borderRadius: 8,
    marginRight: 10,
  },

  resultCoverPlaceholder: {
    width: 50,
    height: 74,
    borderRadius: 8,
    marginRight: 10,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },

  resultCoverPlaceholderText: {
    fontSize: 22,
  },

  resultTitle: {
    color: COLORS.textPrimary,
    fontWeight: '900',
  },

  resultAuthor: {
    color: COLORS.textSecondary,
    marginTop: 3,
    fontSize: 12,
  },

  resultMeta: {
    color: COLORS.gold,
    marginTop: 4,
    fontSize: 12,
    fontWeight: '800',
  },

  selectedBookCard: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    padding: 12,
    flexDirection: 'row',
    marginTop: 14,
  },

  bookCover: {
    width: 64,
    height: 94,
    borderRadius: 10,
    marginRight: 12,
  },

  bookCoverPlaceholder: {
    width: 64,
    height: 94,
    borderRadius: 10,
    marginRight: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.softBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },

  bookCoverPlaceholderText: { fontSize: 26 },

  selectedBookLabel: {
    color: COLORS.gold,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },

  selectedBookTitle: {
    color: COLORS.textPrimary,
    fontWeight: '900',
    fontSize: 16,
    marginTop: 4,
  },

  selectedBookAuthor: {
    color: COLORS.textSecondary,
    marginTop: 3,
    fontWeight: '700',
  },

  scheduleText: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    color: COLORS.gold,
    padding: 12,
    borderRadius: 14,
    marginTop: 10,
    fontWeight: '900',
  },

  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: 13,
  },

  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  checkboxChecked: {
    backgroundColor: COLORS.gold,
  },

  checkboxCheck: {
    color: COLORS.deepForest,
    fontWeight: '900',
  },

  checkboxText: {
    flex: 1,
    color: COLORS.textPrimary,
    fontWeight: '800',
    lineHeight: 19,
  },

  note: {
    color: COLORS.textSecondary,
    marginTop: 15,
    lineHeight: 20,
  },

  button: {
    backgroundColor: COLORS.gold,
    padding: 14,
    borderRadius: 16,
    marginTop: 25,
  },

  buttonDisabled: { backgroundColor: COLORS.textMuted },

  buttonText: {
    color: COLORS.deepForest,
    textAlign: 'center',
    fontWeight: '900',
  },

  dateOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.58)',
    justifyContent: 'flex-end',
  },

  datePanel: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    paddingBottom: 28,
  },

  datePanelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },

  datePanelTitle: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: '900',
  },

  datePanelClose: {
    color: COLORS.gold,
    fontSize: 20,
    fontWeight: '900',
  },

  datePickerWrap: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.softBorder,
    overflow: 'hidden',
    alignItems: 'center',
  },

  dateSaveButton: {
    backgroundColor: COLORS.gold,
    borderRadius: 16,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 14,
  },

  dateSaveButtonText: {
    color: COLORS.deepForest,
    fontWeight: '900',
  },
});

