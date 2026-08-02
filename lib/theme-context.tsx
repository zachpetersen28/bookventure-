import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { supabase } from './supabase';
import { DEFAULT_THEME_ID, Theme, THEMES } from './themes';

const THEME_STORAGE_KEY = 'bookventure:theme_id';

type ThemeContextValue = {
  theme: Theme;
  themeId: string;
  setTheme: (id: string) => void;
  themes: Theme[];
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeId, setThemeId] = useState(DEFAULT_THEME_ID);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      // Fast local cache first, so we don't sit on the default while a
      // network profile fetch is in flight.
      try {
        const cached = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (!cancelled && cached && THEMES.some((t) => t.id === cached)) {
          setThemeId(cached);
        }
      } catch {
        // cache read failure — fall through to default/profile
      }

      // Source of truth: the logged-in user's saved theme.
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return; // logged out — stay on cache/default

      const { data: profile } = await supabase
        .from('profiles')
        .select('theme_id')
        .eq('id', userData.user.id)
        .single();

      if (!cancelled && profile?.theme_id && THEMES.some((t) => t.id === profile.theme_id)) {
        setThemeId(profile.theme_id);
        AsyncStorage.setItem(THEME_STORAGE_KEY, profile.theme_id).catch(() => {});
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const theme = useMemo(
    () => THEMES.find((t) => t.id === themeId) || THEMES[0],
    [themeId]
  );

  const setTheme = (id: string) => {
    setThemeId(id); // optimistic, instant UI

    AsyncStorage.setItem(THEME_STORAGE_KEY, id).catch(() => {});

    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return; // logged out — local-only change is fine

      const { error } = await supabase
        .from('profiles')
        .update({ theme_id: id })
        .eq('id', userData.user.id);

      if (error) {
        Alert.alert('Save Failed', error.message);
      }
    })();
  };

  const value = useMemo(
    () => ({ theme, themeId, setTheme, themes: THEMES }),
    [theme, themeId]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);

  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return ctx;
}
