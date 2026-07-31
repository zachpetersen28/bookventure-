import { Stack, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import BottomTabBar from '../components/BottomTabBar';

const HIDDEN_TAB_BAR_ROUTES = ['/login', '/test-supabase'];

export default function RootLayout() {
  const pathname = usePathname();
  const showTabBar = !HIDDEN_TAB_BAR_ROUTES.includes(pathname);

  return (
    <>
      <View style={{ flex: 1 }}>
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

        {showTabBar && <BottomTabBar />}
      </View>

      <StatusBar style="auto" />
    </>
  );
}