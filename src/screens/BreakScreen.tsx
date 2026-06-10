import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import type { RootStackParamList } from '../types';

const BREAK_SECONDS = 5 * 60;
const { width: SW, height: SH } = Dimensions.get('screen');
const TIMER_W = 320;
const TIMER_H = 110;

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

  const timeStr = formatTime(timeLeft);

  return (
    <View style={styles.container}>

      {/* Affirmation */}
      <View style={styles.center}>
        <Text style={styles.affirmation}>{affirmation}</Text>
      </View>

      {/* Glass-texture timer centered over affirmation */}
      <View style={styles.timerArea} pointerEvents="none">
        <MaskedView
          style={{ width: TIMER_W, height: TIMER_H }}
          maskElement={
            <View style={styles.maskContainer}>
              <Text style={styles.maskDigits}>{timeStr}</Text>
            </View>
          }
        >
          <BlurView intensity={18} tint="light" style={{ width: TIMER_W, height: TIMER_H }} />
          <LinearGradient
            colors={['rgba(255,255,255,0.18)', 'rgba(255,255,255,0.06)']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
          />
        </MaskedView>
        {/* Edge glow */}
        <Text style={styles.digitGlow}>{timeStr}</Text>
      </View>

      {/* Glass pill skip button */}
      <TouchableOpacity style={styles.skipBtn} onPress={skip}>
        <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
        <LinearGradient
          colors={['rgba(255,255,255,0.12)', 'rgba(255,255,255,0.04)']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
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
  timerArea: {
    position: 'absolute',
    width: TIMER_W,
    height: TIMER_H,
    left: SW / 2 - TIMER_W / 2,
    top: SH / 2 - TIMER_H / 2 - 110,
    alignItems: 'center',
    justifyContent: 'center',
  },
  maskContainer: {
    flex: 1,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  maskDigits: {
    fontSize: 72,
    fontWeight: '800',
    color: 'black',
    letterSpacing: 5,
  },
  digitGlow: {
    position: 'absolute',
    fontSize: 72,
    fontWeight: '800',
    letterSpacing: 5,
    color: 'transparent',
    textShadowColor: 'rgba(255,255,255,0.55)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  skipBtn: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 100,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  skipLabel: {
    fontSize: 11.5,
    fontWeight: '500',
    letterSpacing: 0.7,
    color: 'rgba(255,255,255,0.72)',
  },
});
