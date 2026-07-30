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
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Update Progress</Text>
      <Text style={styles.subtitle}>{params.name}</Text>

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
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 20, paddingBottom: 50 },

  title: { fontSize: 28, fontWeight: 'bold' },
  subtitle: { color: '#555', marginTop: 6, marginBottom: 20 },

  label: { fontWeight: 'bold', marginTop: 15 },

  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginTop: 6,
  },

  helper: {
    marginTop: 8,
    color: '#555',
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