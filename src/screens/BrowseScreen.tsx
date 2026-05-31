import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import GradientScreen from '../components/GradientScreen';
import { useTheme, ThemeColors } from '../context/ThemeContext';
import { Theme } from '../constants/theme';

export default function BrowseScreen() {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <GradientScreen>
      <View style={styles.container}>
        <Text style={styles.pageTitle}>Browse</Text>
        <View style={styles.placeholder}>
          <View style={styles.iconCircle}>
            <Ionicons name="compass-outline" size={40} color={theme.primary} />
          </View>
          <Text style={styles.placeholderTitle}>Browse Tab</Text>
          <Text style={styles.placeholderSub}>
            Replace this with your app's browse or discover content.
          </Text>
        </View>
      </View>
    </GradientScreen>
  );
}

function createStyles(theme: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      paddingHorizontal: Theme.spacing.lg,
    },
    pageTitle: {
      fontSize: 28,
      fontWeight: '800',
      color: theme.textPrimary,
      paddingTop: Theme.spacing.lg,
      paddingBottom: Theme.spacing.md,
      letterSpacing: -0.5,
    },
    placeholder: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: Theme.spacing.md,
    },
    iconCircle: {
      width: 88,
      height: 88,
      borderRadius: 44,
      backgroundColor: theme.primary + '1A',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Theme.spacing.sm,
    },
    placeholderTitle: {
      fontSize: Theme.fontSize.xl,
      fontWeight: '700',
      color: theme.textPrimary,
      textAlign: 'center',
    },
    placeholderSub: {
      fontSize: Theme.fontSize.sm,
      color: theme.textMuted,
      textAlign: 'center',
      lineHeight: 22,
      paddingHorizontal: Theme.spacing.xl,
    },
  });
}
