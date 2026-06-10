import React from 'react';
import { View, StyleSheet } from 'react-native';

type Props = {
  dailySessions: Record<string, number>;
  dotSize?: number;
};

function dateKey(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
}

export default function WeekStrip({ dailySessions, dotSize = 8 }: Props) {
  const days = Array.from({ length: 7 }, (_, i) => ({
    active: (dailySessions[dateKey(6 - i)] ?? 0) > 0,
    isToday: i === 6,
  }));

  return (
    <View style={styles.row}>
      {days.map(({ active, isToday }, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            { width: dotSize, height: dotSize, borderRadius: dotSize / 2 },
            active ? styles.dotActive : styles.dotInactive,
            isToday && active && styles.dotToday,
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotActive:   { backgroundColor: 'rgba(255,255,255,0.85)' },
  dotInactive: { backgroundColor: 'rgba(255,255,255,0.18)' },
  dotToday:    { backgroundColor: '#FFFFFF' },
});
