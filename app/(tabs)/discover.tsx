import { Cinzel_700Bold, useFonts } from '@expo-google-fonts/cinzel';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
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
import ScreenHeader from '../../components/ScreenHeader';
import ThemedBackground from '../../components/ThemedBackground';
import { useTheme } from '../../lib/theme-context';
import { Theme } from '../../lib/themes';

type BookResult = {
  id: string;
  title: string;
  authors: string;
  description: string;
  thumbnail: string | null;
  pageCount: number | null;
  categories: string;
};

const GENRES = [
  'Fantasy',
  'Romance',
  'Thriller',
  'Mystery',
  'Sci-Fi',
  'Young Adult',
  'Self-Help',
];

const CURATED_BOOKS: Record<string, string[]> = {
  Fantasy: [
    'Fourth Wing',
    'Iron Flame',
    'A Court of Thorns and Roses',
    'Mistborn',
    'The Way of Kings',
    'The Name of the Wind',
    'The Hobbit',
    'Eragon',
    'The Poppy War',
    'Babel',
  ],

  Romance: [
    'Book Lovers',
    'Beach Read',
    'Funny Story',
    'The Love Hypothesis',
    'Happy Place',
    'Love, Theoretically',
    'It Ends With Us',
    'Twisted Love',
    'Icebreaker',
    'The Hating Game',
  ],

  Thriller: [
    'The Silent Patient',
    'The Housemaid',
    'Verity',
    'Gone Girl',
    'Behind Closed Doors',
    'The Couple Next Door',
    'Sharp Objects',
    'The Perfect Marriage',
    'Pretty Girls',
    'The Guest List',
  ],

  Mystery: [
    'The Thursday Murder Club',
    'A Good Girl’s Guide to Murder',
    'The Maid',
    'Magpie Murders',
    'And Then There Were None',
    'Murder on the Orient Express',
    'Death on the Nile',
    'The Dry',
    'The Searcher',
    'The Lincoln Lawyer',
  ],

  'Sci-Fi': [
    'Dune',
    'Project Hail Mary',
    'The Martian',
    'Red Rising',
    'Ender’s Game',
    'Dark Matter',
    'Recursion',
    'Foundation',
    'Hyperion',
    'Leviathan Wakes',
  ],

  'Young Adult': [
    'The Hunger Games',
    'Catching Fire',
    'Mockingjay',
    'Divergent',
    'The Fault in Our Stars',
    'Six of Crows',
    'Shadow and Bone',
    'The Maze Runner',
    'Legendborn',
    'Powerless',
  ],

  'Self-Help': [
    'Atomic Habits',
    'The Mountain Is You',
    'The 48 Laws of Power',
    'Think Like a Monk',
    'Can’t Hurt Me',
    'The Power of Now',
    'Deep Work',
    'Rich Dad Poor Dad',
    'Mindset',
    'The Psychology of Money',
  ],
};

export default function DiscoverScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);

  const router = useRouter();

  const [fontsLoaded] = useFonts({
    Cinzel_700Bold,
  });

  const [selectedGenre, setSelectedGenre] =
    useState('Fantasy');

  const [books, setBooks] = useState<
    BookResult[]
  >([]);

  const [loading, setLoading] =
    useState(false);

  const [searchText, setSearchText] =
    useState('');

  useEffect(() => {
    loadCuratedBooks('Fantasy');
  }, []);

  const searchGoogleBooks = async (
    query: string,
    maxResults = 40
  ) => {
    try {
      const apiKey =
        process.env.EXPO_PUBLIC_GOOGLE_BOOKS_API_KEY;

      const response = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(
          query
        )}&maxResults=${maxResults}&key=${apiKey}`
      );

      const json = await response.json();

      return (json.items || [])
        .map((item: any) => {
          const info =
            item.volumeInfo || {};

          return {
            id: item.id,
            title:
              info.title || 'Untitled',
            authors: info.authors
              ? info.authors.join(', ')
              : 'Unknown author',
            description:
              info.description ||
              'No description available.',
            thumbnail:
              info.imageLinks?.thumbnail?.replace(
                'http://',
                'https://'
              ) || null,
            pageCount:
              info.pageCount || null,
            categories: info.categories
              ? info.categories.join(
                  ', '
                )
              : 'Book',
          };
        })
        .filter(
          (book: BookResult) =>
            book.thumbnail &&
            book.authors !==
              'Unknown author'
        );
    } catch {
      return [];
    }
  };

  const loadCuratedBooks = async (
    genre: string
  ) => {
    setLoading(true);

    const titles =
      CURATED_BOOKS[genre] || [];

    const results = await Promise.all(
      titles.map((title) =>
        searchGoogleBooks(title, 1)
      )
    );

    const flattened =
      results.flat();

    setBooks(flattened);

    setLoading(false);
  };

  const handleSearch = async () => {
    if (!searchText.trim()) {
      loadCuratedBooks(
        selectedGenre
      );
      return;
    }

    setLoading(true);

    const results =
      await searchGoogleBooks(
        searchText,
        40
      );

    setBooks(results);

    setLoading(false);
  };

  const startClubFromBook = (
    book: BookResult
  ) => {
    router.push({
      pathname: '/create-club',
      params: {
        bookTitle: book.title,
        bookAuthor: book.authors,
        totalPages: book.pageCount
          ? String(book.pageCount)
          : '',
        bookDescription:
          book.description,
        bookCover:
          book.thumbnail || '',
      },
    });
  };

  if (!fontsLoaded) {
    return (
      <ThemedBackground>
        <View
          style={
            styles.loadingContainer
          }
        >
          <ActivityIndicator
            size="large"
            color={theme.colors.gold}
          />
        </View>
      </ThemedBackground>
    );
  }

  return (
    <ThemedBackground>
    <SafeAreaView
      style={styles.page}
      edges={['top']}
    >
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={
          Platform.OS === 'ios'
            ? 'padding'
            : 'height'
        }
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
          <ScreenHeader title="Discover" subtitle="Find your next adventure." />

          <View style={styles.searchCard}>
            <View
              style={styles.searchRow}
            >
              <TextInput
                value={searchText}
                onChangeText={(text) => {
                  setSearchText(text);

                  if (!text.trim()) {
                    loadCuratedBooks(
                      selectedGenre
                    );
                  }
                }}
                placeholder="Search books or authors..."
                placeholderTextColor={
                  theme.colors.textMuted
                }
                style={styles.input}
                returnKeyType="search"
                onSubmitEditing={
                  handleSearch
                }
              />

              <TouchableOpacity
                style={
                  styles.searchButton
                }
                onPress={handleSearch}
              >
                <Text
                  style={
                    styles.searchButtonText
                  }
                >
                  Search
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text
            style={styles.sectionTitle}
          >
            Genres
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={
              false
            }
          >
            {GENRES.map((genre) => {
              const active =
                selectedGenre ===
                genre;

              return (
                <TouchableOpacity
                  key={genre}
                  style={[
                    styles.genrePill,
                    active &&
                      styles.genrePillActive,
                  ]}
                  onPress={() => {
                    setSelectedGenre(
                      genre
                    );

                    setSearchText('');

                    loadCuratedBooks(
                      genre
                    );
                  }}
                >
                  <Text
                    style={[
                      styles.genrePillText,
                      active &&
                        styles.genrePillTextActive,
                    ]}
                  >
                    {genre}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <Text
            style={styles.sectionTitle}
          >
            {searchText.trim()
              ? 'Search Results'
              : `Top ${selectedGenre} Books`}
          </Text>

          {loading && (
            <View
              style={
                styles.loadingBooks
              }
            >
              <ActivityIndicator
                size="large"
                color={theme.colors.gold}
              />

              <Text
                style={
                  styles.loadingText
                }
              >
                Loading books...
              </Text>
            </View>
          )}

          {!loading &&
            books.map(
              (book, index) => {
                const showRanking =
                  !searchText.trim();

                return (
                  <View
                    key={book.id}
                    style={
                      styles.bookCard
                    }
                  >
                    {showRanking && (
                      <View
                        style={
                          styles.rankWrap
                        }
                      >
                        <Text
                          style={
                            styles.rankText
                          }
                        >
                          #
                          {index + 1}
                        </Text>
                      </View>
                    )}

                    <Image
                      source={{
                        uri:
                          book.thumbnail ||
                          undefined,
                      }}
                      style={
                        styles.cover
                      }
                    />

                    <View
                      style={
                        styles.bookInfo
                      }
                    >
                      <Text
                        style={
                          styles.bookTitle
                        }
                        numberOfLines={
                          2
                        }
                      >
                        {book.title}
                      </Text>

                      <Text
                        style={
                          styles.bookAuthor
                        }
                      >
                        {book.authors}
                      </Text>

                      <TouchableOpacity
                        style={
                          styles.primaryButton
                        }
                        onPress={() =>
                          startClubFromBook(
                            book
                          )
                        }
                      >
                        <Text
                          style={
                            styles.primaryButtonText
                          }
                        >
                          Start Club
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              }
            )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
    </ThemedBackground>
  );
}

const getStyles = (theme: Theme) =>
  StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: 'transparent',
  },

  keyboardView: {
    flex: 1,
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
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },

  searchCard: {
    backgroundColor:
      theme.colors.surface,
    borderWidth: 1,
    borderColor:
      theme.colors.border,
    borderRadius: 22,
    padding: 16,
  },

  searchRow: {
    flexDirection: 'row',
    gap: 8,
  },

  input: {
    flex: 1,
    backgroundColor:
      theme.colors.card,
    borderWidth: 1,
    borderColor:
      theme.colors.border,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 11,
    color:
      theme.colors.textPrimary,
  },

  searchButton: {
    backgroundColor:
      theme.colors.gold,
    paddingHorizontal: 16,
    borderRadius: 14,
    justifyContent: 'center',
  },

  searchButtonText: {
    color:
      theme.colors.onAccent,
    fontWeight: '900',
  },

  sectionTitle: {
    color:
      theme.colors.textPrimary,
    fontSize: 22,
    fontWeight: '900',
    marginTop: 22,
    marginBottom: 12,
  },

  genrePill: {
    backgroundColor:
      theme.colors.card,
    borderWidth: 1,
    borderColor:
      theme.colors.border,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginRight: 8,
  },

  genrePillActive: {
    backgroundColor:
      theme.colors.gold,
    borderColor:
      theme.colors.gold,
  },

  genrePillText: {
    color:
      theme.colors.textPrimary,
    fontWeight: '800',
    fontSize: 12,
  },

  genrePillTextActive: {
    color:
      theme.colors.onAccent,
  },

  loadingBooks: {
    marginTop: 28,
    alignItems: 'center',
  },

  loadingText: {
    color:
      theme.colors.textSecondary,
    marginTop: 10,
    fontWeight: '800',
  },

  bookCard: {
    backgroundColor:
      theme.colors.card,
    borderWidth: 1,
    borderColor:
      theme.colors.border,
    borderRadius: 20,
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
  },

  rankWrap: {
    width: 42,
    alignItems: 'center',
    justifyContent:
      'center',
  },

  rankText: {
    color: theme.colors.gold,
    fontSize: 20,
    fontWeight: '900',
  },

  cover: {
    width: 78,
    height: 116,
    borderRadius: 12,
    backgroundColor:
      theme.colors.surface,
  },

  bookInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent:
      'space-between',
  },

  bookTitle: {
    color:
      theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '900',
  },

  bookAuthor: {
    color:
      theme.colors.textSecondary,
    fontSize: 13,
    marginTop: 4,
    fontWeight: '700',
  },

  primaryButton: {
    marginTop: 12,
    backgroundColor:
      theme.colors.gold,
    paddingVertical: 8,
    borderRadius: 12,
  },

  primaryButtonText: {
    color:
      theme.colors.onAccent,
    textAlign: 'center',
    fontWeight: '900',
    fontSize: 12,
  },
});