import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';

type Props = {
  streak: number;
  dailySessions: Record<string, number>;
};

function dateKey(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
}

export default function StreakPill({ streak, dailySessions }: Props) {
  const days = Array.from({ length: 7 }, (_, i) => ({
    active: (dailySessions[dateKey(6 - i)] ?? 0) > 0,
    isToday: i === 6,
  }));

  const hasStreak = streak > 0;

  return (
    <View style={styles.pill}>
      <BlurView intensity={28} tint="dark" style={StyleSheet.absoluteFill} />
      <LinearGradient
        colors={['rgba(255,255,255,0.10)', 'rgba(255,255,255,0.03)']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />
      <View style={styles.shine} />

      {/* Left: icon + count */}
      <View style={styles.left}>
        <Ionicons
          name={hasStreak ? 'flame' : 'flame-outline'}
          size={26}
          color={hasStreak ? Colors.pureWhite : 'rgba(255,255,255,0.20)'}
        />
        <View style={styles.countWrap}>
          <Text style={[styles.count, !hasStreak && styles.countDim]}>
            {streak}
          </Text>
          <Text style={styles.label}>
            {hasStreak ? 'DAY STREAK' : 'NO STREAK'}
          </Text>
        </View>
      </View>

      {/* Right: 7-day dots */}
      <View style={styles.dots}>
        {days.map(({ active, isToday }, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              active ? styles.dotActive : styles.dotInactive,
              isToday && active && styles.dotToday,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'stretch',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    paddingHorizontal: 18,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  shine: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  countWrap: { gap: 1 },
  count: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.pureWhite,
    letterSpacing: -1,
    lineHeight: 30,
  },
  countDim: { color: 'rgba(255,255,255,0.25)' },
  label: {
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 1.8,
    color: 'rgba(255,255,255,0.30)',
  },
  dots: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotActive:   { backgroundColor: 'rgba(255,255,255,0.80)' },
  dotInactive: { backgroundColor: 'rgba(255,255,255,0.13)' },
  dotToday:    { backgroundColor: '#FFFFFF' },
});
