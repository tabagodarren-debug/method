import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, Switch, TouchableOpacity, ScrollView,
  StyleSheet, Alert, ActivityIndicator, Linking,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { CommonActions, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { SettingsStackParamList, AppSettings } from '../types';
import { getSettings, saveSettings, hasAppUnlock, revokeAppUnlock, setAppUnlocked } from '../storage/settings';
import { scheduleReminder } from '../utils/notifications';
import { ThemeId } from '../constants/themes';
import GradientScreen from '../components/GradientScreen';
import { useTheme, useThemeId, useSetTheme, ThemeColors } from '../context/ThemeContext';
import { restoreAppUnlock, checkAppUnlock } from '../services/purchases';
import PaywallModal from '../components/PaywallModal';

type Props = StackScreenProps<SettingsStackParamList, 'Settings'>;

const format12h = (time24: string): string => {
  const [h, m] = time24.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${period}`;
};

export default function SettingsScreen({ navigation }: Props) {
  const theme = useTheme();
  const themeId = useThemeId();
  const setTheme = useSetTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const THEMES = [
    { id: 'light' as ThemeId, name: 'Light', color: '#F5F5F7' },
    { id: 'dark' as ThemeId, name: 'Dark', color: '#0D0D1A' },
  ];

  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);

  const loadData = useCallback(async () => {
    const [s, unlocked] = await Promise.all([getSettings(), hasAppUnlock()]);
    setSettings(s);
    setIsUnlocked(unlocked);
  }, []);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const handleToggleReminder = async (value: boolean) => {
    if (!settings) return;
    const prev = settings.reminderEnabled;
    setSettings({ ...settings, reminderEnabled: value });
    await saveSettings({ reminderEnabled: value });
    try {
      const granted = await scheduleReminder(value, settings.reminderTime);
      if (!granted) {
        setSettings({ ...settings, reminderEnabled: prev });
        await saveSettings({ reminderEnabled: prev });
        Alert.alert('Notifications unavailable', 'Please enable notifications for this app in your iPhone Settings.');
      }
    } catch {
      setSettings({ ...settings, reminderEnabled: prev });
      await saveSettings({ reminderEnabled: prev });
      Alert.alert('Notifications unavailable', 'Please enable notifications for this app in your iPhone Settings.');
    }
  };

  const handleRestore = async () => {
    setRestoring(true);
    try {
      const success = await restoreAppUnlock();
      if (success) {
        Alert.alert('Restored', 'Your purchase has been restored!');
        setIsUnlocked(true);
      } else {
        Alert.alert('Not found', 'No previous purchase found on this account.');
      }
    } finally {
      setRestoring(false);
    }
  };

  const handleDevReset = () => {
    Alert.alert('Reset Onboarding', 'This will clear all data and restart onboarding. Dev use only.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset', style: 'destructive',
        onPress: async () => {
          await AsyncStorage.multiRemove(['@app/onboarded', '@app/onboarding_data', '@app/settings', '@app/unlocked']);
          navigation.getParent()?.getParent()?.dispatch(
            CommonActions.reset({ index: 0, routes: [{ name: 'Onboarding1' }] })
          );
        },
      },
    ]);
  };

  return (
    <GradientScreen>
      <Text style={styles.pageTitle}>Settings</Text>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <Text style={styles.sectionHeader}>Daily Reminder</Text>
        <View style={styles.sectionShadow}>
          <View style={[styles.section, { backgroundColor: theme.glass, borderColor: theme.glassBorder }]}>
            <View style={styles.row}>
              <Ionicons name="notifications-outline" size={20} color={theme.primaryBright} style={styles.rowIcon} />
              <Text style={styles.rowLabel}>Remind me daily</Text>
              <Switch
                value={settings?.reminderEnabled ?? false}
                onValueChange={handleToggleReminder}
                trackColor={{ false: theme.borderDark, true: theme.primaryBright }}
                thumbColor={'#fff'}
              />
            </View>
            {settings?.reminderEnabled && (
              <View style={[styles.row, styles.rowBorderTop]}>
                <Ionicons name="time-outline" size={20} color={theme.textOnDarkSub} style={styles.rowIcon} />
                <Text style={styles.rowLabel}>Reminder time</Text>
                <Text style={styles.timeValue}>{format12h(settings.reminderTime ?? '20:00')}</Text>
              </View>
            )}
          </View>
        </View>

        <Text style={styles.sectionHeader}>Appearance</Text>
        <View style={styles.sectionShadow}>
          <View style={[styles.section, { backgroundColor: theme.glass, borderColor: theme.glassBorder }]}>
            <View style={[styles.row, { flexWrap: 'wrap', gap: 12, paddingVertical: 16 }]}>
              {THEMES.map(t => (
                <TouchableOpacity
                  key={t.id}
                  style={[styles.themeOption, themeId === t.id && styles.themeOptionActive]}
                  onPress={() => setTheme(t.id)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.themeCircle, { backgroundColor: t.color, borderColor: themeId === t.id ? theme.primary : 'transparent' }]} />
                  <Text style={[styles.themeLabel, themeId === t.id && { color: theme.primary }]}>{t.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {!isUnlocked && (
          <>
            <Text style={styles.sectionHeader}>AppName Plus</Text>
            <View style={styles.sectionShadow}>
              <View style={[styles.section, { backgroundColor: theme.glass, borderColor: theme.glassBorder }]}>
                <TouchableOpacity style={styles.row} onPress={() => setShowPaywall(true)}>
                  <Ionicons name="star-outline" size={20} color={theme.primaryBright} style={styles.rowIcon} />
                  <View style={styles.rowContent}>
                    <Text style={styles.rowLabel}>Unlock AppName Plus</Text>
                    <Text style={styles.rowSub}>One-time purchase — unlock everything</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={theme.textOnDarkMute} />
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}

        <Text style={styles.sectionHeader}>About</Text>
        <View style={styles.sectionShadow}>
          <View style={[styles.section, { backgroundColor: theme.glass, borderColor: theme.glassBorder }]}>
            <TouchableOpacity style={[styles.row, styles.rowBorder]} onPress={() => navigation.navigate('PrivacyPolicy')}>
              <Text style={styles.rowLabel}>Privacy Policy</Text>
              <Ionicons name="chevron-forward" size={16} color={theme.textOnDarkMute} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.row, styles.rowBorder]} onPress={() => Linking.openURL('mailto:support@yourapp.com')}>
              <Text style={styles.rowLabel}>Contact Support</Text>
              <Ionicons name="chevron-forward" size={16} color={theme.textOnDarkMute} />
            </TouchableOpacity>
            <View style={[styles.row, styles.rowBorder]}>
              <Text style={styles.rowLabel}>Version</Text>
              <Text style={styles.rowValue}>AppName v1.0.0</Text>
            </View>
            <TouchableOpacity style={styles.row} onPress={handleRestore} disabled={restoring}>
              <Text style={styles.rowLabel}>Restore Purchase</Text>
              {restoring
                ? <ActivityIndicator size="small" color={theme.textMuted} />
                : <Ionicons name="chevron-forward" size={16} color={theme.textOnDarkMute} />
              }
            </TouchableOpacity>
          </View>
        </View>

        {__DEV__ && (
          <>
            <Text style={styles.sectionHeader}>Developer</Text>
            <View style={styles.sectionShadow}>
              <View style={[styles.section, { backgroundColor: theme.glass, borderColor: theme.glassBorder }]}>
                <TouchableOpacity style={[styles.row, styles.rowBorder]} onPress={async () => {
                  await setAppUnlocked();
                  setIsUnlocked(true);
                  Alert.alert('Unlocked', 'AppName Plus unlocked (dev mode).');
                }}>
                  <Ionicons name="star-outline" size={20} color={theme.primaryBright} style={styles.rowIcon} />
                  <Text style={styles.rowLabel}>Unlock Plus (Dev)</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.row, styles.rowBorder]} onPress={async () => {
                  await revokeAppUnlock();
                  setIsUnlocked(false);
                  Alert.alert('Revoked', 'AppName Plus revoked (dev mode).');
                }}>
                  <Ionicons name="star-half-outline" size={20} color={theme.textMuted} style={styles.rowIcon} />
                  <Text style={[styles.rowLabel, { color: theme.textMuted }]}>Revoke Plus (Dev)</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.row} onPress={handleDevReset}>
                  <Ionicons name="refresh-outline" size={20} color={theme.error} style={styles.rowIcon} />
                  <Text style={[styles.rowLabel, { color: theme.error }]}>Reset Onboarding</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}

      </ScrollView>

      <PaywallModal
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
        onPurchaseComplete={() => { setShowPaywall(false); setIsUnlocked(true); }}
      />
    </GradientScreen>
  );
}

function createStyles(theme: ThemeColors) {
  return StyleSheet.create({
    pageTitle:   { fontSize: 28, fontWeight: '800', color: theme.textPrimary, paddingHorizontal: 24, paddingTop: 20, paddingBottom: 4, letterSpacing: -0.5 },
    scroll:      { padding: 24, paddingTop: 8, paddingBottom: 48 },
    sectionHeader: {
      fontSize: 12, fontWeight: '700', color: theme.textMuted,
      textTransform: 'uppercase', letterSpacing: 1,
      marginBottom: 8, marginTop: 24, paddingHorizontal: 4,
    },
    sectionShadow: { borderRadius: 18, shadowColor: theme.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.10, shadowRadius: 10, elevation: 2 },
    section:     { borderRadius: 18, borderWidth: 1 },
    row:         { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, minHeight: 52 },
    rowBorder:   { borderBottomWidth: 1, borderBottomColor: theme.border },
    rowBorderTop:{ borderTopWidth: 1, borderTopColor: theme.border },
    rowIcon:     { marginRight: 14 },
    rowContent:  { flex: 1 },
    rowLabel:    { flex: 1, fontSize: 16, color: theme.textPrimary, fontWeight: '500' },
    rowSub:      { fontSize: 12, color: theme.textMuted, marginTop: 2 },
    rowValue:    { fontSize: 15, color: theme.textSecondary },
    timeValue:   { fontSize: 15, fontWeight: '700', color: theme.primary },
    themeOption: { alignItems: 'center', gap: 6, minWidth: 64 },
    themeOptionActive: {},
    themeCircle: { width: 44, height: 44, borderRadius: 22, borderWidth: 3, borderColor: 'transparent' },
    themeLabel: { fontSize: 11, fontWeight: '600', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  });
}
