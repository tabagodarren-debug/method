import React, { useRef, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated,
  ImageSourcePropType, Dimensions, StatusBar,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { loadInterval } from '../storage/settings';
import { playTrack, pauseAudio, resumeAudio, skipTrack, stopAudio, getCurrentTrackName, hasTracks } from '../services/audio';
import type { RootStackParamList } from '../types';

// TODO: remove DEV_SECONDS_OVERRIDE before shipping — set to null to use real interval
const DEV_SECONDS_OVERRIDE: number | null = 10;
const EARN_PER_SESSION = 25;
const SLIDE_DURATION_MS = 20000;
const FADE_DURATION_MS = 900;

const { width: SW, height: SH } = Dimensions.get('screen');

const SLIDES: ImageSourcePropType[] = [
  require('../../assets/slideshow/1.png'),
  require('../../assets/slideshow/2.png'),
  require('../../assets/slideshow/3.png'),
  require('../../assets/slideshow/4.png'),
  require('../../assets/slideshow/5.png'),
  require('../../assets/slideshow/6.png'),
  require('../../assets/slideshow/7.png'),
  require('../../assets/slideshow/8.png'),
  require('../../assets/slideshow/9.png'),
  require('../../assets/slideshow/10.png'),
  require('../../assets/slideshow/11.png'),
  require('../../assets/slideshow/12.png'),
  require('../../assets/slideshow/13.png'),
  require('../../assets/slideshow/14.png'),
  require('../../assets/slideshow/15.png'),
  require('../../assets/slideshow/16.png'),
  require('../../assets/slideshow/17.png'),
  require('../../assets/slideshow/18.png'),
  require('../../assets/slideshow/19.png'),
  require('../../assets/slideshow/20.png'),
];

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function FocusSessionScreen() {
  const nav = useNavigation<StackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const [timeLeft, setTimeLeft] = useState(DEV_SECONDS_OVERRIDE ?? 25 * 60);
  const [intervalMinutes, setIntervalMinutes] = useState(25);
  const [isPlaying, setIsPlaying] = useState(false);
  const [trackName, setTrackName] = useState('No music');
  const [slideIndex, setSlideIndex] = useState(() => Math.floor(Math.random() * SLIDES.length));
  const [controlsVisible, setControlsVisible] = useState(false);

  const slideOpacity = useRef(new Animated.Value(1)).current;
  const endTimeRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const slideRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
      loadInterval().then(setIntervalMinutes);
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
    const seconds = DEV_SECONDS_OVERRIDE ?? (intervalMinutes * 60);
    setTimeLeft(seconds);
    endTimeRef.current = Date.now() + seconds * 1000;
    timerRef.current = setInterval(() => {
      const remaining = Math.ceil(((endTimeRef.current ?? 0) - Date.now()) / 1000);
      if (remaining <= 0) {
        clearInterval(timerRef.current!);
        stopAudio();
        nav.replace('SessionComplete', { earnedThisSession: EARN_PER_SESSION });
      } else {
        setTimeLeft(remaining);
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

      {/* Tap anywhere to toggle controls */}
      <TouchableOpacity
        style={StyleSheet.absoluteFill}
        onPress={() => setControlsVisible(v => !v)}
        activeOpacity={1}
      />

      {/* Liquid glass timer — centered */}
      <View style={styles.timerWrap} pointerEvents="none">
        <BlurView intensity={72} tint="dark" style={StyleSheet.absoluteFill} />
        {/* Top-to-bottom glass gradient */}
        <LinearGradient
          colors={['rgba(255,255,255,0.18)', 'rgba(255,255,255,0.04)']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
        {/* Top shine line */}
        <View style={styles.timerShine} />
        <Text style={styles.timerDigits}>{formatTime(timeLeft)}</Text>
      </View>

      {/* Controls — revealed on tap */}
      {controlsVisible && (
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

          <TouchableOpacity style={styles.endBtn} onPress={() => nav.goBack()}>
            <Text style={styles.endBtnLabel}>End session</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root:  { flex: 1, width: SW, height: SH, backgroundColor: Colors.background },
  scrim: { position: 'absolute', width: SW, height: SH, backgroundColor: 'rgba(0,0,0,0.30)' },

  timerWrap: {
    position: 'absolute',
    width: 264,
    height: 108,
    borderRadius: 36,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.26)',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    left: SW / 2 - 132,
    top: SH / 2 - 54,
  },
  timerShine: {
    position: 'absolute',
    top: 0,
    left: 24,
    right: 24,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.60)',
  },
  timerDigits: {
    fontSize: 58,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.95)',
    letterSpacing: 4,
    textShadowColor: 'rgba(255,255,255,0.25)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 16,
  },

  controls: { position: 'absolute', left: 20, right: 20, gap: 8 },
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
  endBtn:      { alignSelf: 'center', padding: 12 },
  endBtnLabel: { ...Typography.metaLabel, color: 'rgba(255,255,255,0.30)' },
});
