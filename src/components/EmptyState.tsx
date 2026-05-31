import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme, ThemeColors } from '../context/ThemeContext';
import { Theme } from '../constants/theme';

type Props = {
  title?: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export default function EmptyState({
  title = 'Nothing here yet',
  subtitle = 'Get started by adding your first item.',
  actionLabel = 'Get started',
  onAction,
}: Props) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Text style={styles.iconEmoji}>✦</Text>
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      {onAction && (
        <TouchableOpacity style={styles.button} onPress={onAction} activeOpacity={0.85}>
          <Text style={styles.buttonText}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function createStyles(theme: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: Theme.spacing.xl,
    },
    iconCircle: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: theme.primary + '26',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Theme.spacing.lg,
    },
    iconEmoji: {
      fontSize: 48,
      color: theme.primary,
    },
    title: {
      fontSize: Theme.fontSize.xl,
      fontWeight: '700',
      color: theme.textPrimary,
      textAlign: 'center',
      marginBottom: Theme.spacing.sm,
    },
    subtitle: {
      fontSize: Theme.fontSize.md,
      color: theme.textSecondary,
      textAlign: 'center',
      lineHeight: 24,
      marginBottom: Theme.spacing.xl,
    },
    button: {
      backgroundColor: theme.primary,
      paddingVertical: 14,
      paddingHorizontal: 32,
      borderRadius: Theme.borderRadius.xl,
    },
    buttonText: {
      color: '#fff',
      fontSize: Theme.fontSize.md,
      fontWeight: '700',
    },
  });
}
