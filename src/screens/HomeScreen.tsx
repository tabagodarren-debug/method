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
import RankProgressBar from '../components/RankProgressBar';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { loadPersona } from '../storage/persona';
import { loadStats } from '../storage/stats';
import { getRankProgress } from '../utils/ranks';
import { getGoalCountdown } from '../utils/goal';
import type { RootStackParamList, PersonaData, SessionStats } from '../types';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Good morning.';
  if (hour >= 12 && hour < 17) return 'Good afternoon.';
  if (hour >= 17 && hour < 21) return 'Good evening.';
  return 'Late night grind.';
}

function todayKey(): string {
  return new Date().toISOString().split('T')[0];
}

function yesterdayKey(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

function StatPill({ label, sessions, merit }: { label: string; sessions: number; merit: number }) {
  return (
    <View style={styles.statPill}>
      <BlurView intensity={24} tint="dark" style={StyleSheet.absoluteFill} />
      <LinearGradient
        colors={['rgba(255,255,255,0.10)', 'rgba(255,255,255,0.03)']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />
      <Text style={styles.statPillLabel}>{label}</Text>
      <Text style={styles.statPillSessions}>
        {sessions > 0 ? sessions : '—'}
        {sessions > 0 ? <Text style={styles.statPillUnit}> {sessions === 1 ? 'session' : 'sessions'}</Text> : null}
      </Text>
      {sessions > 0 && <Text style={styles.statPillMerit}>+{merit} MERIT$</Text>}
    </View>
  );
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

  const total = stats?.totalEarned ?? 0;
  const progress = getRankProgress(total);
  const streakLabel = stats
    ? stats.currentStreak === 1 ? 'Day 1 Streak' : `Day ${stats.currentStreak} Streak`
    : '';

  const dailySessions = stats?.dailySessions ?? {};
  const todaySessions = dailySessions[todayKey()] ?? 0;
  const todayMerit = todaySessions * 25;
  const yesterdaySessions = dailySessions[yesterdayKey()] ?? 0;
  const yesterdayMerit = yesterdaySessions * 25;

  const countdown = persona ? getGoalCountdown(persona) : null;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.center}>
        <Text style={styles.greeting}>{getGreeting()}</Text>
        <View style={styles.identityRow}>
          {persona && <Text style={styles.personaLabel}>{persona.name.toUpperCase()}</Text>}
          {persona && <View style={styles.identityDot} />}
          <Text style={styles.rankLabel}>{progress.current.title.toUpperCase()}</Text>
        </View>

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
            amount={total}
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

          <View style={styles.cardDivider} />

          <RankProgressBar
            percent={progress.percent}
            leftLabel={progress.isMax ? 'Max rank reached' : `${progress.current.title}`}
            rightLabel={progress.isMax ? 'THE LEGACY' : `${progress.meritToNext} to ${progress.next!.title}`}
          />
        </View>

        {/* Goal countdown */}
        {countdown && (
          <Text style={styles.countdown}>
            <Text style={styles.countdownNum}>{countdown.daysRemaining}</Text>
            {countdown.daysRemaining === 1 ? ' day' : ' days'} to your goal
          </Text>
        )}

        {/* Today + Yesterday stat pills */}
        <View style={styles.statRow}>
          <StatPill label="Today" sessions={todaySessions} merit={todayMerit} />
          <StatPill label="Yesterday" sessions={yesterdaySessions} merit={yesterdayMerit} />
        </View>

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
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
  },
  personaLabel: {
    ...Typography.personaLabel,
    color: Colors.pureWhite,
  },
  identityDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.dim,
  },
  rankLabel: {
    ...Typography.personaLabel,
    color: 'rgba(255,255,255,0.55)',
  },
  meritGlass: {
    borderRadius: 32,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 32,
    paddingTop: 24,
    paddingBottom: 22,
    alignItems: 'center',
    marginBottom: 14,
    width: '100%',
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
    marginBottom: 4,
  },
  cardDivider: {
    height: 1,
    alignSelf: 'stretch',
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginVertical: 16,
  },
  countdown: {
    fontSize: 12,
    fontWeight: '300',
    color: 'rgba(255,255,255,0.40)',
    marginBottom: 18,
    letterSpacing: 0.3,
  },
  countdownNum: {
    fontWeight: '600',
    color: 'rgba(255,255,255,0.70)',
  },
  statRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
    alignSelf: 'stretch',
  },
  statPill: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  statPillLabel: {
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.30)',
    marginBottom: 6,
  },
  statPillSessions: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.pureWhite,
    letterSpacing: -0.5,
  },
  statPillUnit: {
    fontSize: 12,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.50)',
  },
  statPillMerit: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.65)',
    marginTop: 4,
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
