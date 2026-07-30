import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="club" options={{ headerShown: false }} />
        <Stack.Screen name="create-club" options={{ headerShown: false }} />
        <Stack.Screen name="join-club" options={{ headerShown: false }} />
        <Stack.Screen name="edit-club" options={{ headerShown: false }} />
        <Stack.Screen name="test-supabase" options={{ headerShown: false }} />
        <Stack.Screen name="update-progress" options={{ headerShown: false }} />
      </Stack>

      <StatusBar style="auto" />
    </>
  );
}