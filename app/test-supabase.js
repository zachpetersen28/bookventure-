import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { supabase } from '../lib/supabase';

export default function TestSupabasePage() {
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
    <View style={{ flex: 1, padding: 20, backgroundColor: '#fff' }}>
      <Text>{message}</Text>
    </View>
  );
}