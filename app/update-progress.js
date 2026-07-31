import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ScreenHeader from '../components/ScreenHeader';
import { COLORS } from '../lib/theme';

export default function UpdateProgressPage() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [current, setCurrent] = useState(String(params.currentChapter || '0'));

  const saveProgress = async () => {
    const currentNum = Number(current);
    const totalNum = Number(params.totalChapters || 0);

    if (Number.isNaN(currentNum)) {
      Alert.alert('Invalid chapter', 'Chapter must be a number.');
      return;
    }

    if (currentNum < 0) {
      Alert.alert('Invalid chapter', 'Chapter cannot be less than 0.');
      return;
    }

    if (totalNum > 0 && currentNum > totalNum) {
      Alert.alert(
        'Invalid chapter',
        `Chapter cannot be greater than ${totalNum}.`
      );
      return;
    }

    const savedClubs = await AsyncStorage.getItem('clubs');
    const existingClubs = savedClubs ? JSON.parse(savedClubs) : [];

    const updatedClubs = existingClubs.map((club) => {
      if (String(club.id) !== String(params.id)) return club;

      return {
        ...club,
        currentChapter: currentNum,
      };
    });

    await AsyncStorage.setItem('clubs', JSON.stringify(updatedClubs));

    Alert.alert('Saved', 'Your progress has been updated.');
    router.back();
  };

  return (
    <SafeAreaView style={styles.page} edges={['top']}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <ScreenHeader title="Update Progress" subtitle={params.name} onBack={() => router.back()} />

        <Text style={styles.label}>Your Current Chapter</Text>
        <TextInput
          value={current}
          onChangeText={setCurrent}
          keyboardType="numeric"
          style={styles.input}
        />

        <Text style={styles.helper}>Total chapters: {params.totalChapters}</Text>

        <TouchableOpacity style={styles.button} onPress={saveProgress}>
          <Text style={styles.buttonText}>Save Progress</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: COLORS.background },
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 120 },

  label: { fontWeight: '900', marginTop: 15, color: COLORS.textPrimary },

  input: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: 12,
    marginTop: 6,
    color: COLORS.textPrimary,
  },

  helper: {
    marginTop: 8,
    color: COLORS.textSecondary,
  },

  button: {
    backgroundColor: COLORS.gold,
    padding: 14,
    borderRadius: 16,
    marginTop: 25,
  },

  buttonText: {
    color: COLORS.deepForest,
    textAlign: 'center',
    fontWeight: '900',
  },
});