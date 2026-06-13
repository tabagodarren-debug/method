import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { loadStats } from '../storage/stats';
import { getRankProgress } from '../utils/ranks';
import { checkAppUnlock } from '../services/purchases';
import MeritAmount from '../components/MeritAmount';
import RankProgressBar from '../components/RankProgressBar';
import PaywallModal from '../components/PaywallModal';
import type { SessionStats } from '../types';

const BAR_MAX_HEIGHT = 88;
const BAR_WIDTH = 28;
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

function GlassCard({ children, style }: { children: React.ReactNode; style?: object }) {
  return (
    <View style={[styles.card, style]}>
      <BlurView intensity={32} tint="dark" style={StyleSheet.absoluteFill} />
      <LinearGradient
        colors={['rgba(255,255,255,0.13)', 'rgba(255,255,255,0.04)']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />
      <View style={styles.cardShine} />
      {children}
    </View>
  );
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

        {/* Overview card — merit + rank + progress */}
        <Animated.View entering={FadeInDown.duration(500)}>
          <GlassCard>
            <View style={styles.overviewTop}>
              <View style={styles.overviewLeft}>
                <Text style={styles.overviewKicker}>TOTAL EARNED</Text>
                <MeritAmount
                  amount={stats?.totalEarned ?? 0}
                  symbolSize={40}
                  textStyle={styles.overviewMerit}
                  color={Colors.pureWhite}
                />
              </View>
              <View style={styles.overviewRight}>
                <Text style={styles.overviewKicker}>
                  RANK {progress.current.level.toString().padStart(2, '0')}
                </Text>
                <Text style={styles.overviewRank}>
                  {progress.current.title.toUpperCase()}
                </Text>
              </View>
            </View>
            <View style={styles.cardDivider} />
            <View style={styles.overviewProgress}>
              <RankProgressBar
                percent={progress.percent}
                leftLabel={progress.isMax ? 'Max rank reached' : progress.current.title}
                rightLabel={
                  progress.isMax
                    ? 'THE LEGACY'
                    : `${progress.meritToNext} MERIT$ TO RANK`
                }
              />
            </View>
          </GlassCard>
        </Animated.View>

        {/* 7-day chart — free */}
        <Animated.View entering={FadeInDown.delay(80).duration(500)}>
          <GlassCard>
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
                              opacity: day.isToday ? 1 : 0.45,
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
          </GlassCard>
        </Animated.View>

        {/* Stat rows */}
        <Animated.View entering={FadeInDown.delay(160).duration(500)}>
          <GlassCard>
            <View style={styles.statCardInner}>

              {/* Free rows */}
              <StatRow label="Sessions" value={String(completed)} />
              <StatRow label="Streak"   value={`${stats?.currentStreak ?? 0} days`} />

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
          </GlassCard>
        </Animated.View>

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
  scroll: { paddingTop: 88, paddingHorizontal: 24, paddingBottom: 100, gap: 12 },

  card: {
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  cardShine: {
    position: 'absolute',
    top: 0,
    left: 24,
    right: 24,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.40)',
  },
  cardDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginHorizontal: 24,
    marginBottom: 18,
  },

  // Overview card
  overviewTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingTop: 22,
    paddingBottom: 20,
  },
  overviewProgress: { paddingHorizontal: 24, paddingBottom: 22 },
  overviewLeft:   { gap: 6 },
  overviewRight:  { alignItems: 'flex-end', gap: 6 },
  overviewKicker: {
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 2,
    color: 'rgba(255,255,255,0.35)',
  },
  overviewMerit: {
    fontSize: 38,
    fontWeight: '800',
    letterSpacing: -1.5,
    color: Colors.pureWhite,
  },
  overviewRank: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.4,
    color: Colors.pureWhite,
    textAlign: 'right',
  },

  // Chart card
  cardInner: { padding: 22 },
  chartLabel: {
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 2,
    color: 'rgba(255,255,255,0.35)',
    marginBottom: 20,
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: BAR_MAX_HEIGHT + 20,
  },
  barCol: { alignItems: 'center', gap: 8 },
  barTrack: {
    width: BAR_WIDTH,
    height: BAR_MAX_HEIGHT,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 8,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  bar: {
    width: BAR_WIDTH,
    backgroundColor: Colors.pureWhite,
    borderRadius: 8,
  },
  dayLabel:      { fontSize: 10, fontWeight: '500', color: 'rgba(255,255,255,0.30)', letterSpacing: 0.3 },
  dayLabelToday: { color: Colors.pureWhite, fontWeight: '700' },

  // Stat rows
  statCardInner: { paddingHorizontal: 22 },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  statRowBorder:  { borderBottomWidth: 0.5, borderBottomColor: 'rgba(255,255,255,0.08)' },
  statLabel:      { fontSize: 14, fontWeight: '400', color: 'rgba(255,255,255,0.55)' },
  statValue:      { fontSize: 14, fontWeight: '600', color: Colors.pureWhite },

  // Locked section
  lockedSection:  { gap: 0 },
  lockedDivider:  { height: 0.5, backgroundColor: 'rgba(255,255,255,0.08)' },
  lockedLabel:    { fontSize: 14, fontWeight: '400', color: 'rgba(255,255,255,0.20)' },
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
    paddingBottom: 6,
  },
  upgradeHintText: {
    fontSize: 11,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.28)',
    letterSpacing: 0.2,
  },
});
