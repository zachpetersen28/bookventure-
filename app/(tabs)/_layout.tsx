import { Tabs } from 'expo-router';
import {
  BookOpen,
  Compass,
  House,
  MessageCircle,
  User,
} from 'lucide-react-native';

const COLORS = {
  forest: '#2F5D50',
  muted: '#8E8A84',
  border: '#E7E1D7',
};

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,

        tabBarActiveTintColor: COLORS.forest,
        tabBarInactiveTintColor: COLORS.muted,

        tabBarStyle: { display: 'none' },

        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '800',
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="clubs"
        options={{
          title: 'Clubs',
          tabBarIcon: ({ color, size }) => (
            <BookOpen color={color} size={22} />
          ),
        }}
      />

      <Tabs.Screen
        name="discover"
        options={{
          title: 'Discover',
          tabBarIcon: ({ color, size }) => (
            <Compass color={color} size={22} />
          ),
        }}
      />

      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => (
            <House color={color} size={28} />
          ),
        }}
      />

      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarIcon: ({ color, size }) => (
            <MessageCircle color={color} size={22} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <User color={color} size={22} />
          ),
        }}
      />
    </Tabs>
  );
}