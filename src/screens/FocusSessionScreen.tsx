import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated,
  ImageSourcePropType, Dimensions, StatusBar, Alert,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import MaskedView from '@react-native-masked-view/masked-view';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { loadInterval, loadDevMode } from '../storage/settings';
import { recordAbandon, ABANDON_PENALTY } from '../storage/stats';
import { calculateMerit } from '../utils/merit';
import { startLiveActivity, updateLiveActivity, endLiveActivity } from '../modules/LiveActivity';
import { loadPersona } from '../storage/persona';
import { loadStats } from '../storage/stats';
import { getRankProgress } from '../utils/ranks';
import { playTrack, pauseAudio, resumeAudio, skipTrack, stopAudio, getCurrentTrackName, hasTracks } from '../services/audio';
import { SoundHaptics } from '../utils/soundHaptics';
import type { RootStackParamList } from '../types';

const DEV_SECONDS = 10;
const SLIDE_DURATION_MS = 20000;
const FADE_DURATION_MS = 900;

const { width: SW, height: SH } = Dimensions.get('screen');
const TIMER_W = 320;
const TIMER_H = 112;

const SLIDES: ImageSourcePropType[] = [
  require('../../assets/slideshow/1.png'),
  require('../../assets/slideshow/2.png'),
  require('../../assets/slideshow/3.png'),
  require('../../assets/slideshow/4.png'),
  require('../../assets/slideshow/6.png'),
  require('../../assets/slideshow/7.png'),
  require('../../assets/slideshow/8.png'),
  require('../../assets/slideshow/9.png'),
  require('../../assets/slideshow/10.png'),
  require('../../assets/slideshow/12.png'),
  require('../../assets/slideshow/14.png'),
  require('../../assets/slideshow/15.png'),
  require('../../assets/slideshow/16.png'),
  require('../../assets/slideshow/18.png'),
  require('../../assets/slideshow/20.png'),
  require('../../assets/slideshow/21.png'),
  require('../../assets/slideshow/22.png'),
  require('../../assets/slideshow/23.png'),
  require('../../assets/slideshow/24.png'),
  require('../../assets/slideshow/25.png'),
];

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function FocusSessionScreen() {
  const nav = useNavigation<StackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [intervalMinutes, setIntervalMinutes] = useState(25);
  const [devMode, setDevMode] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [trackName, setTrackName] = useState('No music');
  const [slideIndex, setSlideIndex] = useState(() => Math.floor(Math.random() * SLIDES.length));

  const slideOpacity = useRef(new Animated.Value(1)).current;
  const digitScale = useRef(new Animated.Value(1)).current;
  const endTimeRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const slideRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastTickRef = useRef<number | null>(null);

  const advanceSlide = useCallback(() => {
    Animated.timing(slideOpacity, {
      toValue: 0,
      duration: FADE_DURATION_MS,
      useNativeDriver: true,
    }).start(() => {
      setSlideIndex(prev => (prev + 1) % SLIDES.length);
      Animated.timing(slideOpacity, {
        toValue: 1,
        duration: FADE_DURATION_MS,
        useNativeDriver: true,
      }).start();
    });
  }, [slideOpacity]);

  useFocusEffect(
    useCallback(() => {
      loadInterval().then((loaded) => {
        setIntervalMinutes(loaded);
        loadDevMode().then(setDevMode);
        Promise.all([loadPersona(), loadStats()]).then(([persona, stats]) => {
          const rank = getRankProgress(stats.totalEarned).current;
          startLiveActivity({
            personaName:     persona?.name ?? '',
            rankTitle:       rank.title,
            intervalMinutes: loaded,
            projectedMerit:  calculateMerit(loaded),
          });
        });
      });
      if (hasTracks()) {
        playTrack().then(() => {
          setIsPlaying(true);
          setTrackName(getCurrentTrackName());
        });
      }
      startTimer();
      if (SLIDES.length > 1) {
        slideRef.current = setInterval(advanceSlide, SLIDE_DURATION_MS);
      }
      return () => {
        clearInterval(timerRef.current!);
        clearInterval(slideRef.current!);
        stopAudio();
      };
    }, [advanceSlide])
  );

  const startTimer = () => {
    const seconds = devMode ? DEV_SECONDS : (intervalMinutes * 60);
    setTimeLeft(seconds);
    endTimeRef.current = Date.now() + seconds * 1000;
    timerRef.current = setInterval(() => {
      const remaining = Math.ceil(((endTimeRef.current ?? 0) - Date.now()) / 1000);
      if (remaining <= 0) {
        clearInterval(timerRef.current!);
        stopAudio();
        SoundHaptics.save();
        const earned = calculateMerit(intervalMinutes);
        endLiveActivity(earned);
        nav.replace('SessionComplete', {
          earnedThisSession: earned,
          intervalMinutes,
        });
      } else {
        setTimeLeft(remaining);
        updateLiveActivity(remaining);
        if (remaining <= 5 && remaining !== lastTickRef.current) {
          lastTickRef.current = remaining;
          SoundHaptics.tap();
        }
      }
    }, 500);
  };

  const togglePlay = async () => {
    if (isPlaying) { await pauseAudio(); setIsPlaying(false); }
    else { await resumeAudio(); setIsPlaying(true); }
  };

  const handleSkip = async () => {
    await skipTrack();
    setTrackName(getCurrentTrackName());
  };

  const handleEndSession = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      'Clock out early?',
      `Walk away now and you forfeit this session — no Merit earned, and ${ABANDON_PENALTY} docked from your balance. Your future self is watching.`,
      [
        { text: 'Stay locked in', style: 'cancel' },
        {
          text: `Clock out (−${ABANDON_PENALTY})`,
          style: 'destructive',
          onPress: async () => {
            clearInterval(timerRef.current!);
            clearInterval(slideRef.current!);
            await stopAudio();
            await recordAbandon();
            await endLiveActivity(0);
            nav.goBack();
          },
        },
      ],
    );
  };

  const timeStr = formatTime(timeLeft);
  const timerTop = Math.max(insets.top + 54, SH * 0.095);

  useEffect(() => {
    digitScale.stopAnimation();
    digitScale.setValue(1);
    const pulse = Animated.sequence([
      Animated.timing(digitScale, {
        toValue: 1.02,
        duration: 110,
        useNativeDriver: true,
      }),
      Animated.timing(digitScale, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
    ]);
    pulse.start();
    return () => pulse.stop();
  }, [digitScale, timeLeft]);

  return (
    <View style={styles.root}>
      <StatusBar hidden />

      {/* Full-screen slideshow */}
      {SLIDES.length > 0 && (
        <Animated.Image
          source={SLIDES[slideIndex]}
          style={{ position: 'absolute', width: SW, height: SH, opacity: slideOpacity }}
          resizeMode="cover"
        />
      )}
      <View style={styles.scrim} />

      {/* Liquid glass timer — frosted background cut through digit shapes */}
      <View style={[styles.timerArea, { top: timerTop }]} pointerEvents="none">
        <Animated.View style={[styles.timerPulse, { transform: [{ scale: digitScale }] }]}>
          <MaskedView
            style={{ width: TIMER_W, height: TIMER_H }}
            maskElement={
              <View style={styles.maskContainer}>
                <Text style={styles.maskDigits}>{timeStr}</Text>
              </View>
            }
          >
            {/* High-intensity blur visible through digit cutouts */}
            <BlurView intensity={70} tint="light" style={{ width: TIMER_W, height: TIMER_H }} />
            {/* White fill makes glass look luminous */}
            <View style={styles.digitGlassBase} />
            {/* Subtle top-to-bottom gradient for depth */}
            <LinearGradient
              colors={[
                'rgba(255,255,255,0.34)',
                'rgba(255,255,255,0.10)',
                'rgba(70,110,210,0.10)',
                'rgba(255,255,255,0.04)',
              ]}
              style={StyleSheet.absoluteFill}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
            />
            <LinearGradient
              colors={['transparent', 'rgba(255,255,255,0.22)', 'transparent']}
              style={styles.digitDiagonalShine}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
            />
          </MaskedView>
          {/* Rim light — tight bright edge around each digit */}
          <Text style={styles.digitInnerShadow}>{timeStr}</Text>
          <Text style={styles.digitGlow}>{timeStr}</Text>
          <Text style={styles.digitEdge}>{timeStr}</Text>
        </Animated.View>
      </View>

      {/* Always-visible controls */}
      <View style={[styles.controls, { bottom: insets.bottom + 32 }]}>
          <View style={styles.musicBarWrap}>
            <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
            <LinearGradient
              colors={['rgba(255,255,255,0.14)', 'rgba(255,255,255,0.04)']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
            />
            <TouchableOpacity onPress={() => {}} style={styles.musicIcon}>
              <Ionicons name="play-skip-back" size={18} color={Colors.dim} />
            </TouchableOpacity>
            <TouchableOpacity onPress={togglePlay} style={styles.musicIcon}>
              <Ionicons name={isPlaying ? 'pause' : 'play'} size={20} color={Colors.pureWhite} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSkip} style={styles.musicIcon}>
              <Ionicons name="play-skip-forward" size={18} color={Colors.dim} />
            </TouchableOpacity>
            <View style={styles.trackInfo}>
              <Text style={styles.trackName} numberOfLines={1}>{trackName}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.endBtn} onPress={handleEndSession}>
            <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
            <LinearGradient
              colors={['rgba(255,255,255,0.12)', 'rgba(255,255,255,0.04)']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
            />
            <Text style={styles.endBtnLabel}>End session</Text>
          </TouchableOpacity>
        </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root:  { flex: 1, width: SW, height: SH, backgroundColor: Colors.background },
  scrim: { position: 'absolute', width: SW, height: SH, backgroundColor: 'rgba(0,0,0,0.28)' },

  timerArea: {
    position: 'absolute',
    width: TIMER_W,
    height: TIMER_H,
    left: SW / 2 - TIMER_W / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerPulse: {
    width: TIMER_W,
    height: TIMER_H,
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
    fontSize: 76,
    fontWeight: '800',
    color: 'black',
    letterSpacing: 1,
  },
  digitGlassBase: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.055)',
  },
  digitDiagonalShine: {
    position: 'absolute',
    top: -20,
    bottom: -20,
    left: -80,
    width: 190,
    transform: [{ rotate: '-18deg' }],
  },
  digitInnerShadow: {
    position: 'absolute',
    fontSize: 76,
    fontWeight: '800',
    letterSpacing: 1,
    color: 'rgba(20,28,42,0.10)',
    textShadowColor: 'rgba(0,0,0,0.20)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },
  digitEdge: {
    position: 'absolute',
    fontSize: 76,
    fontWeight: '800',
    letterSpacing: 1,
    color: 'rgba(255,255,255,0.24)',
    textShadowColor: 'rgba(255,255,255,0.34)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 2,
  },
  digitGlow: {
    position: 'absolute',
    fontSize: 76,
    fontWeight: '800',
    letterSpacing: 1,
    color: 'transparent',
    textShadowColor: 'rgba(255,255,255,0.16)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 18,
  },

  controls:    { position: 'absolute', left: 20, right: 20, gap: 8 },
  musicBarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 54,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: 14,
    gap: 10,
  },
  musicIcon:   { width: 32, alignItems: 'center', justifyContent: 'center' },
  trackInfo:   { flex: 1 },
  trackName:   { ...Typography.musicTrackName, color: Colors.primaryText },
  endBtn: {
    alignSelf: 'center',
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 100,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  endBtnLabel: { ...Typography.metaLabel, color: 'rgba(255,255,255,0.72)' },
});
