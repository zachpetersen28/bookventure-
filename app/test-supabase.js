import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { supabase } from '../lib/supabase';
import { useTheme } from '../lib/theme-context';

export default function TestSupabasePage() {
  const { theme } = useTheme();
  const [message, setMessage] = useState('Testing Supabase...');

  useEffect(() => {
    testConnection();
  }, []);

  const testConnection = async () => {
    const { error } = await supabase.from('clubs').select('*').limit(1);

    if (error) {
      setMessage(`Connected (no table yet): ${error.message}`);
    } else {
      setMessage('Supabase connected successfully!');
    }
  };

  return (
    <View style={{ flex: 1, padding: 20, backgroundColor: theme.colors.background }}>
      <Text>{message}</Text>
    </View>
  );
}