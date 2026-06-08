import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { loadStats } from '../storage/stats';
import type { SessionStats } from '../types';

const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const BAR_MAX_HEIGHT = 96;
const BAR_WIDTH = 30;
const SAMPLE_HEIGHTS = [0.62, 0.86, 0.44, 1.0, 0.74, 0.38, 0.60];

function StatRow({ label, value, isLast = false }: { label: string; value: string; isLast?: boolean }) {
  return (
    <View style={[styles.statRow, !isLast && styles.statRowBorder]}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

export default function StatsScreen() {
  const [stats, setStats] = useState<SessionStats | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadStats().then(setStats);
    }, [])
  );

  const totalHours = stats ? (stats.totalMinutes / 60).toFixed(1) : '0.0';

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.earnedLabel}>TOTAL EARNED</Text>
        <Text style={styles.earnedValue}>
          ${(stats?.totalEarned ?? 0).toLocaleString()}
        </Text>

        <View style={styles.card}>
          <BlurView intensity={28} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={styles.cardOverlay} />
          <View style={styles.cardInner}>
            <Text style={styles.chartLabel}>THIS WEEK</Text>
            <View style={styles.chartRow}>
              {DAYS.map((day, i) => (
                <View key={i} style={styles.barCol}>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.bar,
                        {
                          height: BAR_MAX_HEIGHT * SAMPLE_HEIGHTS[i],
                          opacity: i === 3 ? 0.95 : 0.62,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.dayLabel}>{day}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        <View style={[styles.card, styles.statCard]}>
          <BlurView intensity={28} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={styles.cardOverlay} />
          <View style={styles.statCardInner}>
            <StatRow label="Sessions"    value={String(stats?.sessionsCompleted ?? 0)} />
            <StatRow label="Streak"      value={`${stats?.currentStreak ?? 0} days`} />
            <StatRow label="Best Streak" value={`${stats?.longestStreak ?? 0} days`} />
            <StatRow label="Total Hours" value={`${totalHours} h`} isLast />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:  { flex: 1, backgroundColor: Colors.background },
  scroll: {
    paddingTop: 88,
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  earnedLabel: {
    ...Typography.personaLabel,
    color: Colors.pureWhite,
    marginBottom: 9,
  },
  earnedValue: {
    ...Typography.sectionHeadline,
    color: Colors.primaryText,
    marginBottom: 28,
  },
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: Colors.glassBorder,
    marginBottom: 12,
  },
  cardOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: Colors.glassBg },
  cardInner:   { padding: 20 },
  chartLabel: {
    ...Typography.chartLabel,
    color: Colors.dim,
    marginBottom: 20,
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 13,
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
  dayLabel:     { ...Typography.dayLabel, color: Colors.dim },
  statCard:     {},
  statCardInner: { paddingHorizontal: 20 },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 15,
  },
  statRowBorder: { borderBottomWidth: 0.5, borderBottomColor: Colors.statSeparator },
  statLabel:    { ...Typography.statRowLabel, color: Colors.dim },
  statValue:    { ...Typography.statRowValue, color: Colors.primaryText },
});
