import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import GradientScreen from '../components/GradientScreen';
import { useTheme, ThemeColors } from '../context/ThemeContext';
import { Theme } from '../constants/theme';
import { getOnboardingData } from '../storage/settings';

export default function HomeScreen() {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [name, setName] = useState('');

  useFocusEffect(
    React.useCallback(() => {
      getOnboardingData().then(data => {
        if (data.name) setName(data.name);
      });
    }, [])
  );

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <GradientScreen>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.greeting}>
            {greeting()}{name ? `, ${name}` : ''}
          </Text>
          <Text style={styles.title}>Welcome to AppName</Text>
          <Text style={styles.subtitle}>
            Your home base. Add your content and features here.
          </Text>
        </View>

        <View style={styles.cardPlaceholder}>
          <Text style={styles.cardPlaceholderText}>
            Your main content goes here.{'\n'}Replace this with your app's core feature.
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
      paddingTop: Theme.spacing.lg,
    },
    header: {
      marginBottom: Theme.spacing.xl,
    },
    greeting: {
      fontSize: Theme.fontSize.sm,
      fontWeight: '600',
      color: theme.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: 6,
    },
    title: {
      fontSize: Theme.fontSize.xxl,
      fontWeight: '800',
      color: theme.textPrimary,
      letterSpacing: -0.5,
      marginBottom: Theme.spacing.sm,
    },
    subtitle: {
      fontSize: Theme.fontSize.md,
      color: theme.textSecondary,
      lineHeight: 24,
    },
    cardPlaceholder: {
      backgroundColor: theme.glass,
      borderRadius: Theme.borderRadius.lg,
      borderWidth: 1,
      borderColor: theme.glassBorder,
      padding: Theme.spacing.xl,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 160,
      shadowColor: theme.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 10,
      elevation: 2,
    },
    cardPlaceholderText: {
      fontSize: Theme.fontSize.sm,
      color: theme.textMuted,
      textAlign: 'center',
      lineHeight: 22,
    },
  });
}
