import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Colors } from '../constants/colors';
import { loadStats } from '../storage/stats';
import { getRankProgress } from '../utils/ranks';
import { checkAppUnlock } from '../services/purchases';
import MeritAmount from '../components/MeritAmount';
import RankProgressBar from '../components/RankProgressBar';
import PaywallModal from '../components/PaywallModal';
import type { SessionStats } from '../types';

const BAR_MAX_HEIGHT = 72;
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

function StatRow({ label, value, delay = 0, isLast = false }: {
  label: string;
  value: string;
  delay?: number;
  isLast?: boolean;
}) {
  return (
    <Animated.View
      entering={FadeInDown.delay(delay).duration(360)}
      style={[styles.statRow, !isLast && styles.statRowBorder]}
    >
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </Animated.View>
  );
}

function LockedRow({ label, delay = 0, isLast = false }: { label: string; delay?: number; isLast?: boolean }) {
  return (
    <Animated.View
      entering={FadeInDown.delay(delay).duration(360)}
      style={[styles.statRow, !isLast && styles.statRowBorder]}
    >
      <Text style={styles.lockedLabel}>{label}</Text>
      <View style={styles.proBadge}>
        <Text style={styles.proBadgeText}>PRO</Text>
      </View>
    </Animated.View>
  );
}

export default function StatsScreen() {
  const [stats, setStats] = useState<SessionStats | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [animateKey, setAnimateKey] = useState(0);

  useFocusEffect(
    useCallback(() => {
      Promise.all([loadStats(), checkAppUnlock()]).then(([s, unlocked]) => {
        setStats(s);
        setIsUnlocked(unlocked);
        setAnimateKey(k => k + 1);
      });
    }, [])
  );

  const totalHours = stats ? (stats.totalMinutes / 60).toFixed(1) : '0.0';
  const week = buildWeek(stats?.dailySessions ?? {});
  const weekMax = Math.max(1, ...week.map(d => d.sessions));

  const dailySessions = stats?.dailySessions ?? {};
  const thisWeekTotal = week.reduce((sum, d) => sum + d.sessions, 0);
  const prevWeekTotal = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    return dailySessions[d.toISOString().split('T')[0]] ?? 0;
  }).reduce((sum, n) => sum + n, 0);
  const weekDelta = thisWeekTotal - prevWeekTotal;

  const progress = getRankProgress(stats?.totalEarned ?? 0);
  const completed = stats?.sessionsCompleted ?? 0;
  const abandoned = stats?.sessionsAbandoned ?? 0;
  const attempts = completed + abandoned;
  const disciplineLabel = attempts > 0
    ? `${Math.round((completed / attempts) * 100)}%`
    : '—';

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>

        {/* Overview card — merit + rank + progress */}
        <Animated.View entering={FadeInDown.duration(500)}>
          <GlassCard>
            <View style={styles.overviewTop}>
              <View style={styles.overviewLeft}>
                <Text style={styles.overviewKicker}>TOTAL EARNED</Text>
                <MeritAmount
                  amount={stats?.totalEarned ?? 0}
                  animateKey={animateKey}
                  symbolSize={36}
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
                animateKey={animateKey}
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
              <View style={styles.chartHeader}>
                <Text style={styles.chartLabel}>LAST 7 DAYS</Text>
                {prevWeekTotal > 0 || thisWeekTotal > 0 ? (
                  <Text style={[styles.weekDelta, weekDelta >= 0 ? styles.weekDeltaUp : styles.weekDeltaDown]}>
                    {weekDelta > 0 ? `↑ ${weekDelta}` : weekDelta < 0 ? `↓ ${Math.abs(weekDelta)}` : '—'} vs last week
                  </Text>
                ) : null}
              </View>
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
              <StatRow key={`sessions-${animateKey}`} label="Sessions" value={String(completed)} delay={220} />
              <StatRow key={`streak-${animateKey}`} label="Streak" value={`${stats?.currentStreak ?? 0} days`} delay={280} />
              {isUnlocked ? (
                <>
                  <StatRow key={`discipline-${animateKey}`} label="Discipline" value={disciplineLabel} delay={340} />
                  <StatRow key={`best-${animateKey}`} label="Best Streak" value={`${stats?.longestStreak ?? 0} days`} delay={400} />
                  <StatRow key={`hours-${animateKey}`} label="Total Hours" value={`${totalHours} h`} delay={460} isLast />
                </>
              ) : (
                <TouchableOpacity
                  style={styles.lockedSection}
                  onPress={() => setShowPaywall(true)}
                  activeOpacity={0.85}
                >
                  <View style={styles.lockedDivider} />
                  <LockedRow key={`locked-discipline-${animateKey}`} label="Discipline" delay={340} />
                  <LockedRow key={`locked-best-${animateKey}`} label="Best Streak" delay={400} />
                  <LockedRow key={`locked-hours-${animateKey}`} label="Total Hours" delay={460} isLast />
                  <View style={styles.upgradeHint}>
                    <Text style={styles.upgradeHintText}>Unlock with Method Pro</Text>
                    <Ionicons name="arrow-forward" size={11} color="rgba(255,255,255,0.28)" />
                  </View>
                </TouchableOpacity>
              )}
            </View>
          </GlassCard>
        </Animated.View>

      </View>

      <PaywallModal
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
        onUnlocked={() => setIsUnlocked(true)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1, paddingHorizontal: 24, paddingTop: 20, paddingBottom: 20, gap: 12 },

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
    marginBottom: 16,
  },

  overviewTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
  },
  overviewProgress: { paddingHorizontal: 24, paddingBottom: 20 },
  overviewLeft:     { gap: 6 },
  overviewRight:    { alignItems: 'flex-end', gap: 6 },
  overviewKicker: {
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 2,
    color: 'rgba(255,255,255,0.35)',
  },
  overviewMerit: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -1.5,
  },
  overviewRank: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.4,
    color: Colors.pureWhite,
    textAlign: 'right',
  },

  cardInner: { padding: 20 },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  chartLabel: {
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 2,
    color: 'rgba(255,255,255,0.35)',
  },
  weekDelta:     { fontSize: 11, fontWeight: '500', letterSpacing: 0.2 },
  weekDeltaUp:   { color: 'rgba(255,255,255,0.65)' },
  weekDeltaDown: { color: 'rgba(255,255,255,0.28)' },
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
  bar:           { width: BAR_WIDTH, backgroundColor: Colors.pureWhite, borderRadius: 8 },
  dayLabel:      { fontSize: 10, fontWeight: '500', color: 'rgba(255,255,255,0.30)', letterSpacing: 0.3 },
  dayLabelToday: { color: Colors.pureWhite, fontWeight: '700' },

  statCardInner:  { paddingHorizontal: 22 },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 13,
  },
  statRowBorder:  { borderBottomWidth: 0.5, borderBottomColor: 'rgba(255,255,255,0.08)' },
  statLabel:      { fontSize: 14, fontWeight: '400', color: 'rgba(255,255,255,0.55)' },
  statValue:      { fontSize: 14, fontWeight: '600', color: Colors.pureWhite },

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
    paddingTop: 12,
    paddingBottom: 4,
  },
  upgradeHintText: {
    fontSize: 11,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.28)',
    letterSpacing: 0.2,
  },
});
