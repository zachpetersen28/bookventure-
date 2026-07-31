import { ReactNode, useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { FONTS } from '../lib/theme';
import { useTheme } from '../lib/theme-context';
import { Theme } from '../lib/themes';

type ScreenHeaderProps = {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  rightAction?: ReactNode;
};

export default function ScreenHeader({ title, subtitle, onBack, rightAction }: ScreenHeaderProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);

  return (
    <View style={styles.row}>
      {onBack ? (
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>‹</Text>
        </TouchableOpacity>
      ) : null}

      <View style={styles.titleWrap}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>

      {rightAction ? <View style={styles.rightAction}>{rightAction}</View> : null}
    </View>
  );
}

const getStyles = (theme: Theme) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 18,
    },
    titleWrap: {
      flex: 1,
    },
    title: {
      fontSize: 32,
      fontFamily: FONTS.title,
      color: theme.colors.textPrimary,
    },
    subtitle: {
      color: theme.colors.gold,
      fontWeight: '800',
      marginTop: -3,
    },
    backButton: {
      marginRight: 10,
    },
    backButtonText: {
      color: theme.colors.gold,
      fontSize: 28,
      fontWeight: '900',
    },
    rightAction: {
      marginLeft: 10,
    },
  });
