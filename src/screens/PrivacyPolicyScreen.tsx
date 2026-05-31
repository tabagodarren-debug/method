import React, { useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

import { SettingsStackParamList } from '../types';
import GradientScreen from '../components/GradientScreen';
import { useTheme, ThemeColors } from '../context/ThemeContext';

type Props = StackScreenProps<SettingsStackParamList, 'PrivacyPolicy'>;

export default function PrivacyPolicyScreen({ navigation }: Props) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <GradientScreen>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} accessibilityLabel="Go back">
          <Ionicons name="chevron-back" size={22} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Privacy Policy</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.lastUpdated}>Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</Text>

        <Text style={styles.intro}>
          AppName is designed with your privacy in mind. This policy explains what data is collected, how it is used, and your rights.
        </Text>

        <Text style={styles.sectionTitle}>Data Collection</Text>
        <Text style={styles.body}>
          AppName collects minimal data necessary to operate. We do not collect your name, email address, or any personal identifiers unless you contact us directly for support.
        </Text>

        <Text style={styles.sectionTitle}>Local Storage</Text>
        <Text style={styles.body}>
          By default, all app data is stored locally on your device and never uploaded to our servers. If you delete the app, your local data is deleted with it.
        </Text>

        <Text style={styles.sectionTitle}>Analytics</Text>
        <Text style={styles.body}>
          We collect anonymous app usage events via PostHog to understand how the app is used and to improve it. These events include actions such as opening screens and tapping buttons. No personally identifiable information is included in these events.
        </Text>

        <Text style={styles.sectionTitle}>Crash Reports</Text>
        <Text style={styles.body}>
          Crash reports are collected via Sentry to help us identify and fix bugs. Crash reports may include device type, OS version, and a stack trace — they do not include your personal data.
        </Text>

        <Text style={styles.sectionTitle}>Third-Party Services</Text>
        <Text style={styles.body}>
          AppName uses the following third-party services:{'\n\n'}
          {'•'} PostHog — Anonymous analytics{'\n'}
          {'•'} Sentry — Crash reporting{'\n'}
          {'•'} RevenueCat — In-app purchase management{'\n\n'}
          We do not sell your data to any third parties, ever.
        </Text>

        <Text style={styles.sectionTitle}>Contact</Text>
        <Text style={styles.body}>
          If you have any questions about this privacy policy or how your data is handled, please reach out:
        </Text>
        <Text style={styles.email}>support@yourapp.com</Text>

        <View style={styles.footer}>
          <Text style={styles.footerText}>AppName — Built with care for your privacy.</Text>
        </View>
      </ScrollView>
    </GradientScreen>
  );
}

function createStyles(theme: ThemeColors) {
  return StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 8,
    },
    backBtn: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.textPrimary,
      letterSpacing: -0.3,
    },
    content: {
      paddingHorizontal: 24,
      paddingBottom: 60,
      paddingTop: 8,
    },
    lastUpdated: {
      fontSize: 13,
      color: theme.textMuted,
      marginBottom: 16,
      fontStyle: 'italic',
    },
    intro: {
      fontSize: 15,
      color: theme.textSecondary,
      lineHeight: 22,
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.textPrimary,
      marginTop: 20,
      marginBottom: 8,
    },
    body: {
      fontSize: 14,
      color: theme.textSecondary,
      lineHeight: 22,
    },
    email: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.primary,
      marginTop: 8,
    },
    footer: {
      marginTop: 40,
      paddingTop: 20,
      borderTopWidth: 1,
      borderTopColor: theme.border,
      alignItems: 'center',
    },
    footerText: {
      fontSize: 13,
      color: theme.textMuted,
      textAlign: 'center',
    },
  });
}
