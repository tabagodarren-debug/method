import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import PillButton from '../components/PillButton';
import MeritAmount from '../components/MeritAmount';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { loadPersona } from '../storage/persona';
import { loadStats } from '../storage/stats';
import type { RootStackParamList, PersonaData, SessionStats } from '../types';

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
        {persona && (
          <Text style={styles.personaLabel}>{persona.name.toUpperCase()}</Text>
        )}
        <MeritAmount
          amount={stats?.totalEarned ?? 0}
          symbolSize={52}
          textStyle={styles.counter}
          color={Colors.primaryText}
          style={styles.counterRow}
        />
        {stats && stats.currentStreak > 0 && (
          <Text style={styles.streak}>{streakLabel}</Text>
        )}
        <PillButton
          label="Start"
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
  personaLabel: {
    ...Typography.personaLabel,
    color: Colors.pureWhite,
    marginBottom: 28,
  },
  counterRow: {
    marginBottom: 10,
  },
  counter: {
    ...Typography.heroNumber,
  },
  streak: {
    ...Typography.metaLabel,
    color: Colors.dim,
    marginBottom: 32,
  },
  startBtn: { marginTop: 4 },
});
