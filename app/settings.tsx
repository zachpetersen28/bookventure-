import { useMemo } from 'react';
import { Stack, useRouter } from 'expo-router';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ScreenHeader from '../components/ScreenHeader';
import { supabase } from '../lib/supabase';
import { useTheme } from '../lib/theme-context';
import { Theme } from '../lib/themes';

export default function SettingsScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);

  const router = useRouter();

  const logout = async () => {
    await supabase.auth.signOut();
    router.replace('/login');
  };

  const deleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your Bookventure profile.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const { data: userData } = await supabase.auth.getUser();

            if (!userData?.user) return;

            await supabase.from('profiles').delete().eq('id', userData.user.id);
            await supabase.auth.signOut();

            router.replace('/login');
          },
        },
      ]
    );
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <SafeAreaView style={styles.page} edges={['top']}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <ScreenHeader title="Settings" />

          <View style={styles.card}>
            <TouchableOpacity style={styles.row} onPress={() => router.push('/edit-profile')}>
              <Text style={styles.rowText}>Edit Profile</Text>
              <Text style={styles.arrow}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.row}>
              <Text style={styles.rowText}>Notifications</Text>
              <Text style={styles.comingSoon}>Soon</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.row}>
              <Text style={styles.rowText}>Privacy</Text>
              <Text style={styles.comingSoon}>Soon</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <TouchableOpacity style={styles.row} onPress={logout}>
              <Text style={styles.rowText}>Log Out</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.deleteCard}>
            <TouchableOpacity style={styles.deleteButton} onPress={deleteAccount}>
              <Text style={styles.deleteText}>Delete Account</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const getStyles = (theme: Theme) =>
  StyleSheet.create({
  page: { flex: 1, backgroundColor: theme.colors.background },
  container: { flex: 1 },
  content: { paddingHorizontal: 18, paddingTop: 12, paddingBottom: 120 },
  card: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 20,
    marginBottom: 14,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  rowText: {
    color: theme.colors.textPrimary,
    fontSize: 15,
    fontWeight: '800',
  },
  arrow: { color: theme.colors.gold, fontSize: 24, fontWeight: '700' },
  comingSoon: { color: theme.colors.textMuted, fontWeight: '800', fontSize: 12 },
  deleteCard: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: '#7A1D1D',
    borderRadius: 20,
    padding: 16,
    marginTop: 6,
  },
  deleteButton: {
    backgroundColor: '#7A1D1D',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  deleteText: { color: 'white', fontWeight: '900', fontSize: 14 },
});