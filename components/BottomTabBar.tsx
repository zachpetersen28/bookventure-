import { useRouter, usePathname } from 'expo-router';
import { BookOpen, Compass, House, MessageCircle, User } from 'lucide-react-native';
import { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../lib/theme-context';
import { Theme } from '../lib/themes';

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
  const { theme } = useTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);

  return (
    <View style={[styles.bar, { paddingBottom: insets.bottom + 10 }]}>
      {TABS.map((tab) => {
        const active = pathname === tab.match;
        const color = active ? theme.colors.gold : theme.colors.textMuted;

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

const getStyles = (theme: Theme) =>
  StyleSheet.create({
    bar: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      flexDirection: 'row',
      backgroundColor: theme.colors.card,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
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
