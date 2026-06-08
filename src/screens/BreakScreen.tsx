import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import type { RootStackParamList } from '../types';

const BREAK_SECONDS = 5 * 60;

const BREAK_TEMPLATES = [
  "The goal doesn't care how you feel.",
  "Rest is part of the method.",
  "The version of you that made it took breaks too.",
  "Reset. Come back locked in.",
  "You're further along than you think.",
];

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function BreakScreen() {
  const nav = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [timeLeft, setTimeLeft] = useState(BREAK_SECONDS);
  const [affirmation] = useState(
    () => BREAK_TEMPLATES[Math.floor(Math.random() * BREAK_TEMPLATES.length)]
  );
  const endTimeRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    endTimeRef.current = Date.now() + BREAK_SECONDS * 1000;
    intervalRef.current = setInterval(() => {
      const remaining = Math.ceil(((endTimeRef.current ?? 0) - Date.now()) / 1000);
      if (remaining <= 0) {
        clearInterval(intervalRef.current!);
        nav.replace('FocusSession');
      } else {
        setTimeLeft(remaining);
      }
    }, 500);

    return () => clearInterval(intervalRef.current!);
  }, []);

  const skip = () => {
    clearInterval(intervalRef.current!);
    nav.replace('FocusSession');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.countdown}>{formatTime(timeLeft)}</Text>
      <View style={styles.center}>
        <Text style={styles.affirmation}>{affirmation}</Text>
      </View>
      <TouchableOpacity style={styles.skipBtn} onPress={skip}>
        <Text style={styles.skipLabel}>Skip break</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  countdown: {
    position: 'absolute',
    top: 90,
    right: 28,
    ...Typography.metaLabel,
    fontSize: 13,
    color: Colors.ghost,
    fontVariant: ['tabular-nums'],
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: '15%',
  },
  affirmation: {
    ...Typography.breakAffirmation,
    color: Colors.primaryText,
    textAlign: 'center',
  },
  skipBtn: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    padding: 12,
  },
  skipLabel: {
    fontSize: 11.5,
    fontWeight: '400',
    letterSpacing: 0.7,
    color: Colors.ghost,
  },
});
