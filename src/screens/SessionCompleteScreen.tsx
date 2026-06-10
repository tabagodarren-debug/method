import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { StackNavigationProp, RouteProp } from '@react-navigation/stack';
import PillButton from '../components/PillButton';
import MeritAmount from '../components/MeritAmount';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { loadPersona } from '../storage/persona';
import { recordSession, loadStats } from '../storage/stats';
import type { RootStackParamList } from '../types';

type Route = RouteProp<RootStackParamList, 'SessionComplete'>;

export default function SessionCompleteScreen() {
  const nav = useNavigation<StackNavigationProp<RootStackParamList>>();
  const route = useRoute<Route>();
  const { earnedThisSession, intervalMinutes } = route.params;

  const [personaName, setPersonaName] = useState('');
  const [totalEarned, setTotalEarned] = useState(0);

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    Promise.all([loadPersona(), recordSession(today, earnedThisSession, intervalMinutes)]).then(([persona, stats]) => {
      setPersonaName(persona?.name ?? '');
      setTotalEarned(stats.totalEarned);
    });
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.center}>
        <MeritAmount
          amount={earnedThisSession}
          prefix="+"
          symbolSize={50}
          textStyle={styles.earnAmount}
          color={Colors.pureWhite}
          style={styles.earnRow}
        />
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total: </Text>
          <MeritAmount
            amount={totalEarned}
            symbolSize={18}
            textStyle={styles.totalAmount}
            color={Colors.primaryText}
            style={{ gap: 4 }}
          />
        </View>
        {personaName ? (
          <Text style={styles.affirmation}>{personaName} just got closer.</Text>
        ) : null}
        <View style={styles.buttons}>
          <PillButton
            label="Take Break"
            variant="secondary"
            onPress={() => nav.replace('Break')}
            width="100%"
            height={54}
          />
          <PillButton
            label="Keep Going"
            variant="primary"
            onPress={() => nav.replace('FocusSession')}
            width="100%"
            height={54}
          />
        </View>
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
  },
  earnRow:    { marginBottom: 14 },
  earnAmount: { ...Typography.earnAmount },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  totalLabel:  { ...Typography.secondaryFigure, color: Colors.primaryText },
  totalAmount: { ...Typography.secondaryFigure },
  affirmation: {
    ...Typography.smallAffirmation,
    color: Colors.dim,
    marginBottom: 52,
  },
  buttons: {
    width: '100%',
    gap: 14,
  },
});
