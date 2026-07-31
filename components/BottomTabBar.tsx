import { useRouter, usePathname } from 'expo-router';
import { BookOpen, Compass, House, MessageCircle, User } from 'lucide-react-native';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const COLORS = {
  forest: '#2F5D50',
  muted: '#8E8A84',
  border: '#E7E1D7',
};

const TABS = [
  { key: 'clubs', href: '/clubs', match: '/clubs', label: 'Clubs', Icon: BookOpen, size: 22 },
  { key: 'discover', href: '/discover', match: '/discover', label: 'Discover', Icon: Compass, size: 22 },
  { key: 'index', href: '/(tabs)', match: '/', label: 'Home', Icon: House, size: 28 },
  { key: 'messages', href: '/messages', match: '/messages', label: 'Messages', Icon: MessageCircle, size: 22 },
  { key: 'profile', href: '/profile', match: '/profile', label: 'Profile', Icon: User, size: 22 },
];

export default function BottomTabBar() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bar, { paddingBottom: insets.bottom + 10 }]}>
      {TABS.map((tab) => {
        const active = pathname === tab.match;
        const color = active ? COLORS.forest : COLORS.muted;

        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.tab}
            onPress={() => {
              if (!active) router.push(tab.href);
            }}
          >
            <tab.Icon color={color} size={tab.size} />
            <Text style={[styles.label, { color }]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 10,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    marginTop: 2,
  },
});
