import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { loadStats } from '../storage/stats';
import { getRankProgress } from '../utils/ranks';
import { checkAppUnlock } from '../services/purchases';
import MeritAmount from '../components/MeritAmount';
import RankProgressBar from '../components/RankProgressBar';
import PaywallModal from '../components/PaywallModal';
import type { SessionStats } from '../types';

const BAR_MAX_HEIGHT = 96;
const BAR_WIDTH = 30;
const WEEKDAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

type DayBar = { letter: string; sessions: number; isToday: boolean };

function buildWeek(dailySessions: Record<string, number>): DayBar[] {
  return Array.from({ length: 7 }, (_, i) => {
    const daysAgo = 6 - i;
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    const key = d.toISOString().split('T')[0];
    return {
      letter: WEEKDAY_LETTERS[d.getDay()],
      sessions: dailySessions[key] ?? 0,
      isToday: daysAgo === 0,
    };
  });
}

function StatRow({ label, value, isLast = false }: { label: string; value: string; isLast?: boolean }) {
  return (
    <View style={[styles.statRow, !isLast && styles.statRowBorder]}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

function LockedRow({ label, isLast = false }: { label: string; isLast?: boolean }) {
  return (
    <View style={[styles.statRow, !isLast && styles.statRowBorder]}>
      <Text style={styles.lockedLabel}>{label}</Text>
      <View style={styles.proBadge}>
        <Text style={styles.proBadgeText}>PRO</Text>
      </View>
    </View>
  );
}

export default function StatsScreen() {
  const [stats, setStats] = useState<SessionStats | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);

  useFocusEffect(
    useCallback(() => {
      Promise.all([loadStats(), checkAppUnlock()]).then(([s, unlocked]) => {
        setStats(s);
        setIsUnlocked(unlocked);
      });
    }, [])
  );

  const totalHours = stats ? (stats.totalMinutes / 60).toFixed(1) : '0.0';
  const week = buildWeek(stats?.dailySessions ?? {});
  const weekMax = Math.max(1, ...week.map(d => d.sessions));
  const progress = getRankProgress(stats?.totalEarned ?? 0);
  const completed = stats?.sessionsCompleted ?? 0;
  const abandoned = stats?.sessionsAbandoned ?? 0;
  const attempts = completed + abandoned;
  const disciplineLabel = attempts > 0
    ? `${Math.round((completed / attempts) * 100)}%`
    : '—';

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Total earned */}
        <Text style={styles.earnedLabel}>TOTAL EARNED</Text>
        <MeritAmount
          amount={stats?.totalEarned ?? 0}
          symbolSize={36}
          textStyle={styles.earnedValue}
          color={Colors.primaryText}
          style={styles.earnedValueRow}
        />

        {/* 7-day chart — free */}
        <View style={styles.card}>
          <BlurView intensity={28} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={styles.cardOverlay} />
          <View style={styles.cardInner}>
            <Text style={styles.chartLabel}>LAST 7 DAYS</Text>
            <View style={styles.chartRow}>
              {week.map((day, i) => (
                <View key={i} style={styles.barCol}>
                  <View style={styles.barTrack}>
                    {day.sessions > 0 && (
                      <View
                        style={[
                          styles.bar,
                          {
                            height: Math.max(6, BAR_MAX_HEIGHT * (day.sessions / weekMax)),
                            opacity: day.isToday ? 0.98 : 0.55,
                          },
                        ]}
                      />
                    )}
                  </View>
                  <Text style={[styles.dayLabel, day.isToday && styles.dayLabelToday]}>
                    {day.letter}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Rank card */}
        <View style={styles.card}>
          <BlurView intensity={28} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={styles.cardOverlay} />
          <View style={styles.cardInner}>
            <View style={styles.rankHeader}>
              <Text style={styles.rankKicker}>
                RANK {progress.current.level.toString().padStart(2, '0')}
              </Text>
              <Text style={styles.rankTitle}>{progress.current.title.toUpperCase()}</Text>
            </View>
            {isUnlocked ? (
              <RankProgressBar
                percent={progress.percent}
                leftLabel={progress.isMax ? 'Max rank reached' : progress.current.title}
                rightLabel={
                  progress.isMax ? 'THE LEGACY' : `${progress.meritToNext} to ${progress.next!.title}`
                }
              />
            ) : (
              <TouchableOpacity
                style={styles.rankLock}
                onPress={() => setShowPaywall(true)}
                activeOpacity={0.7}
              >
                <Text style={styles.rankLockText}>Rank progress</Text>
                <View style={styles.proBadge}>
                  <Text style={styles.proBadgeText}>PRO</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Stat rows */}
        <View style={[styles.card, styles.statCard]}>
          <BlurView intensity={28} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={styles.cardOverlay} />
          <View style={styles.statCardInner}>

            {/* Free rows */}
            <StatRow label="Sessions" value={String(completed)} />
            <StatRow label="Streak" value={`${stats?.currentStreak ?? 0} days`} />

            {/* Pro rows */}
            {isUnlocked ? (
              <>
                <StatRow label="Discipline"  value={disciplineLabel} />
                <StatRow label="Best Streak" value={`${stats?.longestStreak ?? 0} days`} />
                <StatRow label="Total Hours" value={`${totalHours} h`} isLast />
              </>
            ) : (
              <TouchableOpacity
                style={styles.lockedSection}
                onPress={() => setShowPaywall(true)}
                activeOpacity={0.85}
              >
                <View style={styles.lockedDivider} />
                <LockedRow label="Discipline" />
                <LockedRow label="Best Streak" />
                <LockedRow label="Total Hours" isLast />
                <View style={styles.upgradeHint}>
                  <Text style={styles.upgradeHintText}>Unlock with Method Pro</Text>
                  <Ionicons name="arrow-forward" size={11} color="rgba(255,255,255,0.28)" />
                </View>
              </TouchableOpacity>
            )}
          </View>
        </View>

      </ScrollView>

      <PaywallModal
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
        onUnlocked={() => setIsUnlocked(true)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingTop: 88, paddingHorizontal: 24, paddingBottom: 100 },

  earnedLabel:    { ...Typography.personaLabel, color: Colors.pureWhite, marginBottom: 9 },
  earnedValueRow: { marginBottom: 28 },
  earnedValue:    { ...Typography.sectionHeadline },

  card: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: Colors.glassBorder,
    marginBottom: 12,
  },
  cardOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: Colors.glassBg },
  cardInner:   { padding: 20 },

  chartLabel: { ...Typography.chartLabel, color: Colors.dim, marginBottom: 20 },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: BAR_MAX_HEIGHT + 20,
  },
  barCol:   { alignItems: 'center', gap: 6 },
  barTrack: {
    width: BAR_WIDTH,
    height: BAR_MAX_HEIGHT,
    backgroundColor: Colors.chartTrack,
    borderRadius: 6,
    justifyContent: 'flex-end',
  },
  bar: {
    width: BAR_WIDTH,
    backgroundColor: Colors.primaryText,
    borderRadius: 6,
  },
  dayLabel:      { ...Typography.dayLabel, color: Colors.dim },
  dayLabelToday: { color: Colors.pureWhite, fontWeight: '700' },

  rankHeader: { marginBottom: 18 },
  rankKicker: {
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 2.5,
    color: Colors.dim,
    marginBottom: 6,
  },
  rankTitle: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
    color: Colors.pureWhite,
  },
  rankLock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.07)',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  rankLockText: {
    fontSize: 13,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.28)',
  },

  statCard:      {},
  statCardInner: { paddingHorizontal: 20 },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
  },
  statRowBorder:  { borderBottomWidth: 0.5, borderBottomColor: Colors.statSeparator },
  statLabel:      { ...Typography.statRowLabel, color: Colors.dim },
  statValue:      { ...Typography.statRowValue, color: Colors.primaryText },

  lockedSection: { gap: 0 },
  lockedDivider: {
    height: 0.5,
    backgroundColor: Colors.statSeparator,
    marginBottom: 0,
  },
  lockedLabel: { ...Typography.statRowLabel, color: 'rgba(255,255,255,0.20)' },
  proBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  proBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
    color: 'rgba(255,255,255,0.32)',
  },
  upgradeHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingTop: 14,
    paddingBottom: 4,
  },
  upgradeHintText: {
    fontSize: 11,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.28)',
    letterSpacing: 0.2,
  },
});
