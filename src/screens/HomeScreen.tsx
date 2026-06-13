import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, StyleProp, TextStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import PillButton from '../components/PillButton';
import MeritAmount from '../components/MeritAmount';
import ShareCard from '../components/ShareCard';
import RankProgressBar from '../components/RankProgressBar';
import SessionPickerModal from '../components/SessionPickerModal';
import PaywallModal from '../components/PaywallModal';
import StreakPill from '../components/StreakPill';
import TabScreenTransition from '../components/TabScreenTransition';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { loadPersona } from '../storage/persona';
import { loadStats, applyStreakShield } from '../storage/stats';
import { loadInterval, saveInterval } from '../storage/settings';
import { checkShieldRefill, consumeShield, shieldDaysUntilRefill } from '../storage/shield';
import type { ShieldState } from '../storage/shield';
import { checkAppUnlock } from '../services/purchases';
import { getRankProgress } from '../utils/ranks';
import { getGoalCountdown } from '../utils/goal';
import type { RootStackParamList, PersonaData, SessionStats } from '../types';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Good morning.';
  if (hour >= 12 && hour < 17) return 'Good afternoon.';
  if (hour >= 17 && hour < 21) return 'Good evening.';
  return 'Late night grind.';
}

function todayKey(): string {
  return new Date().toISOString().split('T')[0];
}

function yesterdayKey(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

function CountUpText({
  value,
  style,
  formatter = (n) => n.toLocaleString(),
}: {
  value: number;
  style: StyleProp<TextStyle>;
  formatter?: (n: number) => string;
}) {
  const [display, setDisplay] = useState(value);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (value === 0) {
      setDisplay(0);
      return;
    }

    const duration = 650;
    const startTime = Date.now();
    setDisplay(0);

    const tick = () => {
      const progress = Math.min((Date.now() - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(value * eased));
      if (progress < 1) rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value]);

  return <Text style={style}>{formatter(display)}</Text>;
}

function StatPill({ label, sessions, earned, lost }: { label: string; sessions: number; earned: number; lost: number }) {
  return (
    <View style={styles.statPill}>
      <BlurView intensity={24} tint="dark" style={StyleSheet.absoluteFill} />
      <LinearGradient
        colors={['rgba(255,255,255,0.10)', 'rgba(255,255,255,0.03)']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />
      <Text style={styles.statPillLabel}>{label}</Text>
      <View style={styles.statPillSessionRow}>
        {sessions > 0 ? (
          <CountUpText value={sessions} style={styles.statPillSessions} />
        ) : (
          <Text style={styles.statPillSessions}>-</Text>
        )}
        {sessions > 0 ? <Text style={styles.statPillUnit}> {sessions === 1 ? 'session' : 'sessions'}</Text> : null}
      </View>
      {earned > 0 && (
        <CountUpText
          value={earned}
          style={[styles.statPillMerit, { color: '#52C97A' }]}
          formatter={(n) => `+${n} MERIT$`}
        />
      )}
      {lost > 0 && (
        <CountUpText
          value={lost}
          style={[styles.statPillMerit, { color: '#FF6B6B' }]}
          formatter={(n) => `-${n} MERIT$`}
        />
      )}
    </View>
  );
}

export default function HomeScreen() {
  const nav = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [persona, setPersona] = useState<PersonaData | null>(null);
  const [stats, setStats] = useState<SessionStats | null>(null);
  const [showShare, setShowShare] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [interval, setIntervalMinutes] = useState(25);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [shield, setShield] = useState<ShieldState | null>(null);
  const [animateKey, setAnimateKey] = useState(0);
  const meritSweepX = useSharedValue(-220);

  useEffect(() => {
    meritSweepX.value = withRepeat(
      withSequence(
        withTiming(460, { duration: 1850, easing: Easing.bezier(0.22, 0.61, 0.36, 1) }),
        withTiming(-220, { duration: 0 }),
        withDelay(6150, withTiming(-220, { duration: 0 }))
      ),
      -1,
      false
    );
  }, [meritSweepX]);

  const meritSweepStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: meritSweepX.value }, { rotate: '-18deg' }],
  }));

  useFocusEffect(
    useCallback(() => {
      loadPersona().then(setPersona);
      loadInterval().then(setIntervalMinutes);

      Promise.all([checkAppUnlock(), checkShieldRefill(), loadStats()]).then(
        async ([unlocked, shieldState, currentStats]) => {
          setIsUnlocked(unlocked);
          setShield(shieldState);

          // Auto-apply shield if Pro, shield available, and user missed yesterday
          if (unlocked && shieldState.available && currentStats.currentStreak > 0) {
            const today = new Date().toISOString().slice(0, 10);
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().slice(0, 10);
            const missedYesterday =
              currentStats.lastSessionDate !== yesterdayStr &&
              currentStats.lastSessionDate !== today;
            if (missedYesterday) {
              await applyStreakShield();
              await consumeShield();
              const updated = await loadStats();
              setStats(updated);
              setAnimateKey(k => k + 1);
              setShield({ available: false, usedAt: today, refillAt: null });
              return;
            }
          }
          setStats(currentStats);
          setAnimateKey(k => k + 1);
        }
      );
    }, [])
  );

  const total = stats?.totalEarned ?? 0;
  const progress = getRankProgress(total);
  const streakLabel = stats
    ? stats.currentStreak === 1 ? 'Day 1 Streak' : `Day ${stats.currentStreak} Streak`
    : '';

  const dailySessions = stats?.dailySessions ?? {};
  const dailyEarned = stats?.dailyEarned ?? {};
  const dailyLost = stats?.dailyLost ?? {};
  const todaySessions = dailySessions[todayKey()] ?? 0;
  const todayEarned = dailyEarned[todayKey()] ?? 0;
  const todayLost = dailyLost[todayKey()] ?? 0;
  const yesterdaySessions = dailySessions[yesterdayKey()] ?? 0;
  const yesterdayEarned = dailyEarned[yesterdayKey()] ?? 0;
  const yesterdayLost = dailyLost[yesterdayKey()] ?? 0;

  const countdown = persona ? getGoalCountdown(persona) : null;

  return (
    <SafeAreaView style={styles.safe}>
      <TabScreenTransition style={styles.screenMotion}>
        <View style={styles.topBar}>
          <Text style={styles.wordmark}>method.</Text>
          {!isUnlocked && (
            <TouchableOpacity style={styles.upgradeChip} onPress={() => setShowPaywall(true)} activeOpacity={0.8}>
              <Text style={styles.upgradeChipText}>Upgrade</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.center}>
          <Animated.Text entering={FadeInDown.duration(500)} style={styles.greeting}>
            {getGreeting()}
          </Animated.Text>
          <Animated.View entering={FadeInDown.delay(80).duration(500)} style={styles.identityRow}>
            {persona && <Text style={styles.personaLabel}>{persona.name.toUpperCase()}</Text>}
            {persona && <View style={styles.identityDot} />}
            <Text style={styles.rankLabel}>{progress.current.title.toUpperCase()}</Text>
          </Animated.View>

          {/* Glass merit card */}
          <Animated.View entering={FadeInDown.delay(160).duration(550)} style={styles.meritGlass}>
            <BlurView intensity={32} tint="dark" style={StyleSheet.absoluteFill} />
            <LinearGradient
              colors={['rgba(255,255,255,0.14)', 'rgba(255,255,255,0.04)']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
            />
            <View style={styles.meritShine} />
            <Animated.View pointerEvents="none" style={[styles.meritSweep, meritSweepStyle]}>
              <LinearGradient
                colors={[
                  'transparent',
                  'rgba(255,255,255,0.04)',
                  'rgba(255,255,255,0.12)',
                  'rgba(255,255,255,0.04)',
                  'transparent',
                ]}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
              />
            </Animated.View>
            <MeritAmount
              amount={total}
              animateKey={animateKey}
              symbolSize={72}
              textStyle={styles.counter}
              color={Colors.pureWhite}
            />
            <View style={styles.cardDivider} />

            <RankProgressBar
              percent={progress.percent}
              animateKey={animateKey}
              leftLabel={progress.isMax ? 'Max rank reached' : `${progress.current.title}`}
              rightLabel={progress.isMax ? 'THE LEGACY' : `${progress.meritToNext} MERIT$ TO RANK`}
            />
          </Animated.View>

          {/* Goal countdown */}
          {countdown && (
            <Animated.Text entering={FadeInDown.delay(240).duration(500)} style={styles.countdown}>
              <Text style={styles.countdownNum}>{countdown.daysRemaining}</Text>
              {countdown.daysRemaining === 1 ? ' day' : ' days'} to your goal
            </Animated.Text>
          )}

          {/* Streak pill */}
          <Animated.View entering={FadeInDown.delay(260).duration(500)} style={styles.streakRow}>
            <StreakPill
              streak={stats?.currentStreak ?? 0}
              dailySessions={dailySessions}
              shieldAvailable={isUnlocked ? (shield?.available ?? false) : undefined}
              shieldDaysLeft={isUnlocked && shield ? shieldDaysUntilRefill(shield) : undefined}
              animateKey={animateKey}
            />
          </Animated.View>

          {/* Today + Yesterday stat pills */}
          <Animated.View entering={FadeInDown.delay(320).duration(500)} style={styles.statRow}>
            <StatPill label="Today" sessions={todaySessions} earned={todayEarned} lost={todayLost} />
            <StatPill label="Yesterday" sessions={yesterdaySessions} earned={yesterdayEarned} lost={yesterdayLost} />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(400).duration(500)}>
            <PillButton
              label="Start Session"
              onPress={() => setShowPicker(true)}
              style={styles.startBtn}
            />
          </Animated.View>

          {/* Share progress */}
          <Animated.View entering={FadeInDown.delay(460).duration(500)}>
            <TouchableOpacity style={styles.shareRow} onPress={() => setShowShare(true)}>
              <Ionicons name="share-outline" size={13} color="rgba(255,255,255,0.35)" />
              <Text style={styles.shareLabel}>Share progress</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </TabScreenTransition>

      {stats && (
        <ShareCard
          visible={showShare}
          onClose={() => setShowShare(false)}
          stats={stats}
          persona={persona}
        />
      )}

      <SessionPickerModal
        visible={showPicker}
        initialInterval={interval}
        isUnlocked={isUnlocked}
        onClose={() => setShowPicker(false)}
        onShowPaywall={() => { setShowPicker(false); setShowPaywall(true); }}
        onConfirm={async (minutes) => {
          setShowPicker(false);
          await saveInterval(minutes);
          setIntervalMinutes(minutes);
          nav.navigate('FocusSession');
        }}
      />

      <PaywallModal
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
        onUnlocked={() => setIsUnlocked(true)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.background },
  screenMotion: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 28,
    paddingTop: 12,
    paddingBottom: 4,
  },
  wordmark: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.pureWhite,
    letterSpacing: -0.8,
  },
  upgradeChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 100,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  upgradeChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.70)',
    letterSpacing: 0.2,
  },
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
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
  },
  personaLabel: {
    ...Typography.personaLabel,
    color: Colors.pureWhite,
  },
  identityDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.dim,
  },
  rankLabel: {
    ...Typography.personaLabel,
    color: 'rgba(255,255,255,0.55)',
  },
  meritGlass: {
    borderRadius: 32,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 32,
    paddingTop: 24,
    paddingBottom: 22,
    alignItems: 'center',
    marginBottom: 14,
    width: '100%',
  },
  meritShine: {
    position: 'absolute',
    top: 0,
    left: 24,
    right: 24,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  meritSweep: {
    position: 'absolute',
    top: -44,
    bottom: -44,
    left: -170,
    width: 160,
    opacity: 0.62,
  },
  counter: { ...Typography.heroNumber },
  cardDivider: {
    height: 1,
    alignSelf: 'stretch',
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginVertical: 16,
  },
  countdown: {
    fontSize: 12,
    fontWeight: '300',
    color: 'rgba(255,255,255,0.40)',
    marginBottom: 18,
    letterSpacing: 0.3,
  },
  countdownNum: {
    fontWeight: '600',
    color: 'rgba(255,255,255,0.70)',
  },
  streakRow: {
    alignSelf: 'stretch',
    marginBottom: 10,
  },
  statRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
    alignSelf: 'stretch',
  },
  statPill: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  statPillLabel: {
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.30)',
    marginBottom: 6,
  },
  statPillSessions: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.pureWhite,
    letterSpacing: -0.5,
  },
  statPillSessionRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  statPillUnit: {
    fontSize: 12,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.50)',
  },
  statPillMerit: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.65)',
    marginTop: 4,
  },
  startBtn: { marginBottom: 16 },
  shareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 4,
  },
  shareLabel: {
    fontSize: 12,
    fontWeight: '400',
    letterSpacing: 0.3,
    color: 'rgba(255,255,255,0.35)',
  },
});
