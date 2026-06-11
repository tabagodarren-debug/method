import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { StackNavigationProp, RouteProp } from '@react-navigation/stack';
import PillButton from '../components/PillButton';
import MeritAmount from '../components/MeritAmount';
import RankProgressBar from '../components/RankProgressBar';
import RankUpCard from '../components/RankUpCard';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { loadPersona } from '../storage/persona';
import { recordSession, loadStats } from '../storage/stats';
import { getRankProgress, didRankUp } from '../utils/ranks';
import { getRankAffirmation } from '../utils/affirmations';
import type { RootStackParamList, PersonaData } from '../types';
import type { Rank as RankType } from '../utils/ranks';

type Route = RouteProp<RootStackParamList, 'SessionComplete'>;

export default function SessionCompleteScreen() {
  const nav = useNavigation<StackNavigationProp<RootStackParamList>>();
  const route = useRoute<Route>();
  const { earnedThisSession, intervalMinutes } = route.params;

  const [persona, setPersona] = useState<PersonaData | null>(null);
  const [totalEarned, setTotalEarned] = useState(0);
  const [affirmation, setAffirmation] = useState('');
  const [rankedUp, setRankedUp] = useState<RankType | null>(null);
  const [showCeremony, setShowCeremony] = useState(false);

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    Promise.all([loadPersona(), recordSession(today, earnedThisSession, intervalMinutes)]).then(
      ([p, stats]) => {
        setPersona(p);
        setTotalEarned(stats.totalEarned);

        const prevTotal = stats.totalEarned - earnedThisSession;
        const newRank = didRankUp(prevTotal, stats.totalEarned);
        const currentLevel = getRankProgress(stats.totalEarned).current.level;

        if (p) setAffirmation(getRankAffirmation(p, currentLevel));

        if (newRank) {
          setRankedUp(newRank);
          setTimeout(() => setShowCeremony(true), 900);
        }
      }
    );
  }, []);

  const progress = getRankProgress(totalEarned);

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

        {affirmation ? <Text style={styles.affirmation}>{affirmation}</Text> : null}

        {/* Progress toward next rank */}
        <View style={styles.progressWrap}>
          <RankProgressBar
            percent={progress.percent}
            leftLabel={progress.current.title}
            rightLabel={
              progress.isMax ? 'MAX RANK' : `${progress.meritToNext} to ${progress.next!.title}`
            }
          />
        </View>

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

      <RankUpCard
        visible={showCeremony}
        rank={rankedUp}
        onShare={() => {
          setShowCeremony(false);
          nav.replace('Break');
        }}
        onContinue={() => setShowCeremony(false)}
      />
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
    marginBottom: 36,
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  progressWrap: {
    width: '100%',
    marginBottom: 44,
  },
  buttons: {
    width: '100%',
    gap: 14,
  },
});
