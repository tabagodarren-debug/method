import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Alert, ScrollView } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { loadPersona, clearPersona } from '../storage/persona';
import { checkAppUnlock } from '../services/purchases';
import { resetStats, loadStats } from '../storage/stats';
import { resetShield } from '../storage/shield';
import type { SessionStats } from '../types';
import RankUpCard from '../components/RankUpCard';
import { RANKS } from '../utils/ranks';
import type { PersonaData, RootStackParamList } from '../types';

const TIMELINE_LABELS: Record<string, string> = {
  '6mo': '6 months',
  '1yr': '1 year',
  '2yr': '2 years',
  '5yr': '5 years',
};

function SettingRow({ label, value, isLast = false }: { label: string; value: string; isLast?: boolean }) {
  return (
    <View style={[styles.row, !isLast && styles.rowBorder]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue} numberOfLines={1}>{value}</Text>
    </View>
  );
}

export default function SettingsScreen() {
  const nav = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [persona, setPersona] = useState<PersonaData | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showRankTest, setShowRankTest] = useState(false);
  const [testRankIndex, setTestRankIndex] = useState(1);
  const [testStats, setTestStats] = useState<SessionStats | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadPersona().then(setPersona);
      checkAppUnlock().then(setIsUnlocked);
      loadStats().then(setTestStats);
    }, [])
  );

  const handleResetStats = () => {
    Alert.alert('Reset all stats?', 'Merit, sessions, streaks and rank will be wiped.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reset', style: 'destructive', onPress: () => { resetStats(); resetShield(); } },
    ]);
  };

  const handleTestRankUp = () => {
    setTestRankIndex(i => (i % (RANKS.length - 1)) + 1);
    setShowRankTest(true);
  };

  const handleResetPersona = () => {
    Alert.alert('Reset persona?', 'This will restart onboarding.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset', style: 'destructive',
        onPress: async () => {
          await clearPersona();
          nav.reset({ index: 0, routes: [{ name: 'Onboarding' }] });
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        <Text style={styles.sectionTitle}>YOUR PERSONA</Text>
        <View style={styles.card}>
          <BlurView intensity={28} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={styles.cardOverlay} />
          <View style={styles.cardInner}>
            {persona ? (
              <>
                <SettingRow label="Name"     value={persona.name} />
                <SettingRow label="Goal"     value={persona.goal} />
                <SettingRow label="Timeline" value={TIMELINE_LABELS[persona.timeline] ?? persona.timeline} isLast />
              </>
            ) : (
              <SettingRow label="Status" value="Not set" isLast />
            )}
          </View>
        </View>
        <TouchableOpacity style={styles.linkBtn} onPress={handleResetPersona}>
          <Text style={styles.linkLabel}>Edit persona</Text>
        </TouchableOpacity>

        <Text style={[styles.sectionTitle, { marginTop: 32 }]}>METHOD PRO</Text>
        <View style={styles.card}>
          <BlurView intensity={28} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={styles.cardOverlay} />
          <View style={styles.cardInner}>
            <SettingRow label="Status" value={isUnlocked ? 'Active' : 'Free'} isLast />
          </View>
        </View>
        {!isUnlocked && (
          <TouchableOpacity
            style={styles.linkBtn}
            onPress={() => Alert.alert('Coming soon', 'Method Pro — $3.99 one-time IAP coming in next build.')}
          >
            <Text style={styles.linkLabel}>Unlock Method Pro — $3.99</Text>
          </TouchableOpacity>
        )}

        <Text style={[styles.sectionTitle, { marginTop: 32 }]}>DEVELOPER</Text>
        <View style={styles.card}>
          <BlurView intensity={28} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={styles.cardOverlay} />
          <View style={styles.cardInner}>
            <TouchableOpacity style={[styles.row, styles.rowBorder]} onPress={handleResetStats}>
              <Text style={[styles.rowLabel, { color: '#FF6B6B' }]}>Reset merits, sessions & rank</Text>
              <Ionicons name="trash-outline" size={16} color="#FF6B6B" />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.row, styles.rowBorder]} onPress={handleTestRankUp}>
              <Text style={styles.rowLabel}>Test rank up screen</Text>
              <Ionicons name="trophy-outline" size={16} color={Colors.dim} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.row}
              onPress={() => nav.reset({ index: 0, routes: [{ name: 'Onboarding' }] })}
            >
              <Text style={styles.rowLabel}>Go to onboarding</Text>
              <Ionicons name="arrow-forward-outline" size={16} color={Colors.dim} />
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>

      <RankUpCard
        visible={showRankTest}
        rank={RANKS[testRankIndex]}
        stats={testStats}
        onShare={() => setShowRankTest(false)}
        onContinue={() => setShowRankTest(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: Colors.background },
  content:      { paddingTop: 88, paddingHorizontal: 24, paddingBottom: 100 },
  sectionTitle: { ...Typography.personaLabel, color: Colors.pureWhite, marginBottom: 12 },
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: Colors.glassBorder,
    marginBottom: 4,
  },
  cardOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: Colors.glassBg },
  cardInner:   { paddingHorizontal: 20 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
  },
  rowBorder:  { borderBottomWidth: 0.5, borderBottomColor: Colors.statSeparator },
  rowLabel:   { ...Typography.statRowLabel, color: Colors.dim },
  rowValue:   { ...Typography.statRowValue, color: Colors.primaryText, maxWidth: '60%' },
  linkBtn:    { paddingVertical: 12, paddingHorizontal: 4 },
  linkLabel:  { ...Typography.metaLabel, color: Colors.fade },
});
