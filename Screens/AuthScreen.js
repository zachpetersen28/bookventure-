import { Cinzel_700Bold, useFonts } from '@expo-google-fonts/cinzel';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { supabase } from '../lib/supabase';

const COLORS = {
  forest: '#2F5D50',
  deepForest: '#21443B',
  sage: '#E6F0EC',
  cream: '#F7F3EA',
  card: '#FFFFFF',
  cedar: '#B45F3C',
  charcoal: '#222222',
  muted: '#777777',
  border: '#E6E0D6',
};

export default function AuthScreen() {
  const router = useRouter();

  const [fontsLoaded] = useFonts({
    Cinzel_700Bold,
  });

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('login');
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing info', 'Enter your email and password.');
      return;
    }

    if (mode === 'signup' && !displayName.trim()) {
      Alert.alert('Missing name', 'Enter a display name.');
      return;
    }

    setLoading(true);

    if (mode === 'signup') {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password.trim(),
      });

      if (error) {
        setLoading(false);
        Alert.alert('Signup error', error.message);
        return;
      }

      const userId = data?.user?.id;

      if (!userId) {
        setLoading(false);
        Alert.alert(
          'Signup created',
          'Check your email to confirm your account, then log in.'
        );
        setMode('login');
        return;
      }

      const { error: profileError } = await supabase.from('profiles').insert([
        {
          id: userId,
          email: email.trim(),
          display_name: displayName.trim(),
        },
      ]);

      setLoading(false);

      if (profileError) {
        Alert.alert('Profile error', profileError.message);
        return;
      }

      Alert.alert('Account created', 'You can now log in.');
      setMode('login');
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password.trim(),
    });

    setLoading(false);

    if (error) {
      Alert.alert('Login error', error.message);
      return;
    }

    router.replace('/');
  };

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.forest} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.logoWrap}>
        <Image
          source={require('../assets/bookventure-logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />

        <Text style={styles.title}>Bookventure</Text>

        <Text style={styles.tagline}>Every book is a shared adventure.</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          {mode === 'login' ? 'Welcome back' : 'Create your account'}
        </Text>

        <Text style={styles.cardSubtitle}>
          {mode === 'login'
            ? 'Log in to continue your reading journey.'
            : 'Choose your display name and start your adventure.'}
        </Text>

        {mode === 'signup' && (
          <>
            <Text style={styles.label}>Display Name</Text>
            <TextInput
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Example: Zach"
              placeholderTextColor={COLORS.muted}
              style={styles.input}
            />
          </>
        )}

        <Text style={styles.label}>Email</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="you@example.com"
          placeholderTextColor={COLORS.muted}
          style={styles.input}
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="Password"
          placeholderTextColor={COLORS.muted}
          style={styles.input}
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleAuth}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading
              ? 'Please wait...'
              : mode === 'login'
                ? 'Log In'
                : 'Sign Up'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setMode(mode === 'login' ? 'signup' : 'login')}
        >
          <Text style={styles.switchText}>
            {mode === 'login'
              ? 'Need an account? Sign up'
              : 'Already have an account? Log in'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.cream,
    justifyContent: 'center',
    alignItems: 'center',
  },

  container: {
    flex: 1,
    backgroundColor: COLORS.cream,
    padding: 20,
    justifyContent: 'center',
  },

  logoWrap: {
    alignItems: 'center',
    marginBottom: 18,
  },

  logo: {
    width: 210,
    height: 210,
    marginBottom: -18,
  },

  title: {
    fontSize: 32,
    color: COLORS.charcoal,
    fontFamily: 'Cinzel_700Bold',
  },

  tagline: {
    color: COLORS.cedar,
    fontWeight: '800',
    fontSize: 13,
    marginTop: -2,
  },

  card: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 22,
    padding: 18,
    margintop: 18
  },

  cardTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.charcoal,
  },

  cardSubtitle: {
    color: COLORS.muted,
    marginTop: 5,
    marginBottom: 8,
    lineHeight: 19,
  },

  label: {
    fontWeight: '900',
    color: COLORS.charcoal,
    marginTop: 14,
  },

  input: {
    backgroundColor: COLORS.cream,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 13,
    padding: 11,
    marginTop: 6,
    color: COLORS.charcoal,
  },

  button: {
    backgroundColor: COLORS.forest,
    padding: 13,
    borderRadius: 14,
    marginTop: 22,
  },

  buttonDisabled: {
    backgroundColor: COLORS.muted,
  },

  buttonText: {
    color: COLORS.card,
    textAlign: 'center',
    fontWeight: '900',
  },

  switchText: {
    marginTop: 16,
    color: COLORS.deepForest,
    textAlign: 'center',
    fontWeight: '900',
  },
});