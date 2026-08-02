import { Stack, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AVATARS } from '../lib/avatars';
import ScreenHeader from '../components/ScreenHeader';
import { supabase } from '../lib/supabase';
import { useTheme } from '../lib/theme-context';
import { Theme } from '../lib/themes';

const MAX_GENRES = 5;

const GENRES = [
  'Fantasy',
  'Romance',
  'Thriller',
  'Mystery',
  'Sci-Fi',
  'Young Adult',
  'Self-Help',
  'Horror',
  'Historical Fiction',
  'Contemporary Fiction',
  'Literary Fiction',
  'Adventure',
  'Dystopian',
  'Paranormal',
  'Urban Fantasy',
  'Epic Fantasy',
  'Dark Fantasy',
  'Cozy Mystery',
  'Crime',
  'True Crime',
  'Biography',
  'Memoir',
  'Business',
  'Psychology',
  'Philosophy',
  'Religion',
  'Spirituality',
  'Politics',
  'History',
  'Science',
  'Technology',
  'Health',
  'Fitness',
  'Cooking',
  'Travel',
  'Poetry',
  'Classics',
  'Graphic Novels',
  'Manga',
  "Children's",
  'Education',
  'Humor',
  'Sports',
];

export default function EditProfileScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);

  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [profileId, setProfileId] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [favoriteBook, setFavoriteBook] = useState('');
  const [favoriteGenres, setFavoriteGenres] = useState<string[]>([]);
  const [avatarId, setAvatarId] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);

    const { data: userData } =
      await supabase.auth.getUser();

    if (!userData?.user) {
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userData.user.id)
      .single();

    if (data) {
      setProfileId(data.id);
      setDisplayName(data.display_name || '');
      setBio(data.bio || '');
      setFavoriteBook(data.favorite_book || '');
      setFavoriteGenres(data.favorite_genres || []);
      setAvatarId(data.avatar_id || '');
    }

    setLoading(false);
  };

  const toggleGenre = (genre: string) => {
    setFavoriteGenres((prev) => {
      if (prev.includes(genre)) {
        return prev.filter(
          (g) => g !== genre
        );
      }

      if (
        prev.length >= MAX_GENRES
      ) {
        Alert.alert(
          'Limit reached',
          `You can select up to ${MAX_GENRES} genres.`
        );

        return prev;
      }

      return [...prev, genre];
    });
  };

  const saveProfile = async () => {
    if (!displayName.trim()) {
      Alert.alert(
        'Missing Name',
        'Display name cannot be empty.'
      );

      return;
    }

    setSaving(true);

    const { error } =
      await supabase
        .from('profiles')
        .update({
          display_name:
            displayName.trim(),
          bio: bio.trim(),
          favorite_book:
            favoriteBook.trim(),
          favorite_genres:
            favoriteGenres,
          avatar_id: avatarId,
        })
        .eq('id', profileId);

    setSaving(false);

    if (error) {
      Alert.alert(
        'Save Failed',
        error.message
      );
      return;
    }

    router.back();
  };

  if (loading) {
    return (
      <SafeAreaView
        style={styles.loadingPage}
      >
        <ActivityIndicator
          size="large"
          color={theme.colors.gold}
        />
      </SafeAreaView>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      <SafeAreaView
        style={styles.page}
      >
        <ScrollView
          contentContainerStyle={
            styles.content
          }
        >
          <ScreenHeader title="Edit Profile" />

          <View style={styles.card}>
            <Text style={styles.label}>
              Display Name
            </Text>

            <TextInput
              value={displayName}
              onChangeText={
                setDisplayName
              }
              style={styles.input}
            />

            <Text style={styles.label}>
              Bio
            </Text>

            <TextInput
              value={bio}
              onChangeText={setBio}
              multiline
              style={[
                styles.input,
                styles.bioInput,
              ]}
            />

            <Text style={styles.label}>
              Favorite Book
            </Text>

            <TextInput
              value={favoriteBook}
              onChangeText={
                setFavoriteBook
              }
              style={styles.input}
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>
              Avatar
            </Text>

            <View
              style={
                styles.avatarGrid
              }
            >
              {AVATARS.map(
                (avatar) => {
                  const selected =
                    avatar.id ===
                    avatarId;

                  return (
                    <TouchableOpacity
                      key={
                        avatar.id
                      }
                      style={[
                        styles.avatarOption,
                        selected &&
                          styles.avatarSelected,
                      ]}
                      onPress={() =>
                        setAvatarId(
                          avatar.id
                        )
                      }
                    >
                      <Text
                        style={
                          styles.avatarEmoji
                        }
                      >
                        {
                          avatar.emoji
                        }
                      </Text>

                      <Text
                        style={
                          styles.avatarName
                        }
                      >
                        {
                          avatar.name
                        }
                      </Text>
                    </TouchableOpacity>
                  );
                }
              )}
            </View>
          </View>

          <View style={styles.card}>
            <View
              style={
                styles.genreHeader
              }
            >
              <Text
                style={
                  styles.label
                }
              >
                Favorite Genres
              </Text>

              <Text
                style={
                  styles.genreCount
                }
              >
                {
                  favoriteGenres.length
                }
                /5
              </Text>
            </View>

            <View
              style={
                styles.genreWrap
              }
            >
              {GENRES.map(
                (genre) => {
                  const active =
                    favoriteGenres.includes(
                      genre
                    );

                  return (
                    <TouchableOpacity
                      key={genre}
                      style={[
                        styles.genrePill,
                        active &&
                          styles.genrePillActive,
                      ]}
                      onPress={() =>
                        toggleGenre(
                          genre
                        )
                      }
                    >
                      <Text
                        style={[
                          styles.genreText,
                          active &&
                            styles.genreTextActive,
                        ]}
                      >
                        {genre}
                      </Text>
                    </TouchableOpacity>
                  );
                }
              )}
            </View>
          </View>

          <View
            style={
              styles.buttonRow
            }
          >
            <TouchableOpacity
              style={
                styles.cancelButton
              }
              onPress={() =>
                router.back()
              }
            >
              <Text
                style={
                  styles.cancelText
                }
              >
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={
                styles.saveButton
              }
              onPress={
                saveProfile
              }
            >
              <Text
                style={
                  styles.saveText
                }
              >
                {saving
                  ? 'Saving...'
                  : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const getStyles = (theme: Theme) =>
  StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor:
      theme.colors.background,
  },

  loadingPage: {
    flex: 1,
    justifyContent:
      'center',
    alignItems: 'center',
    backgroundColor:
      theme.colors.background,
  },

  content: {
    padding: 18,
    paddingBottom: 120,
  },

  card: {
    backgroundColor:
      theme.colors.card,
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor:
      theme.colors.border,
  },

  label: {
    color: theme.colors.gold,
    fontWeight: '900',
    marginBottom: 8,
    marginTop: 12,
  },

  input: {
    backgroundColor:
      theme.colors.surface,
    borderRadius: 12,
    padding: 12,
    color:
      theme.colors.textPrimary,
  },

  bioInput: {
    minHeight: 100,
    textAlignVertical:
      'top',
  },

  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  avatarOption: {
    width: '31%',
    borderWidth: 1,
    borderColor:
      theme.colors.softBorder,
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
  },

  avatarSelected: {
    borderColor:
      theme.colors.gold,
  },

  avatarEmoji: {
    fontSize: 28,
  },

  avatarName: {
    fontSize: 10,
    marginTop: 4,
    textAlign: 'center',
    color:
      theme.colors.textSecondary,
  },

  genreHeader: {
    flexDirection: 'row',
    justifyContent:
      'space-between',
  },

  genreCount: {
    color:
      theme.colors.textSecondary,
    marginTop: 12,
  },

  genreWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  genrePill: {
    backgroundColor:
      theme.colors.surface,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },

  genrePillActive: {
    backgroundColor:
      theme.colors.gold,
  },

  genreText: {
    color:
      theme.colors.textSecondary,
  },

  genreTextActive: {
    color:
      theme.colors.onAccent,
    fontWeight: '900',
  },

  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },

  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    backgroundColor:
      theme.colors.surface,
  },

  saveButton: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    backgroundColor:
      theme.colors.gold,
  },

  cancelText: {
    color:
      theme.colors.textSecondary,
    fontWeight: '900',
  },

  saveText: {
    color:
      theme.colors.onAccent,
    fontWeight: '900',
  },
});