import React, { useEffect, useState, useMemo } from 'react';
import * as Haptics from 'expo-haptics';
import { View, Text, StyleSheet, SafeAreaView, Dimensions, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import Animated, {
  FadeInDown, FadeIn,
  useSharedValue, useAnimatedStyle,
  withTiming, withDelay, withSequence, Easing,
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import PillButton from '../components/PillButton';
import MeritAmount from '../components/MeritAmount';
import RankProgressBar from '../components/RankProgressBar';
import RankUpCard from '../components/RankUpCard';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { loadPersona } from '../storage/persona';
import { recordSession } from '../storage/stats';
import { getRankProgress, didRankUp } from '../utils/ranks';
import { getRankAffirmation } from '../utils/affirmations';
import type { RootStackParamList, PersonaData } from '../types';
import type { Rank as RankType } from '../utils/ranks';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

type Route = RouteProp<RootStackParamList, 'SessionComplete'>;

function MoneyParticle({ x, delay, rotation }: { x: number; delay: number; rotation: number }) {
  const ty = useSharedValue(-60);
  const opacity = useSharedValue(0);

  useEffect(() => {
    ty.value = withDelay(delay, withTiming(SCREEN_H + 60, { duration: 1400, easing: Easing.in(Easing.quad) }));
    opacity.value = withDelay(
      delay,
      withSequence(
        withTiming(0.85, { duration: 80 }),
        withTiming(0.85, { duration: 1100 }),
        withTiming(0, { duration: 220 })
      )
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    position: 'absolute',
    left: x,
    top: 0,
    transform: [{ translateY: ty.value }, { rotate: `${rotation}deg` }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={style}>
      <MaterialCommunityIcons name="cash" size={30} color="rgba(255,255,255,0.9)" />
    </Animated.View>
  );
}

export default function SessionCompleteScreen() {
  const nav = useNavigation<StackNavigationProp<RootStackParamList>>();
  const route = useRoute<Route>();
  const { earnedThisSession, intervalMinutes } = route.params;

  const [persona, setPersona] = useState<PersonaData | null>(null);
  const [totalEarned, setTotalEarned] = useState(0);
  const [affirmation, setAffirmation] = useState('');
  const [rankedUp, setRankedUp] = useState<RankType | null>(null);
  const [showCeremony, setShowCeremony] = useState(false);
  const [sessionStats, setSessionStats] = useState<import('../types').SessionStats | null>(null);

  const particles = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        id: i,
        x: Math.random() * (SCREEN_W - 40),
        delay: i * 90,
        rotation: Math.random() * 60 - 30,
      })),
    []
  );

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    Promise.all([loadPersona(), recordSession(today, earnedThisSession, intervalMinutes)]).then(
      ([p, stats]) => {
        setPersona(p);
        setTotalEarned(stats.totalEarned);
        setSessionStats(stats);

        const prevTotal = stats.totalEarned - earnedThisSession;
        const newRank = didRankUp(prevTotal, stats.totalEarned);
        const currentLevel = getRankProgress(stats.totalEarned).current.level;

        if (p) setAffirmation(getRankAffirmation(p, currentLevel));

        if (newRank) {
          setRankedUp(newRank);
          setTimeout(() => {
            setShowCeremony(true);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            setTimeout(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success), 200);
          }, 900);
        }
      }
    );
  }, []);

  const progress = getRankProgress(totalEarned);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {particles.map(p => (
          <MoneyParticle key={p.id} x={p.x} delay={p.delay} rotation={p.rotation} />
        ))}
      </View>

      <View style={styles.center}>
        <Animated.View entering={FadeInDown.duration(550).springify().damping(18)} style={styles.earnRow}>
          <MeritAmount
            amount={earnedThisSession}
            prefix="+"
            symbolSize={70}
            textStyle={styles.earnAmount}
            color={Colors.pureWhite}
          />
        </Animated.View>
        <Animated.View entering={FadeIn.delay(250).duration(500)} style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total: </Text>
          <MeritAmount
            amount={totalEarned}
            symbolSize={22}
            textStyle={styles.totalAmount}
            color={Colors.primaryText}
            style={{ gap: 4 }}
          />
        </Animated.View>

        {affirmation ? (
          <Animated.Text entering={FadeIn.delay(420).duration(550)} style={styles.affirmation}>
            {affirmation}
          </Animated.Text>
        ) : null}

        <Animated.View entering={FadeInDown.delay(560).duration(500)} style={styles.progressWrap}>
          <RankProgressBar
            percent={progress.percent}
            leftLabel={progress.current.title}
            rightLabel={
              progress.isMax ? 'MAX RANK' : `${progress.meritToNext} MERIT$ TO RANK`
            }
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(640).duration(500)} style={styles.buttons}>
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
          <TouchableOpacity onPress={() => nav.navigate('Main')} style={styles.doneLink}>
            <Text style={styles.doneLinkText}>I'm done for today</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>

      <RankUpCard
        visible={showCeremony}
        rank={rankedUp}
        stats={sessionStats}
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
    alignItems: 'center',
  },
  doneLink: {
    paddingVertical: 8,
  },
  doneLinkText: {
    fontSize: 13,
    color: Colors.dim,
    letterSpacing: 0.2,
  },
});
