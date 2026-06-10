import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import PillButton from '../components/PillButton';
import MeritAmount from '../components/MeritAmount';
import WeekStrip from '../components/WeekStrip';
import ShareCard from '../components/ShareCard';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { loadPersona } from '../storage/persona';
import { loadStats } from '../storage/stats';
import type { RootStackParamList, PersonaData, SessionStats } from '../types';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Good morning.';
  if (hour >= 12 && hour < 17) return 'Good afternoon.';
  if (hour >= 17 && hour < 21) return 'Good evening.';
  return 'Late night grind.';
}

function yesterdayKey(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

export default function HomeScreen() {
  const nav = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [persona, setPersona] = useState<PersonaData | null>(null);
  const [stats, setStats] = useState<SessionStats | null>(null);
  const [showShare, setShowShare] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadPersona().then(setPersona);
      loadStats().then(setStats);
    }, [])
  );

  const streakLabel = stats
    ? stats.currentStreak === 1 ? 'Day 1 Streak' : `Day ${stats.currentStreak} Streak`
    : '';

  const dailySessions = stats?.dailySessions ?? {};
  const yesterdaySessions = dailySessions[yesterdayKey()] ?? 0;
  const yesterdayMerit = yesterdaySessions * 25;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.center}>
        <Text style={styles.greeting}>{getGreeting()}</Text>
        {persona && (
          <Text style={styles.personaLabel}>{persona.name.toUpperCase()}</Text>
        )}

        {/* Glass merit card */}
        <View style={styles.meritGlass}>
          <BlurView intensity={32} tint="dark" style={StyleSheet.absoluteFill} />
          <LinearGradient
            colors={['rgba(255,255,255,0.14)', 'rgba(255,255,255,0.04)']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
          />
          <View style={styles.meritShine} />
          <MeritAmount
            amount={stats?.totalEarned ?? 0}
            symbolSize={72}
            textStyle={styles.counter}
            color={Colors.pureWhite}
          />
          {stats && stats.currentStreak > 0 && (
            <Text style={styles.streak}>{streakLabel}</Text>
          )}
          <View style={styles.weekStripRow}>
            <WeekStrip dailySessions={dailySessions} />
          </View>
        </View>

        {/* Yesterday pill */}
        {yesterdaySessions > 0 && (
          <View style={styles.yesterdayPill}>
            <BlurView intensity={24} tint="dark" style={StyleSheet.absoluteFill} />
            <LinearGradient
              colors={['rgba(255,255,255,0.10)', 'rgba(255,255,255,0.03)']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
            />
            <Text style={styles.yesterdayText}>
              {yesterdaySessions} {yesterdaySessions === 1 ? 'session' : 'sessions'} yesterday
              {'  ·  '}
              <Text style={styles.yesterdayMerit}>+{yesterdayMerit} merit</Text>
            </Text>
          </View>
        )}

        <PillButton
          label="Lock in"
          onPress={() => nav.navigate('FocusSession')}
          style={styles.startBtn}
        />

        {/* Share progress */}
        <TouchableOpacity style={styles.shareRow} onPress={() => setShowShare(true)}>
          <Ionicons name="share-outline" size={13} color="rgba(255,255,255,0.35)" />
          <Text style={styles.shareLabel}>Share progress</Text>
        </TouchableOpacity>
      </View>

      {stats && (
        <ShareCard
          visible={showShare}
          onClose={() => setShowShare(false)}
          stats={stats}
          persona={persona}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.background },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingBottom: 72,
  },
  greeting: {
    fontSize: 13,
    fontWeight: '300',
    color: Colors.fade,
    marginBottom: 8,
    textAlign: 'center',
  },
  personaLabel: {
    ...Typography.personaLabel,
    color: Colors.pureWhite,
    marginBottom: 24,
  },
  meritGlass: {
    borderRadius: 32,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 32,
    paddingVertical: 24,
    alignItems: 'center',
    marginBottom: 12,
  },
  meritShine: {
    position: 'absolute',
    top: 0,
    left: 24,
    right: 24,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  counter: { ...Typography.heroNumber },
  streak: {
    ...Typography.metaLabel,
    color: Colors.dim,
    marginTop: 6,
    marginBottom: 14,
  },
  weekStripRow: {
    marginTop: 2,
  },
  yesterdayPill: {
    borderRadius: 100,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 20,
  },
  yesterdayText: {
    fontSize: 12,
    fontWeight: '400',
    letterSpacing: 0.2,
    color: 'rgba(255,255,255,0.45)',
  },
  yesterdayMerit: {
    color: 'rgba(255,255,255,0.65)',
    fontWeight: '500',
  },
  startBtn: { marginBottom: 16 },
  shareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 4,
  },
  shareLabel: {
    fontSize: 12,
    fontWeight: '400',
    letterSpacing: 0.3,
    color: 'rgba(255,255,255,0.35)',
  },
});
