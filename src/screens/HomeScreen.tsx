import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import PillButton from '../components/PillButton';
import MeritAmount from '../components/MeritAmount';
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

export default function HomeScreen() {
  const nav = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [persona, setPersona] = useState<PersonaData | null>(null);
  const [stats, setStats] = useState<SessionStats | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadPersona().then(setPersona);
      loadStats().then(setStats);
    }, [])
  );

  const streakLabel = stats
    ? stats.currentStreak === 1
      ? 'Day 1 Streak'
      : `Day ${stats.currentStreak} Streak`
    : '';

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
            symbolSize={82}
            textStyle={styles.counter}
            color={Colors.pureWhite}
          />
          {stats && stats.currentStreak > 0 && (
            <Text style={styles.streak}>{streakLabel}</Text>
          )}
        </View>

        <PillButton
          label="Lock in"
          onPress={() => nav.navigate('FocusSession')}
          style={styles.startBtn}
        />
      </View>
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
    marginBottom: 32,
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
    marginTop: 8,
  },
  startBtn: { marginTop: 4 },
});
