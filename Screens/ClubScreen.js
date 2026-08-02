import {
  useLocalSearchParams,
  useRouter,
} from 'expo-router';

import { useFocusEffect } from '@react-navigation/native';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
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
import Svg, { Circle } from 'react-native-svg';
import ThemedBackground from '../components/ThemedBackground';
import { supabase } from '../lib/supabase';
import { FONTS } from '../lib/theme';
import { useTheme } from '../lib/theme-context';

export default function ClubScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);

  const router = useRouter();
  const { id, name, book, totalChapters, joinCode } = useLocalSearchParams();

  const [profile, setProfile] = useState(null);
  const [clubSettings, setClubSettings] = useState(null);
  const [members, setMembers] = useState([]);
  const [memberProfiles, setMemberProfiles] = useState({});
  const [messages, setMessages] = useState([]);
  const [suggestions, setSuggestions] = useState([]);

  const [activeTab, setActiveTab] = useState('book');
  const [selectedChat, setSelectedChat] = useState('main');
  const [messageInput, setMessageInput] = useState('');

  const [bookSuggestion, setBookSuggestion] = useState('');
  const [manualBookTitle, setManualBookTitle] = useState('');
  const [bookSearchResults, setBookSearchResults] = useState([]);
  const [searchingBooks, setSearchingBooks] = useState(false);
  const [winningBookChapters, setWinningBookChapters] = useState('');

  const [showHostTools, setShowHostTools] = useState(false);
  const [showInviteCode, setShowInviteCode] = useState(false);
  const [hostClubName, setHostClubName] = useState('');
  const [hostMaxMembers, setHostMaxMembers] = useState('');
  const [hostGoalFinishDate, setHostGoalFinishDate] = useState('');
  const [hostVotingStartDate, setHostVotingStartDate] = useState('');
  const [hostVotingEndDate, setHostVotingEndDate] = useState('');
  const [hostSaving, setHostSaving] = useState(false);
  const [confirmingChapter, setConfirmingChapter] = useState(false);
  const [loading, setLoading] = useState(true);

  const chatScrollRef = useRef(null);

  const total = Number(clubSettings?.total_chapters || totalChapters || 0);
  const currentBookTitle = clubSettings?.book || book || 'Voting not started';
  const currentBookAuthor = clubSettings?.book_author || '';
  const currentBookCover = clubSettings?.book_cover_url || '';
  const hasActiveBook = total > 0 && currentBookTitle !== 'Voting not started';

  const currentMember = members.find(
    (member) =>
      String(member.name || '').trim().toLowerCase() ===
      String(profile?.display_name || '').trim().toLowerCase()
  );

  const isHost = currentMember?.role === 'host';
  const current = Number(currentMember?.current_chapter || 0);
  const userPercent = total > 0 ? Math.round((current / total) * 100) : 0;

  const groupAverage =
    members.length > 0
      ? members.reduce((sum, member) => sum + Number(member.current_chapter || 0), 0) /
        members.length
      : 0;
  const groupPercent = total > 0 ? Math.round((groupAverage / total) * 100) : 0;

  const goalFinishDate = clubSettings?.goal_finish_date
    ? new Date(`${clubSettings.goal_finish_date}T23:59:59`)
    : null;

  const clubCreatedDate = clubSettings?.created_at
    ? new Date(clubSettings.created_at)
    : null;

  const totalReadingDays =
    goalFinishDate && clubCreatedDate && total > 0
      ? Math.max(
          1,
          Math.ceil((goalFinishDate - clubCreatedDate) / (1000 * 60 * 60 * 24))
        )
      : null;

  const daysPassed =
    goalFinishDate && clubCreatedDate && total > 0
      ? Math.max(
          1,
          Math.ceil((new Date() - clubCreatedDate) / (1000 * 60 * 60 * 24))
        )
      : null;

  const expectedChapter =
    hasActiveBook && totalReadingDays && daysPassed
      ? Math.min(total, Math.ceil((daysPassed / totalReadingDays) * total))
      : null;

  const chapterDifference = expectedChapter != null ? current - expectedChapter : null;

  const paceStatus =
    chapterDifference == null
      ? null
      : chapterDifference >= 2
      ? 'Ahead'
      : chapterDifference <= -2
      ? 'Behind'
      : 'On Pace';

  const paceColor =
    paceStatus === 'Ahead'
      ? theme.colors.success
      : paceStatus === 'Behind'
      ? theme.colors.danger
      : theme.colors.gold;

  const chaptersPerWeek =
    totalReadingDays && total > 0 ? Number((total / Math.max(totalReadingDays / 7, 1)).toFixed(1)) : null;

  const pagesPerDay =
    totalReadingDays && Number(clubSettings?.total_pages || 0) > 0
      ? Math.ceil(Number(clubSettings.total_pages) / totalReadingDays)
      : null;

  const formatHostDateForDisplay = (dateString) => {
    if (!dateString) return '';
    const [year, month, day] = String(dateString).split('-');
    if (!year || !month || !day) return dateString;
    return `${month}/${day}/${year}`;
  };

  const formatHostDateForSave = (dateString) => {
    const clean = String(dateString || '').trim();
    if (!clean) return '';

    if (/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(clean)) return clean;

    const match = clean.match(/^([0-9]{1,2})\/([0-9]{1,2})\/([0-9]{4})$/);
    if (!match) return clean;

    const month = match[1].padStart(2, '0');
    const day = match[2].padStart(2, '0');
    const year = match[3];

    return `${year}-${month}-${day}`;
  };

  const votingStartsAt = clubSettings?.voting_starts_at
    ? new Date(`${clubSettings.voting_starts_at}T00:00:00`)
    : null;
  const votingEndsAt = clubSettings?.voting_ends_at
    ? new Date(`${clubSettings.voting_ends_at}T23:59:59`)
    : null;

  const now = new Date();
  const votingHasStarted = votingStartsAt ? now >= votingStartsAt : true;
  const votingHasEnded = votingEndsAt ? now > votingEndsAt : false;
  const votingOpen = votingHasStarted && !votingHasEnded;

  const sortedMembers = [...members].sort((a, b) => {
    const aStreak = Number(memberProfiles[a.user_id]?.current_streak || 0);
    const bStreak = Number(memberProfiles[b.user_id]?.current_streak || 0);

    if (bStreak !== aStreak) {
      return bStreak - aStreak;
    }

    return Number(b.current_chapter || 0) - Number(a.current_chapter || 0);
  });

  const sortedSuggestions = [...suggestions].sort((a, b) => b.votes - a.votes);
  const winningBook = sortedSuggestions[0];

  const votingStatusText = useMemo(() => {
    if (clubSettings?.first_book_mode !== 'vote') return null;

    if (votingStartsAt && now < votingStartsAt) {
      const days = Math.ceil((votingStartsAt - now) / (1000 * 60 * 60 * 24));
      return `Voting opens in ${days} day${days === 1 ? '' : 's'}`;
    }

    if (votingOpen && votingEndsAt) {
      const days = Math.ceil((votingEndsAt - now) / (1000 * 60 * 60 * 24));
      return `Voting closes in ${days} day${days === 1 ? '' : 's'}`;
    }

    if (votingHasEnded) return 'Voting closed';
    return 'Voting is open';
  }, [clubSettings, votingStartsAt, votingEndsAt, votingOpen, votingHasEnded]);

  useFocusEffect(
  useCallback(() => {
    loadProfileAndData();
  }, [id])
);

  useEffect(() => {
    loadMessages();
  }, [selectedChat]);

  useEffect(() => {
    if (!clubSettings) return;
    setHostClubName(clubSettings.name || '');
    setHostMaxMembers(String(clubSettings.max_members || ''));
    setHostGoalFinishDate(formatHostDateForDisplay(clubSettings.goal_finish_date));
    setHostVotingStartDate(formatHostDateForDisplay(clubSettings.voting_starts_at));
    setHostVotingEndDate(formatHostDateForDisplay(clubSettings.voting_ends_at));
  }, [clubSettings]);

  const getChapterGroupSize = (chapterTotal) => {
    if (chapterTotal <= 20) return 1;
    if (chapterTotal <= 40) return 3;
    if (chapterTotal <= 80) return 5;
    return 10;
  };

  const getChapterGroups = (chapterTotal) => {
    const groupSize = getChapterGroupSize(chapterTotal);
    const groups = [];

    for (let start = 1; start <= chapterTotal; start += groupSize) {
      const end = Math.min(start + groupSize - 1, chapterTotal);
      groups.push({
        key: start,
        start,
        end,
        label: start === end ? `Ch ${start}` : `Ch ${start}-${end}`,
      });
    }

    return groups;
  };

  const getChatKeyForChapter = (chapterNumber) => {
    const groups = getChapterGroups(total);
    const match = groups.find(
      (group) => chapterNumber >= group.start && chapterNumber <= group.end
    );
    return match?.key || chapterNumber;
  };

  const getStreakEmoji = (streak) => {
    const days = Number(streak || 0);

    if (days >= 100) return '💎';
    if (days >= 51) return '👑';
    if (days >= 21) return '🔥';
    if (days >= 1) return '⚡';
    return '🌱';
  };

  const loadProfileAndData = async () => {
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
    await loadClubSettings();
    await loadMembers();
    await loadSuggestions(profileData.display_name);
    setLoading(false);
  };

  const loadClubSettings = async () => {
    const { data, error } = await supabase.from('clubs').select('*').eq('id', id).single();

    if (error) {
      Alert.alert('Error loading club', error.message);
      return;
    }

    setClubSettings(data);
  };

  const loadMembers = async () => {
    const { data, error } = await supabase.from('members').select('*').eq('club_id', id);

    if (error) {
      Alert.alert('Error loading members', error.message);
      return;
    }

    const loadedMembers = data || [];
    setMembers(loadedMembers);

    const userIds = loadedMembers
      .map((member) => member.user_id)
      .filter((userId) => userId != null);

    if (userIds.length === 0) {
      setMemberProfiles({});
      return;
    }

    const { data: profileRows, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .in('id', userIds);

    if (profileError) {
      Alert.alert('Error loading member profiles', profileError.message);
      return;
    }

    const profilesByUserId = {};
    (profileRows || []).forEach((profileRow) => {
      profilesByUserId[profileRow.id] = profileRow;
    });

    setMemberProfiles(profilesByUserId);
  };

  const loadMessages = async () => {
    if (!id) return;

    const isMain = selectedChat === 'main';
    let query = supabase
      .from('messages')
      .select('*')
      .eq('club_id', id)
      .order('created_at', { ascending: true });

    if (isMain) {
      query = query.eq('chat_type', 'main');
    } else {
      query = query.eq('chat_type', 'chapter').eq('chapter_number', selectedChat);
    }

    const { data, error } = await query;

    if (error) {
      Alert.alert('Error loading messages', error.message);
      return;
    }

    setMessages(
      (data || []).map((message) => ({
        id: message.id,
        user: message.sender_name,
        text: message.text,
      }))
    );
  };

  const loadSuggestions = async (displayNameOverride) => {
    const displayName = displayNameOverride || profile?.display_name || '';

    const { data: suggestionData, error: suggestionError } = await supabase
      .from('book_suggestions')
      .select('*')
      .eq('club_id', id)
      .order('created_at', { ascending: false });

    if (suggestionError) {
      Alert.alert('Error loading suggestions', suggestionError.message);
      return;
    }

    const { data: voteData, error: voteError } = await supabase
      .from('book_votes')
      .select('*')
      .eq('club_id', id);

    if (voteError) {
      Alert.alert('Error loading votes', voteError.message);
      return;
    }

    const formattedSuggestions = (suggestionData || []).map((suggestion) => {
      const votesForSuggestion = (voteData || []).filter(
        (vote) => vote.suggestion_id === suggestion.id
      );
      const votedByYou = votesForSuggestion.some(
        (vote) =>
          String(vote.voter_name || '').trim().toLowerCase() ===
          String(displayName || '').trim().toLowerCase()
      );

      return {
        id: suggestion.id,
        title: suggestion.title,
        author: suggestion.author,
        coverUrl: suggestion.cover_url,
        description: suggestion.description,
        pageCount: suggestion.page_count,
        suggestedBy: suggestion.suggested_by,
        votes: votesForSuggestion.length,
        votedByYou,
      };
    });

    setSuggestions(formattedSuggestions);
  };

  const handleChapterCompletePress = () => {
    if (current >= total || total <= 0) return;

    if (confirmingChapter) {
      setConfirmingChapter(false);
      markChapterComplete();
      return;
    }

    setConfirmingChapter(true);
    setTimeout(() => setConfirmingChapter(false), 3000);
  };

  const markChapterComplete = async () => {
    if (!currentMember) {
      Alert.alert('Member missing', 'You are not part of this club.');
      return;
    }

    if (total > 0 && current >= total) return;

    const nextChapter = current + 1;
    const { error } = await supabase
      .from('members')
      .update({ current_chapter: nextChapter })
      .eq('id', currentMember.id);

    if (error) {
      Alert.alert('Error updating progress', error.message);
      return;
    }

    await loadMembers();
    setSelectedChat(getChatKeyForChapter(nextChapter));
  };

  const sendMessage = async () => {
    if (!messageInput.trim()) return;

    if (!profile || !currentMember) {
      Alert.alert('Not a member', 'You must join this club before chatting.');
      return;
    }

    const isMain = selectedChat === 'main';
    const { error } = await supabase.from('messages').insert([
      {
        club_id: id,
        sender_name: profile.display_name,
        chat_type: isMain ? 'main' : 'chapter',
        chapter_number: isMain ? null : selectedChat,
        text: messageInput.trim(),
      },
    ]);

    if (error) {
      Alert.alert('Error sending message', error.message);
      return;
    }

    setMessageInput('');
    await loadMessages();
  };

  const deleteMessage = (message) => {
    const canDelete = isHost || message.user === profile?.display_name;

    if (!canDelete) {
      Alert.alert('Not allowed', 'You can only delete your own messages.');
      return;
    }

    Alert.alert('Delete Message', 'Delete this message?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('messages').delete().eq('id', message.id);

          if (error) {
            Alert.alert('Error deleting message', error.message);
            return;
          }

          await loadMessages();
        },
      },
    ]);
  };

  const openMessageActions = (message) => {
    const canDelete = isHost || message.user === profile?.display_name;
    if (!canDelete) return;

    Alert.alert('Message Options', 'What would you like to do?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete Message',
        style: 'destructive',
        onPress: () => deleteMessage(message),
      },
    ]);
  };

  const endVotingNow = async () => {
    if (!isHost) return;

    Alert.alert(
      'End Voting',
      'Are you sure you want to end voting now?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'End Voting',
          style: 'destructive',
          onPress: async () => {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);

            const year = yesterday.getFullYear();
            const month = String(yesterday.getMonth() + 1).padStart(2, '0');
            const day = String(yesterday.getDate()).padStart(2, '0');

            const yesterdayString = `${year}-${month}-${day}`;

            const { error } = await supabase
              .from('clubs')
              .update({
                voting_ends_at: yesterdayString,
              })
              .eq('id', id);

            if (error) {
              Alert.alert('Error', error.message);
              return;
            }

            await loadClubSettings();
            await loadSuggestions(profile?.display_name);
await loadMembers();

            Alert.alert('Voting ended successfully');
          },
        },
      ]
    );
  };

  const searchBooksForSuggestion = async () => {
    if (!votingOpen) {
      Alert.alert('Voting closed', 'The voting window is not open.');
      return;
    }

    if (!bookSuggestion.trim()) {
      Alert.alert('Missing search', 'Enter a book title or author first.');
      return;
    }

    setSearchingBooks(true);

    try {
      const apiKey = process.env.EXPO_PUBLIC_GOOGLE_BOOKS_API_KEY;
      const response = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(
          bookSuggestion
        )}&maxResults=8&key=${apiKey}`
      );

      const json = await response.json();
      const formattedBooks = (json.items || []).map((item) => {
        const info = item.volumeInfo || {};
        return {
          id: item.id,
          title: info.title || 'Untitled',
          author: info.authors ? info.authors.join(', ') : null,
          coverUrl: info.imageLinks?.thumbnail?.replace('http://', 'https://') || null,
          description: info.description || null,
          pageCount: info.pageCount || null,
        };
      });

      setBookSearchResults(formattedBooks);
    } catch (error) {
      Alert.alert('Search error', 'Could not search Google Books.');
    }

    setSearchingBooks(false);
  };

  const addBookSuggestion = async (bookData) => {
    if (!votingOpen) {
      Alert.alert('Voting closed', 'The voting window is not open.');
      return;
    }

    if (!profile || !currentMember) {
      Alert.alert('Not a member', 'You must join this club before suggesting.');
      return;
    }

    const existingSuggestion = suggestions.find(
      (item) =>
        String(item.suggestedBy || '').trim().toLowerCase() ===
        String(profile.display_name || '').trim().toLowerCase()
    );

    if (existingSuggestion && existingSuggestion.votes > 0) {
      Alert.alert(
        'Suggestion locked',
        'Your suggestion already has votes and can no longer be changed.'
      );
      return;
    }

    const payload = {
      title: bookData.title,
      author: bookData.author,
      cover_url: bookData.coverUrl,
      description: bookData.description,
      page_count: bookData.pageCount,
    };

    if (existingSuggestion) {
      const { error } = await supabase
        .from('book_suggestions')
        .update(payload)
        .eq('id', existingSuggestion.id);

      if (error) {
        Alert.alert('Error updating suggestion', error.message);
        return;
      }
    } else {
      const { error } = await supabase.from('book_suggestions').insert([
        {
          club_id: id,
          ...payload,
          suggested_by: profile.display_name,
        },
      ]);

      if (error) {
        Alert.alert('Error adding suggestion', error.message);
        return;
      }
    }

    setBookSuggestion('');
    setManualBookTitle('');
    setBookSearchResults([]);
    await loadSuggestions(profile.display_name);
  };

  const addManualSuggestion = async () => {
    if (!manualBookTitle.trim()) {
      Alert.alert('Missing book', 'Enter a book title first.');
      return;
    }

    await addBookSuggestion({
      title: manualBookTitle.trim(),
      author: null,
      coverUrl: null,
      description: null,
      pageCount: null,
    });
  };

  const voteForBook = async (suggestionId) => {
    if (!votingOpen) {
      Alert.alert('Voting closed', 'The voting window is not open.');
      return;
    }

    if (!profile || !currentMember) {
      Alert.alert('Not a member', 'You must join this club before voting.');
      return;
    }

    const existingVote = suggestions.find((item) => item.votedByYou);
    if (existingVote?.id === suggestionId) return;

    if (existingVote) {
      const { error: deleteError } = await supabase
        .from('book_votes')
        .delete()
        .eq('club_id', id)
        .eq('voter_name', profile.display_name);

      if (deleteError) {
        Alert.alert('Error changing vote', deleteError.message);
        return;
      }
    }

    const { error } = await supabase.from('book_votes').insert([
      {
        suggestion_id: suggestionId,
        club_id: id,
        voter_name: profile.display_name,
      },
    ]);

    if (error) {
      Alert.alert('Error voting', error.message);
      return;
    }

    await loadSuggestions(profile.display_name);
    
  };

  const startWinningBook = async () => {
    if (!isHost) {
      Alert.alert('Host only', 'Only the host can start the winning book.');
      return;
    }

    if (!winningBook) {
      Alert.alert('No winner yet', 'Add and vote on books first.');
      return;
    }

    if (!winningBookChapters.trim()) {
      Alert.alert('Missing chapters', 'Enter the total chapters before starting the book.');
      return;
    }

    const chaptersNum = Number(winningBookChapters);
    if (Number.isNaN(chaptersNum) || chaptersNum <= 0) {
      Alert.alert('Invalid chapters', 'Total chapters must be greater than 0.');
      return;
    }

    const shouldLockJoining = Boolean(clubSettings?.lock_after_voting);
    const { error: clubError } = await supabase
      .from('clubs')
      .update({
        book: winningBook.title,
        book_author: winningBook.author || null,
        book_cover_url: winningBook.coverUrl || null,
        book_description: winningBook.description || null,
        total_pages: winningBook.pageCount || null,
        current_chapter: 0,
        total_chapters: chaptersNum,
        group_average: 0,
        voting_locked: shouldLockJoining,
      })
      .eq('id', id);

    if (clubError) {
      Alert.alert('Error starting book', clubError.message);
      return;
    }

    const { error: membersError } = await supabase
      .from('members')
      .update({ current_chapter: 0 })
      .eq('club_id', id);

    if (membersError) {
      Alert.alert('Book started, but member reset failed', membersError.message);
      return;
    }

    await supabase.from('book_votes').delete().eq('club_id', id);
    await supabase.from('book_suggestions').delete().eq('club_id', id);

    setWinningBookChapters('');
    await loadClubSettings();
    await loadMembers();
    await loadSuggestions(profile.display_name);
    setActiveTab('book');
  };

  const leaveClub = () => {
    if (!currentMember) {
      Alert.alert('Not a member', 'You are not listed as a member of this club.');
      return;
    }

    if (isHost) {
      Alert.alert('Host cannot leave', 'The host cannot leave their own club.');
      return;
    }

    Alert.alert('Leave Club', 'Are you sure you want to leave this club?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Leave',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('members').delete().eq('id', currentMember.id);

          if (error) {
            Alert.alert('Error leaving club', error.message);
            return;
          }

          router.back();
        },
      },
    ]);
  };

  const removeMember = (member) => {
    if (!isHost) return;

    if (member.id === currentMember?.id) {
      Alert.alert('Cannot remove yourself', 'Hosts cannot remove themselves.');
      return;
    }

    Alert.alert('Remove Member', `Remove ${member.name} from this club?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('members').delete().eq('id', member.id);

          if (error) {
            Alert.alert('Error removing member', error.message);
            return;
          }

          loadMembers();
        },
      },
    ]);
  };

  const openMemberProfile = (member) => {
    if (!member.user_id) {
      Alert.alert('Profile not available', "This member isn't linked to a profile yet.");
      return;
    }

    router.push(`/member-profile?id=${member.user_id}`);
  };

  const openMemberActions = (member) => {
    if (!isHost) return;
    if (member.id === currentMember?.id) return;

    Alert.alert('Member Options', `What would you like to do with ${member.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove Member',
        style: 'destructive',
        onPress: () => removeMember(member),
      },
    ]);
  };

  const saveHostSettings = async () => {
    if (!isHost) return;

    if (!hostClubName.trim()) {
      Alert.alert('Missing club name', 'Club name cannot be blank.');
      return;
    }

    const maxMembersNum = Number(hostMaxMembers || 0);
    if (Number.isNaN(maxMembersNum) || maxMembersNum <= 0) {
      Alert.alert('Invalid max members', 'Max members must be greater than 0.');
      return;
    }

    const datePattern = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/;
    const cleanGoalDate = formatHostDateForSave(hostGoalFinishDate);
    const cleanVotingStart = formatHostDateForSave(hostVotingStartDate);
    const cleanVotingEnd = formatHostDateForSave(hostVotingEndDate);

    if (cleanGoalDate && !datePattern.test(cleanGoalDate)) {
      Alert.alert('Invalid goal date', 'Use MM/DD/YYYY format.');
      return;
    }

    if (clubSettings?.first_book_mode === 'vote' && !votingHasEnded) {
      if (cleanVotingStart && !datePattern.test(cleanVotingStart)) {
        Alert.alert('Invalid voting start date', 'Use MM/DD/YYYY format.');
        return;
      }

      if (cleanVotingEnd && !datePattern.test(cleanVotingEnd)) {
        Alert.alert('Invalid voting end date', 'Use MM/DD/YYYY format.');
        return;
      }

      if (cleanVotingStart && cleanVotingEnd && new Date(cleanVotingEnd) <= new Date(cleanVotingStart)) {
        Alert.alert('Invalid voting dates', 'Voting end date must be after the voting start date.');
        return;
      }
    }

    setHostSaving(true);

    const updatePayload = {
      name: hostClubName.trim(),
      max_members: maxMembersNum,
      goal_finish_date: cleanGoalDate || null,
    };

    if (clubSettings?.first_book_mode === 'vote' && !votingHasEnded) {
      updatePayload.voting_starts_at = cleanVotingStart || null;
      updatePayload.voting_ends_at = cleanVotingEnd || null;
    }

    const { error } = await supabase
      .from('clubs')
      .update(updatePayload)
      .eq('id', id);

    setHostSaving(false);

    if (error) {
      Alert.alert('Save failed', error.message);
      return;
    }

    await loadClubSettings();
    Alert.alert('Saved', 'Club settings updated.');
  };

  const renderProgressBar = (percent, variant = 'gold') => (
    <View style={styles.progressTrack}>
      <View
        style={[
          styles.progressFill,
          variant === 'green' && styles.progressFillGreen,
          { width: `${Math.min(percent, 100)}%` },
        ]}
      />
    </View>
  );

  const ProgressCircle = ({ label, value, percent, variant = 'gold' }) => {
    const size = 132;
    const strokeWidth = 8;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const clampedPercent = Math.max(0, Math.min(percent, 100));
    const strokeDashoffset = circumference - (circumference * clampedPercent) / 100;
    const progressColor = variant === 'green' ? theme.colors.success : theme.colors.gold;

    return (
      <View style={styles.progressCircleWrap}>
        <Svg width={size} height={size} style={styles.progressCircleSvg}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={theme.colors.surface}
            strokeWidth={strokeWidth}
            fill="none"
          />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={progressColor}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            rotation="-90"
            origin={`${size / 2}, ${size / 2}`}
          />
        </Svg>

        <View style={styles.progressCircleContent}>
          <Text style={styles.progressCircleValue}>{value}</Text>
          <Text style={styles.progressCircleLabel}>{label}</Text>
        </View>
      </View>
    );
  };

  const renderHeader = () => (
    <View style={styles.headerCard}>
      <View style={styles.headerTopRow}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>‹</Text>
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={styles.clubNameHeader} numberOfLines={1}>
            {clubSettings?.name || name}
          </Text>
          <Text style={styles.clubStatusHeader} numberOfLines={1}>
            {total > 0 ? currentBookTitle : votingStatusText || 'Voting not started'}
          </Text>
        </View>

        <View style={styles.rolePill}>
          <Text style={styles.rolePillText}>{isHost ? 'HOST' : 'MEMBER'}</Text>
        </View>
      </View>
    </View>
  );

  const renderTabs = () => (
    <View style={styles.tabRow}>
      {[
        { key: 'book', label: 'Book' },
        { key: 'chat', label: 'Chat' },
        { key: 'vote', label: 'Vote' },
        { key: 'members', label: 'Members' },
      ].map((tab) => (
        <TouchableOpacity
          key={tab.key}
          style={[styles.tabButton, activeTab === tab.key && styles.activeTabButton]}
          onPress={() => setActiveTab(tab.key)}
        >
          <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderBookHero = () => {
    const hasActiveBook = total > 0 && currentBookTitle !== 'Voting not started';

    if (!hasActiveBook && clubSettings?.first_book_mode === 'vote') {
      return (
        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View style={styles.votingIconCircle}>
              <Text style={styles.votingIcon}>🗳️</Text>
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.cardLabel}>BOOK SELECTION</Text>
              <Text style={styles.heroTitle}>{votingStatusText || 'Voting not started'}</Text>
              <Text style={styles.heroSubtitle}>
                {winningBook
                  ? `Leading: ${winningBook.title}`
                  : 'Members can suggest and vote on the first book.'}
              </Text>
            </View>
          </View>

          <TouchableOpacity style={styles.primaryButton} onPress={() => setActiveTab('vote')}>
            <Text style={styles.primaryButtonText}>Go to Voting</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.heroCard}>
        <View style={styles.heroTopRow}>
          {currentBookCover ? (
            <Image source={{ uri: currentBookCover }} style={styles.bookCover} />
          ) : (
            <View style={styles.bookCoverPlaceholder}>
              <Text style={styles.bookCoverText}>📖</Text>
            </View>
          )}

          <View style={{ flex: 1 }}>
            <Text style={styles.cardLabel}>CURRENT BOOK</Text>
            <Text style={styles.heroTitle} numberOfLines={2}>
              {currentBookTitle}
            </Text>
            {currentBookAuthor ? (
              <Text style={styles.heroSubtitle} numberOfLines={1}>
                {currentBookAuthor}
              </Text>
            ) : null}
          </View>
        </View>

        <View style={styles.progressTextRow}>
          <Text style={styles.progressText}>
            Chapter {current} of {total || '?'}
          </Text>
          <Text style={styles.progressPercent}>{userPercent}%</Text>
        </View>
        {renderProgressBar(userPercent)}

        <TouchableOpacity
          style={[
            styles.chapterConfirmButton,
            confirmingChapter && styles.chapterConfirmButtonActive,
            current >= total && styles.chapterConfirmButtonDone,
          ]}
          onPress={handleChapterCompletePress}
          disabled={current >= total}
          activeOpacity={0.86}
        >
          {current < total && (
            <View
              style={[
                styles.chapterConfirmIcon,
                confirmingChapter && styles.chapterConfirmIconActive,
              ]}
            >
              <Text
                style={[
                  styles.chapterConfirmIconText,
                  confirmingChapter && styles.chapterConfirmIconTextActive,
                ]}
              >
                {confirmingChapter ? '!' : '✓'}
              </Text>
            </View>
          )}

          <View style={{ flex: 1 }}>
            <Text
              style={[
                styles.chapterConfirmLabel,
                confirmingChapter && styles.chapterConfirmLabelActive,
                current >= total && styles.chapterConfirmLabelDone,
              ]}
            >
              {current >= total
                ? 'Book Complete!'
                : confirmingChapter
                ? 'Tap again to confirm'
                : `Chapter ${current + 1} Complete`}
            </Text>
            {current < total && (
              <Text
                style={[
                  styles.chapterConfirmSubtext,
                  confirmingChapter && styles.chapterConfirmSubtextActive,
                ]}
              >
                {confirmingChapter
                  ? 'This will unlock the next chapter chat.'
                  : 'Finished this chapter?'}
              </Text>
            )}
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  const renderBookTab = () => (
    <View>
      <View style={styles.progressCircleCard}>
        <Text style={styles.cardLabel}>BOOK PROGRESS</Text>

        <View style={styles.progressCircleRow}>
          <ProgressCircle label="YOUR PROGRESS" value={`${userPercent}%`} percent={userPercent} />
          <ProgressCircle
            label="GROUP AVG"
            value={`${groupPercent}%`}
            percent={groupPercent}
            variant="green"
          />
        </View>

        <View style={styles.progressCircleDetailsRow}>
          <Text style={styles.progressCircleDetail}>Chapter {current}/{total || '?'}</Text>
          <Text style={styles.progressCircleDetail}>Chapter {groupAverage.toFixed(1)}/{total || '?'}</Text>
        </View>
      </View>

      {expectedChapter != null && (
        <View style={styles.paceCard}>
          <View style={styles.paceTopRow}>
            <Text style={styles.cardLabel}>READING PACE</Text>

            <View style={[styles.paceStatusPill, { borderColor: paceColor }]}>
              <Text style={[styles.paceStatusText, { color: paceColor }]}>{paceStatus}</Text>
            </View>
          </View>

          <Text style={styles.paceMainText}>Target chapter today: {expectedChapter}</Text>
          <Text style={styles.paceSubtext}>You are currently on chapter {current}.</Text>

          <Text style={[styles.paceDifference, { color: paceColor }]}>
            {chapterDifference > 0
              ? `${chapterDifference} chapter${chapterDifference === 1 ? '' : 's'} ahead`
              : chapterDifference < 0
              ? `${Math.abs(chapterDifference)} chapter${Math.abs(chapterDifference) === 1 ? '' : 's'} behind`
              : 'Exactly on pace'}
          </Text>

          <View style={styles.paceDivider} />

          <View style={styles.paceStatsRow}>
            <View style={styles.paceStatBlock}>
              <Text style={styles.paceStatValue}>{chaptersPerWeek || '—'}</Text>
              <Text style={styles.paceStatLabel}>Chapters / week</Text>
            </View>

            <View style={styles.paceStatBlock}>
              <Text style={styles.paceStatValue}>{pagesPerDay || '—'}</Text>
              <Text style={styles.paceStatLabel}>Pages / day</Text>
            </View>
          </View>
        </View>
      )}

      <TouchableOpacity style={styles.discussionShortcut} onPress={() => setActiveTab('chat')}>
        <View>
          <Text style={styles.cardLabel}>NEXT CHAT</Text>
          <Text style={styles.shortcutTitle}>
            {current > 0 ? `Chapter ${getChatKeyForChapter(current)} Chat` : 'Main Chat'}
          </Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>

      {isHost && (
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.hostToolsHeader}
            onPress={() => setShowHostTools(!showHostTools)}
          >
            <View>
              <Text style={styles.cardLabel}>HOST TOOLS</Text>
              <Text style={styles.hostToolsTitle}>Club settings</Text>
            </View>
            <Text style={styles.chevron}>{showHostTools ? '⌄' : '›'}</Text>
          </TouchableOpacity>

          {showHostTools && (
            <View style={styles.hostToolsBody}>
              {clubSettings?.visibility !== 'public' && (
                <View style={styles.hostToolPlainBlock}>
                  <Text style={styles.hostToolLabel}>INVITE CODE</Text>
                  <Text style={styles.inviteCodeText}>{clubSettings?.join_code || joinCode || 'N/A'}</Text>
                  <Text style={styles.hostToolSubtext}>Share this with people you want to invite.</Text>
                </View>
              )}

              <View style={styles.hostDivider} />

              <Text style={styles.hostSectionTitle}>Edit Club Settings</Text>

              <Text style={styles.hostInputLabel}>Club Name</Text>
              <TextInput
                value={hostClubName}
                onChangeText={setHostClubName}
                placeholder="Club name"
                placeholderTextColor={theme.colors.textMuted}
                style={styles.hostInput}
              />

              <Text style={styles.hostInputLabel}>Max Members</Text>
              <TextInput
                value={hostMaxMembers}
                onChangeText={setHostMaxMembers}
                keyboardType="numeric"
                placeholder="Max members"
                placeholderTextColor={theme.colors.textMuted}
                style={styles.hostInput}
              />

              {total > 0 && currentBookTitle !== 'Voting not started' && (
                <>
                  <Text style={styles.hostInputLabel}>Goal Finish Date</Text>
                  <TextInput
                    value={hostGoalFinishDate}
                    onChangeText={setHostGoalFinishDate}
                    placeholder="MM/DD/YYYY"
                    placeholderTextColor={theme.colors.textMuted}
                    style={styles.hostInput}
                  />
                  <Text style={styles.hostInputHelp}>Used for pacing and reading goals.</Text>
                </>
              )}

              {clubSettings?.first_book_mode === 'vote' && (
                <>
                  <Text style={styles.hostInputLabel}>Voting Dates</Text>

                  {!votingHasEnded ? (
                    <>
                      <TextInput
                        value={hostVotingStartDate}
                        onChangeText={setHostVotingStartDate}
                        placeholder="Voting starts: MM/DD/YYYY"
                        placeholderTextColor={theme.colors.textMuted}
                        style={styles.hostInput}
                      />
                      <TextInput
                        value={hostVotingEndDate}
                        onChangeText={setHostVotingEndDate}
                        placeholder="Voting ends: MM/DD/YYYY"
                        placeholderTextColor={theme.colors.textMuted}
                        style={[styles.hostInput, styles.hostInputStacked]}
                      />
                      <Text style={styles.hostInputHelp}>Voting dates can be edited until voting has closed.</Text>
                    </>
                  ) : (
                    <Text style={styles.hostToolSubtext}>Voting has closed, so these dates are locked.</Text>
                  )}
                </>
              )}

              <View style={styles.hostInlineSettingRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.hostInputLabel}>Joining</Text>
                  <Text style={styles.hostToolSubtext}>
                    {clubSettings?.voting_locked
                      ? 'New members cannot join right now.'
                      : 'New members can join if the club is not full.'}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.hostInlineButton}
                  onPress={async () => {
                    const nextValue = !clubSettings?.voting_locked;

                    const { error } = await supabase
                      .from('clubs')
                      .update({ voting_locked: nextValue })
                      .eq('id', id);

                    if (error) {
                      Alert.alert('Error', error.message);
                      return;
                    }

                    await loadClubSettings();
                  }}
                >
                  <Text style={styles.hostInlineButtonText}>
                    {clubSettings?.voting_locked ? 'Unlock' : 'Lock'}
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.hostSaveButton, hostSaving && styles.hostSaveButtonDisabled]}
                onPress={saveHostSettings}
                disabled={hostSaving}
              >
                <Text style={styles.hostSaveButtonText}>{hostSaving ? 'Saving...' : 'Save Settings'}</Text>
              </TouchableOpacity>

              <View style={styles.hostDivider} />

              <TouchableOpacity
                style={styles.deleteClubPlainButton}
                onPress={() => {
                  Alert.alert(
                    'Delete Club',
                    'This permanently deletes the club, members, messages, votes, and suggestions.',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Delete',
                        style: 'destructive',
                        onPress: async () => {
                          await supabase.from('messages').delete().eq('club_id', id);
                          await supabase.from('book_votes').delete().eq('club_id', id);
                          await supabase.from('book_suggestions').delete().eq('club_id', id);
                          await supabase.from('members').delete().eq('club_id', id);

                          const { error } = await supabase.from('clubs').delete().eq('id', id);

                          if (error) {
                            Alert.alert('Delete failed', error.message);
                            return;
                          }

                          router.back();
                        },
                      },
                    ]
                  );
                }}
              >
                <Text style={styles.deleteClubRowTitle}>Delete Club</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </View>
  );

  const renderChatTab = () => {
    const chapterGroups = getChapterGroups(Math.max(total, 0));

    return (
      <View style={styles.chatTabWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chapterScroller}
          contentContainerStyle={styles.chapterScrollerContent}
        >
          <TouchableOpacity
            style={[styles.chapterChip, selectedChat === 'main' && styles.chapterChipActive]}
            onPress={() => setSelectedChat('main')}
          >
            <Text
              style={[
                styles.chapterChipText,
                selectedChat === 'main' && styles.chapterChipTextActive,
              ]}
            >
              Main
            </Text>
          </TouchableOpacity>

          {chapterGroups.map((group) => {
            const locked = group.end > current;
            const active = selectedChat === group.key;

            return (
              <TouchableOpacity
                key={group.key}
                style={[styles.chapterChip, active && styles.chapterChipActive, locked && styles.chapterChipLocked]}
                onPress={() => {
                  if (!locked) setSelectedChat(group.key);
                }}
              >
                <Text style={[styles.chapterChipText, active && styles.chapterChipTextActive]}>
                  {group.label} {locked ? '🔒' : ''}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.chatMessagesArea}>
          <ScrollView
            ref={chatScrollRef}
            style={styles.chatMessagesScroll}
            contentContainerStyle={styles.chatMessagesContent}
            nestedScrollEnabled
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => chatScrollRef.current?.scrollToEnd({ animated: true })}
          >
            {messages.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>No messages yet.</Text>
                <Text style={styles.emptyText}>Start the conversation when you’re ready.</Text>
              </View>
            ) : (
              messages.map((message) => {
                const isMine = message.user === profile?.display_name;
                const canDelete = isHost || isMine;

                return (
                  <TouchableOpacity
                    key={message.id}
                    style={[styles.messageRow, isMine ? styles.messageRowMine : styles.messageRowOther]}
                    onLongPress={() => openMessageActions(message)}
                    activeOpacity={canDelete ? 0.82 : 1}
                  >
                    <View style={[styles.messageBubble, isMine && styles.messageBubbleMine]}>
                      {!isMine && <Text style={styles.messageUser}>{message.user}</Text>}
                      <Text style={[styles.messageText, isMine && styles.messageTextMine]}>{message.text}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        </View>

        <View style={styles.messageInputRow}>
          <TextInput
            value={messageInput}
            onChangeText={setMessageInput}
            placeholder="Message..."
            placeholderTextColor={theme.colors.textMuted}
            style={styles.messageInput}
          />
          <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderVoteTab = () => {
    const mySuggestion = sortedSuggestions.find(
      (item) =>
        String(item.suggestedBy || '').trim().toLowerCase() ===
        String(profile?.display_name || '').trim().toLowerCase()
    );
    const myVote = sortedSuggestions.find((item) => item.votedByYou);
    const canChangeSuggestion = !mySuggestion || Number(mySuggestion.votes || 0) === 0;
    const hasActiveBook = total > 0 && currentBookTitle !== 'Voting not started';

    return (
      <View>
        <View style={styles.voteStatusCardCompact}>
          <View>
            <Text style={styles.cardLabel}>BOOK VOTE</Text>
            <Text style={styles.voteCompactTitle}>
              {hasActiveBook
                ? 'Book selected'
                : votingOpen
                ? 'Voting is open'
                : votingHasEnded
                ? 'Voting closed'
                : 'Voting not open yet'}
            </Text>
          </View>

          {!hasActiveBook && votingOpen && votingEndsAt && (
            <View style={styles.daysPill}>
              <Text style={styles.daysPillText}>{votingStatusText}</Text>
            </View>
          )}
        </View>

        {winningBook && !hasActiveBook && (
          <View style={styles.voteLeaderCard}>
            <View style={styles.voteLeaderBadge}>
              <Text style={styles.voteLeaderBadgeText}>LEADING</Text>
            </View>

            {winningBook.coverUrl ? (
              <Image source={{ uri: winningBook.coverUrl }} style={styles.voteLeaderCover} />
            ) : (
              <View style={styles.voteLeaderCoverFallback}>
                <Text style={styles.searchCoverText}>📖</Text>
              </View>
            )}

            <View style={{ flex: 1 }}>
              <Text style={styles.voteLeaderTitle} numberOfLines={2}>{winningBook.title}</Text>
              {winningBook.author ? <Text style={styles.voteLeaderAuthor} numberOfLines={1}>{winningBook.author}</Text> : null}
              <Text style={styles.voteLeaderVotes}>{winningBook.votes} vote{winningBook.votes === 1 ? '' : 's'}</Text>
            </View>
          </View>
        )}

        {winningBook && isHost && votingOpen && !hasActiveBook && (
          <View style={styles.winnerCard}>
            <Text style={styles.cardLabel}>HOST ACTION</Text>
            <Text style={styles.winnerTitle}>End voting now</Text>
            <TouchableOpacity style={styles.primaryButton} onPress={endVotingNow}>
              <Text style={styles.primaryButtonText}>End Voting</Text>
            </TouchableOpacity>
          </View>
        )}

        {winningBook && isHost && votingHasEnded && !hasActiveBook && (
          <View style={styles.winnerCard}>
            <Text style={styles.cardLabel}>HOST ACTION</Text>
            <Text style={styles.winnerTitle}>Start winning book</Text>
            <Text style={styles.cardSubtext}>Enter the total chapters manually before starting {winningBook.title}.</Text>
            <TextInput
              value={winningBookChapters}
              onChangeText={setWinningBookChapters}
              keyboardType="numeric"
              placeholder="Total chapters required"
              placeholderTextColor={theme.colors.textMuted}
              style={styles.fullInput}
            />
            <TouchableOpacity style={styles.primaryButton} onPress={startWinningBook}>
              <Text style={styles.primaryButtonText}>Start This Book</Text>
            </TouchableOpacity>
          </View>
        )}

        {votingOpen && !hasActiveBook && (
          <>
            <View style={styles.voteSearchCard}>
              <Text style={styles.cardLabel}>SEARCH BOOKS</Text>
              <Text style={styles.voteSmallHelp}>Search for the book you want, then select the correct result.</Text>

              {mySuggestion && (
                <View style={styles.mySuggestionPill}>
                  <Text style={styles.mySuggestionText} numberOfLines={1}>Your suggestion: {mySuggestion.title}</Text>
                </View>
              )}

              {canChangeSuggestion ? (
                <>
                  <View style={styles.searchRow}>
                    <TextInput
                      value={bookSuggestion}
                      onChangeText={(text) => {
                        setBookSuggestion(text);
                        if (!text.trim()) setBookSearchResults([]);
                      }}
                      placeholder="Search title or author..."
                      placeholderTextColor={theme.colors.textMuted}
                      style={styles.searchInput}
                      returnKeyType="search"
                      onSubmitEditing={searchBooksForSuggestion}
                    />
                    <TouchableOpacity style={styles.searchButton} onPress={searchBooksForSuggestion}>
                      {searchingBooks ? <ActivityIndicator color={theme.colors.onAccent} /> : <Text style={styles.searchButtonText}>Search</Text>}
                    </TouchableOpacity>
                  </View>

                  {bookSearchResults.map((result) => (
                    <View key={result.id} style={styles.searchResultCard}>
                      {result.coverUrl ? (
                        <Image source={{ uri: result.coverUrl }} style={styles.searchCover} />
                      ) : (
                        <View style={styles.searchCoverPlaceholder}><Text style={styles.searchCoverText}>📖</Text></View>
                      )}
                      <View style={{ flex: 1 }}>
                        <Text style={styles.searchTitle} numberOfLines={2}>{result.title}</Text>
                        {result.author ? <Text style={styles.searchAuthor} numberOfLines={1}>{result.author}</Text> : null}
                        {result.pageCount ? <Text style={styles.searchMeta}>{result.pageCount} pages</Text> : null}
                      </View>
                      <TouchableOpacity style={styles.voteButton} onPress={() => addBookSuggestion(result)}>
                        <Text style={styles.voteButtonText}>{mySuggestion ? 'Change' : 'Suggest'}</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </>
              ) : (
                <Text style={styles.lockedSuggestionText}>Your suggestion has votes, so it is locked for this round.</Text>
              )}
            </View>

            {canChangeSuggestion && (
              <View style={styles.manualAddCard}>
                <Text style={styles.cardLabel}>ADD MANUALLY</Text>
                <Text style={styles.voteSmallHelp}>Use this only if the book does not show up in search.</Text>
                <View style={styles.searchRow}>
                  <TextInput
                    value={manualBookTitle}
                    onChangeText={setManualBookTitle}
                    placeholder="Type exact book title..."
                    placeholderTextColor={theme.colors.textMuted}
                    style={styles.searchInput}
                  />
                  <TouchableOpacity style={styles.searchButton} onPress={addManualSuggestion}>
                    <Text style={styles.searchButtonText}>Add</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </>
        )}

        <View style={styles.sectionHeaderRowCompact}>
          <Text style={styles.sectionTitle}>Suggestions</Text>
          <Text style={styles.countPill}>{sortedSuggestions.length}</Text>
        </View>

        {myVote && votingOpen && !hasActiveBook && (
          <Text style={styles.voteChangeHint}>Your vote: {myVote.title}. Tap a different book to change it.</Text>
        )}

        {sortedSuggestions.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No suggestions yet.</Text>
            <Text style={styles.emptyText}>Search for a book to get voting started.</Text>
          </View>
        ) : (
          sortedSuggestions.map((item, index) => (
            <View key={item.id} style={[styles.suggestionCard, index === 0 && styles.topSuggestionCard]}>
              <View style={styles.rankCircle}><Text style={styles.rankText}>{index + 1}</Text></View>
              {item.coverUrl ? (
                <Image source={{ uri: item.coverUrl }} style={styles.suggestionCover} />
              ) : (
                <View style={styles.suggestionCoverPlaceholder}><Text style={styles.searchCoverText}>📖</Text></View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.suggestionTitle} numberOfLines={2}>{item.title}</Text>
                {item.author ? <Text style={styles.suggestionMeta} numberOfLines={1}>{item.author}</Text> : null}
                <Text style={styles.suggestionMeta}>Suggested by {item.suggestedBy}</Text>
                <Text style={styles.suggestionVotes}>{item.votes} vote{item.votes === 1 ? '' : 's'}</Text>
              </View>
              {!hasActiveBook && votingOpen && (
                <TouchableOpacity
                  style={[styles.voteButton, item.votedByYou && styles.votedButton]}
                  onPress={() => voteForBook(item.id)}
                >
                  <Text style={[styles.voteButtonText, item.votedByYou && styles.votedButtonText]}>{item.votedByYou ? 'Voted' : 'Vote'}</Text>
                </TouchableOpacity>
              )}
            </View>
          ))
        )}
      </View>
    );
  };

  const renderMembersTab = () => {
    const averageChapter = members.length > 0 ? groupAverage.toFixed(1) : '0';

    return (
      <View>
        <View style={styles.membersHeroCard}>
          <View style={styles.memberStatBlock}>
            <Text style={styles.memberStatValue}>{members.length}</Text>
            <Text style={styles.memberStatLabel}>Members</Text>
          </View>
          <View style={styles.memberStatDivider} />
          <View style={styles.memberStatBlock}>
            <Text style={styles.memberStatValue}>{averageChapter}</Text>
            <Text style={styles.memberStatLabel}>Avg Ch.</Text>
          </View>
        </View>

        

        {sortedMembers.map((member, index) => {
          const isCurrentUser = member.id === currentMember?.id;
          const memberPercent = total > 0 ? Math.round((Number(member.current_chapter || 0) / total) * 100) : 0;
          const memberProfile = member.user_id ? memberProfiles[member.user_id] : null;
          const memberCurrentStreak = Number(memberProfile?.current_streak || 0);
          const memberBestStreak = Number(memberProfile?.best_streak || 0);

          return (
            <TouchableOpacity
              key={member.id}
              style={[styles.memberCard, isCurrentUser && styles.memberCardCurrent, index === 0 && styles.memberCardLeader]}
              onPress={() => openMemberProfile(member)}
              onLongPress={() => openMemberActions(member)}
              activeOpacity={isHost && !isCurrentUser ? 0.82 : 1}
            >

              <View style={styles.memberAvatar}>
                <Text style={styles.memberAvatarText}>{member.name?.charAt(0)?.toUpperCase() || '?'}</Text>
              </View>

              <View style={{ flex: 1 }}>
                <View style={styles.memberNameRow}>
                  <Text style={styles.memberName} numberOfLines={1}>{member.name}</Text>
                  {member.role === 'host' && (
                    <View style={styles.hostMiniPill}><Text style={styles.hostMiniPillText}>HOST</Text></View>
                  )}
                </View>

                <Text style={styles.memberMeta}>Chapter {member.current_chapter || 0} of {total || '?'}</Text>

                <View style={styles.memberProgressTrack}>
                  <View style={[styles.memberProgressFill, { width: `${Math.min(memberPercent, 100)}%` }]} />
                </View>
              </View>

              <View style={styles.memberRightColumn}>
                <Text style={styles.memberStreak}>{getStreakEmoji(memberCurrentStreak)} {memberCurrentStreak}</Text>
                <Text style={styles.memberBestStreak}>Best {getStreakEmoji(memberBestStreak)} {memberBestStreak}</Text>
              </View>
            </TouchableOpacity>
          );
        })}

        {!isHost && currentMember && (
          <TouchableOpacity style={styles.leaveButton} onPress={leaveClub}>
            <Text style={styles.leaveButtonText}>Leave Club</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <ThemedBackground>
        <SafeAreaView style={styles.loadingPage} edges={['top']}>
          <ActivityIndicator size="large" color={theme.colors.gold} />
          <Text style={styles.loadingText}>Loading club...</Text>
        </SafeAreaView>
      </ThemedBackground>
    );
  }

  return (
    <ThemedBackground>
    <SafeAreaView style={styles.page} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.keyboardWrap}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {activeTab === 'chat' ? (
          <View style={styles.chatScreenContent}>
            {renderHeader()}
            {renderTabs()}
            {renderChatTab()}
          </View>
        ) : (
          <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {renderHeader()}
            {activeTab === 'book' && renderBookHero()}
            {renderTabs()}
            {activeTab === 'book' && renderBookTab()}
            {activeTab === 'vote' && renderVoteTab()}
            {activeTab === 'members' && renderMembersTab()}
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
    </ThemedBackground>
  );
}

const getStyles = (theme) =>
  StyleSheet.create({
  page: { flex: 1, backgroundColor: 'transparent' },
  keyboardWrap: { flex: 1 },
  loadingPage: {
    flex: 1,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: { color: theme.colors.textSecondary, marginTop: 12, fontWeight: '800' },
  container: { flex: 1 },
  content: { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 120 },
  chatScreenContent: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 8,
  },

  headerCard: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 22,
    padding: 13,
    marginBottom: 12,
  },
  headerTopRow: { flexDirection: 'row', alignItems: 'center' },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.softBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  backButtonText: { color: theme.colors.gold, fontSize: 28, fontWeight: '900', marginTop: -2 },
  clubNameHeader: { color: theme.colors.textPrimary, fontSize: 22, fontFamily: FONTS.title },
  clubStatusHeader: { color: theme.colors.textSecondary, marginTop: 2, fontWeight: '700' },
  rolePill: {
    backgroundColor: theme.colors.gold,
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: 999,
  },
  rolePillText: { color: theme.colors.onAccent, fontWeight: '900', fontSize: 10 },

  heroCard: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 26,
    padding: 16,
    marginBottom: 14,
  },
  heroTopRow: { flexDirection: 'row', alignItems: 'center' },
  bookCover: { width: 70, height: 104, borderRadius: 11, marginRight: 13 },
  bookCoverPlaceholder: {
    width: 70,
    height: 104,
    borderRadius: 11,
    marginRight: 13,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.softBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookCoverText: { fontSize: 28 },
  cardLabel: { color: theme.colors.gold, fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  heroTitle: { color: theme.colors.textPrimary, fontSize: 22, fontWeight: '900', marginTop: 5, lineHeight: 27 },
  heroSubtitle: { color: theme.colors.textSecondary, fontWeight: '800', marginTop: 5 },
  votingIconCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  votingIcon: { fontSize: 26 },

  progressTextRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 14 },
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
  progressFillGreen: { backgroundColor: theme.colors.success },

  primaryButton: {
    backgroundColor: theme.colors.gold,
    paddingVertical: 13,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 15,
  },
  primaryButtonText: { color: theme.colors.onAccent, fontWeight: '900' },

  chapterConfirmButton: {
    backgroundColor: theme.colors.gold,
    borderRadius: 18,
    minHeight: 64,
    marginTop: 15,
    paddingVertical: 9,
    paddingLeft: 9,
    paddingRight: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chapterConfirmButtonActive: {
    backgroundColor: theme.colors.deepForest,
    borderWidth: 1,
    borderColor: theme.colors.gold,
  },
  chapterConfirmButtonDone: {
    backgroundColor: theme.colors.deepForest,
    borderWidth: 1,
    borderColor: theme.colors.gold,
    justifyContent: 'center',
  },
  chapterConfirmIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: theme.colors.deepForest,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  chapterConfirmIconActive: { backgroundColor: theme.colors.gold },
  chapterConfirmIconText: { color: theme.colors.gold, fontWeight: '900', fontSize: 18 },
  chapterConfirmIconTextActive: { color: theme.colors.onAccent },
  chapterConfirmLabel: { color: theme.colors.onAccent, fontWeight: '900', fontSize: 15 },
  chapterConfirmLabelActive: { color: theme.colors.gold },
  chapterConfirmLabelDone: { color: theme.colors.gold, textAlign: 'center', fontSize: 16 },
  chapterConfirmSubtext: {
    color: theme.colors.onAccent,
    opacity: 0.75,
    fontWeight: '800',
    fontSize: 11,
    marginTop: 2,
  },
  chapterConfirmSubtextActive: { color: theme.colors.gold, opacity: 1 },

  tabRow: {
    flexDirection: 'row',
    backgroundColor: theme.colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 4,
    marginBottom: 14,
  },
  tabButton: { flex: 1, paddingVertical: 10, borderRadius: 14, alignItems: 'center' },
  activeTabButton: { backgroundColor: theme.colors.gold },
  tabText: { color: theme.colors.textMuted, fontWeight: '900', fontSize: 13 },
  activeTabText: { color: theme.colors.onAccent },

  card: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 20,
    padding: 14,
    marginBottom: 12,
  },
  cardTitle: { color: theme.colors.textPrimary, fontSize: 18, fontWeight: '900', marginTop: 5 },
  cardSubtext: { color: theme.colors.textSecondary, marginTop: 6, fontWeight: '700', lineHeight: 19 },

  progressCircleCard: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 20,
    padding: 14,
    marginBottom: 12,
  },
  progressCircleRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginTop: 12,
  },
  progressCircleWrap: { width: 142, height: 142, alignItems: 'center', justifyContent: 'center' },
  progressCircleSvg: { position: 'absolute' },
  progressCircleContent: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.softBorder,
    paddingHorizontal: 4,
  },
  progressCircleValue: { color: theme.colors.textPrimary, fontSize: 25, fontWeight: '900' },
  progressCircleLabel: {
    color: theme.colors.textSecondary,
    fontSize: 8,
    fontWeight: '900',
    marginTop: 2,
    textAlign: 'center',
  },
  progressCircleDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 4,
    gap: 8,
  },
  progressCircleDetail: {
    flex: 1,
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
  },

  paceCard: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 20,
    padding: 14,
    marginBottom: 12,
  },
  paceTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paceStatusPill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  paceStatusText: {
    fontWeight: '900',
    fontSize: 11,
  },
  paceMainText: {
    color: theme.colors.textPrimary,
    fontSize: 20,
    fontWeight: '900',
    marginTop: 10,
  },
  paceSubtext: {
    color: theme.colors.textSecondary,
    fontWeight: '700',
    marginTop: 5,
  },
  paceDifference: {
    fontWeight: '900',
    marginTop: 10,
  },
  paceDivider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: 12,
  },
  paceStatsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  paceStatBlock: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.softBorder,
    borderRadius: 14,
    padding: 11,
    alignItems: 'center',
  },
  paceStatValue: {
    color: theme.colors.gold,
    fontSize: 18,
    fontWeight: '900',
  },
  paceStatLabel: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    fontWeight: '800',
    marginTop: 3,
    textAlign: 'center',
  },

  discussionShortcut: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 20,
    padding: 14,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  shortcutTitle: { color: theme.colors.textPrimary, fontSize: 18, fontWeight: '900', marginTop: 5 },
  chevron: { color: theme.colors.gold, fontSize: 24, fontWeight: '900' },

  hostToolsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  hostToolsTitle: { color: theme.colors.textPrimary, fontWeight: '900', marginTop: 5 },
  hostToolsBody: { marginTop: 14, borderTopWidth: 1, borderTopColor: theme.colors.border, paddingTop: 14 },
  secondaryButton: {
    borderWidth: 1,
    borderColor: theme.colors.gold,
    borderRadius: 14,
    paddingVertical: 11,
    alignItems: 'center',
    marginTop: 12,
  },
  secondaryButtonText: { color: theme.colors.gold, fontWeight: '900' },
  deleteClubButton: {
    borderColor: theme.colors.danger,
  },
  deleteClubButtonText: {
    color: theme.colors.danger,
    fontWeight: '900',
  },
  hostToolInfoCard: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.softBorder,
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  hostToolLabel: {
    color: theme.colors.gold,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  hostToolValue: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '900',
    marginTop: 4,
  },
  hostToolSubtext: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
    lineHeight: 17,
  },
  hostInlineButton: {
    backgroundColor: theme.colors.gold,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginLeft: 12,
  },
  hostInlineButtonText: {
    color: theme.colors.onAccent,
    fontSize: 12,
    fontWeight: '900',
  },
  hostToolRow: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  hostToolRowTitle: {
    color: theme.colors.textPrimary,
    fontSize: 15,
    fontWeight: '900',
  },
  hostToolRowSubtext: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 3,
    lineHeight: 17,
    paddingRight: 8,
  },
  deleteClubRow: {
    borderColor: theme.colors.danger,
  },
  deleteClubRowTitle: {
    color: theme.colors.danger,
    fontSize: 15,
    fontWeight: '900',
  },
  inviteCodeBox: {
    backgroundColor: theme.colors.surface,
    borderRadius: 14,
    padding: 13,
    alignItems: 'center',
    marginTop: 10,
  },
  inviteCodeText: { color: theme.colors.gold, fontWeight: '900', fontSize: 22, letterSpacing: 2, marginTop: 4 },
  hostToolPlainBlock: {
    marginBottom: 12,
  },
  hostDivider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: 14,
  },
  hostSectionTitle: {
    color: theme.colors.textPrimary,
    fontSize: 17,
    fontWeight: '900',
    marginBottom: 4,
  },
  hostInputLabel: {
    color: theme.colors.textPrimary,
    fontWeight: '900',
    fontSize: 12,
    marginTop: 12,
    marginBottom: 6,
  },
  hostInput: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.softBorder,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 11,
    color: theme.colors.textPrimary,
    fontWeight: '800',
  },
  hostInputStacked: {
    marginTop: 8,
  },
  hostInputHelp: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 5,
    lineHeight: 16,
  },
  hostInlineSettingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  hostSaveButton: {
    backgroundColor: theme.colors.gold,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  hostSaveButtonDisabled: {
    opacity: 0.65,
  },
  hostSaveButtonText: {
    color: theme.colors.onAccent,
    fontWeight: '900',
  },
  deleteClubPlainButton: {
    paddingVertical: 4,
  },

  chatTabWrap: { flex: 1, minHeight: 0 },
  chapterScroller: { maxHeight: 46, marginBottom: 10, flexGrow: 0 },
  chapterScrollerContent: { alignItems: 'center', paddingRight: 10 },
  chapterChip: {
    height: 38,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    marginRight: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chapterChipActive: { backgroundColor: theme.colors.gold, borderColor: theme.colors.gold },
  chapterChipLocked: { opacity: 0.5 },
  chapterChipText: { color: theme.colors.textMuted, fontWeight: '900', fontSize: 12 },
  chapterChipTextActive: { color: theme.colors.onAccent },

  chatMessagesArea: { flex: 1, minHeight: 0, backgroundColor: 'transparent', paddingTop: 4 },
  chatMessagesScroll: { flex: 1 },
  chatMessagesContent: { flexGrow: 1, justifyContent: 'flex-end', paddingBottom: 8 },
  emptyCard: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
  },
  emptyTitle: { color: theme.colors.textPrimary, textAlign: 'center', fontWeight: '900', fontSize: 16 },
  emptyText: { color: theme.colors.textSecondary, textAlign: 'center', fontWeight: '800', marginTop: 4 },
  messageRow: { marginBottom: 10, flexDirection: 'row' },
  messageRowMine: { justifyContent: 'flex-end' },
  messageRowOther: { justifyContent: 'flex-start' },
  messageBubble: {
    maxWidth: '84%',
    backgroundColor: theme.colors.card,
    borderRadius: 18,
    borderTopLeftRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  messageBubbleMine: {
    backgroundColor: theme.colors.gold,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 6,
  },
  messageUser: { color: theme.colors.textPrimary, fontWeight: '900', fontSize: 12, marginBottom: 4 },
  messageText: { color: theme.colors.textPrimary, lineHeight: 20, fontWeight: '600' },
  messageTextMine: { color: theme.colors.onAccent },
  messageInputRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    backgroundColor: theme.colors.background,
    paddingTop: 8,
    paddingBottom: 4,
  },
  messageInput: {
    flex: 1,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: theme.colors.textPrimary,
  },
  sendButton: {
    backgroundColor: theme.colors.gold,
    borderRadius: 14,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  sendButtonText: { color: theme.colors.onAccent, fontWeight: '900' },

  voteStatusCardCompact: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 22,
    padding: 15,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  voteCompactTitle: { color: theme.colors.textPrimary, fontSize: 21, fontWeight: '900', marginTop: 5 },
  daysPill: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.softBorder,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  daysPillText: { color: theme.colors.gold, fontWeight: '900', fontSize: 11 },
  voteLeaderCard: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.softBorder,
    borderRadius: 22,
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  voteLeaderBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: theme.colors.gold,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    zIndex: 2,
  },
  voteLeaderBadgeText: {
    color: theme.colors.onAccent,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  voteLeaderCover: { width: 58, height: 86, borderRadius: 10, marginRight: 12 },
  voteLeaderCoverFallback: {
    width: 58,
    height: 86,
    borderRadius: 10,
    marginRight: 12,
    backgroundColor: theme.colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voteLeaderTitle: { color: theme.colors.textPrimary, fontWeight: '900', fontSize: 18, paddingRight: 66 },
  voteLeaderAuthor: { color: theme.colors.textSecondary, fontWeight: '700', marginTop: 4 },
  voteLeaderVotes: { color: theme.colors.gold, fontWeight: '900', marginTop: 5 },
  voteSearchCard: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 22,
    padding: 14,
    marginBottom: 12,
  },
  manualAddCard: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 22,
    padding: 14,
    marginBottom: 12,
  },
  voteSmallHelp: { color: theme.colors.textSecondary, fontSize: 12, fontWeight: '700', marginTop: 5, lineHeight: 17 },
  mySuggestionPill: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.softBorder,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 11,
    marginTop: 12,
  },
  mySuggestionText: { color: theme.colors.gold, fontWeight: '900', fontSize: 12 },
  lockedSuggestionText: { color: theme.colors.textSecondary, fontWeight: '800', lineHeight: 19, marginTop: 12 },
  voteChangeHint: {
    color: theme.colors.textSecondary,
    fontWeight: '800',
    fontSize: 12,
    marginTop: -4,
    marginBottom: 10,
    lineHeight: 17,
  },
  winnerCard: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.softBorder,
    borderRadius: 20,
    padding: 14,
    marginBottom: 12,
  },
  winnerTitle: { color: theme.colors.textPrimary, fontSize: 20, fontWeight: '900', marginTop: 5 },
  fullInput: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 14,
    padding: 12,
    color: theme.colors.textPrimary,
    marginTop: 12,
  },
  searchRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  searchInput: {
    flex: 1,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: theme.colors.textPrimary,
  },
  searchButton: {
    backgroundColor: theme.colors.gold,
    borderRadius: 14,
    paddingHorizontal: 13,
    justifyContent: 'center',
  },
  searchButtonText: { color: theme.colors.onAccent, fontWeight: '900' },
  searchResultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 16,
    padding: 10,
    marginTop: 10,
  },
  searchCover: { width: 46, height: 68, borderRadius: 8, marginRight: 10 },
  searchCoverPlaceholder: {
    width: 46,
    height: 68,
    borderRadius: 8,
    marginRight: 10,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchCoverText: { fontSize: 22 },
  searchTitle: { color: theme.colors.textPrimary, fontWeight: '900' },
  searchAuthor: { color: theme.colors.textSecondary, fontSize: 12, marginTop: 3 },
  searchMeta: { color: theme.colors.gold, fontSize: 12, fontWeight: '800', marginTop: 3 },
  voteButton: { backgroundColor: theme.colors.gold, borderRadius: 999, paddingVertical: 8, paddingHorizontal: 12, marginLeft: 8 },
  voteButtonText: { color: theme.colors.onAccent, fontWeight: '900', fontSize: 12 },
  votedButton: { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.gold },
  votedButtonText: { color: theme.colors.gold },
  sectionHeaderRowCompact: { flexDirection: 'row', alignItems: 'center', marginTop: 6, marginBottom: 10 },
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
  topSuggestionCard: { borderColor: theme.colors.gold },
  rankCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 9,
  },
  rankText: { color: theme.colors.gold, fontWeight: '900', fontSize: 12 },
  suggestionCard: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  suggestionCover: { width: 54, height: 80, borderRadius: 9, marginRight: 11 },
  suggestionCoverPlaceholder: {
    width: 54,
    height: 80,
    borderRadius: 9,
    marginRight: 11,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestionTitle: { color: theme.colors.textPrimary, fontWeight: '900' },
  suggestionMeta: { color: theme.colors.textSecondary, marginTop: 3, fontSize: 12, fontWeight: '700' },
  suggestionVotes: { color: theme.colors.gold, marginTop: 3, fontSize: 12, fontWeight: '900' },

  membersHeroCard: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 22,
    padding: 14,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberStatBlock: { flex: 1, alignItems: 'center' },
  memberStatDivider: { width: 1, height: 38, backgroundColor: theme.colors.border, marginHorizontal: 8 },
  memberStatValue: { color: theme.colors.gold, fontSize: 24, fontWeight: '900' },
  memberStatLabel: { color: theme.colors.textSecondary, fontSize: 11, fontWeight: '900', marginTop: 3 },
  memberCard: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 18,
    padding: 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberCardCurrent: { borderColor: theme.colors.softBorder, backgroundColor: theme.colors.surface },
  memberCardLeader: { borderColor: theme.colors.gold },
  memberAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },
  memberAvatarText: { color: theme.colors.gold, fontWeight: '900' },
  memberNameRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  memberName: { color: theme.colors.textPrimary, fontWeight: '900', flexShrink: 1 },
  hostMiniPill: { backgroundColor: theme.colors.gold, borderRadius: 999, paddingHorizontal: 6, paddingVertical: 2 },
  hostMiniPillText: { color: theme.colors.onAccent, fontSize: 8, fontWeight: '900', letterSpacing: 0.5 },
  memberMeta: { color: theme.colors.textSecondary, marginTop: 3, fontSize: 12, fontWeight: '700' },
  memberProgressTrack: {
    height: 5,
    backgroundColor: theme.colors.surface,
    borderRadius: 999,
    marginTop: 7,
    overflow: 'hidden',
  },
  memberProgressFill: { height: '100%', backgroundColor: theme.colors.gold },
  memberRightColumn: { alignItems: 'flex-end', marginLeft: 8 },
  memberStreak: {
    color: theme.colors.gold,
    fontWeight: '900',
    marginBottom: 7,
  },
  memberBestStreak: {
    color: theme.colors.textSecondary,
    fontWeight: '800',
    fontSize: 11,
    marginBottom: 8,
  },
  removeText: { color: theme.colors.danger, fontWeight: '900', fontSize: 12 },
  leaveButton: {
    borderWidth: 1,
    borderColor: theme.colors.danger,
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  leaveButtonText: { color: theme.colors.danger, fontWeight: '900' },
});



