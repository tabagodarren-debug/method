import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Animated, ImageSourcePropType,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { loadPersona } from '../storage/persona';
import { loadInterval } from '../storage/settings';
import { getRandomAffirmation, getNextAffirmation } from '../utils/affirmations';
import { playTrack, pauseAudio, resumeAudio, skipTrack, stopAudio, getCurrentTrackName, hasTracks } from '../services/audio';
import type { PersonaData, RootStackParamList } from '../types';

// TODO: remove DEV_SECONDS_OVERRIDE before shipping — set to null to use real interval
const DEV_SECONDS_OVERRIDE: number | null = 10;
const AFFIRMATION_INTERVAL = 4 * 60 * 1000;
const EARN_PER_SESSION = 25;
const SLIDE_DURATION_MS = 8000;
const FADE_DURATION_MS = 900;

const SLIDES: ImageSourcePropType[] = [
  require('../../assets/slideshow/slide1.jpg'),
  require('../../assets/slideshow/slide2.jpg'),
  require('../../assets/slideshow/slide3.jpg'),
  require('../../assets/slideshow/slide4.jpg'),
  require('../../assets/slideshow/slide5.jpg'),
  require('../../assets/slideshow/slide6.jpg'),
  require('../../assets/slideshow/slide7.jpg'),
  require('../../assets/slideshow/slide8.jpg'),
  require('../../assets/slideshow/slide9.png'),
];

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function FocusSessionScreen() {
  const nav = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [persona, setPersona] = useState<PersonaData | null>(null);
  const [timeLeft, setTimeLeft] = useState(DEV_SECONDS_OVERRIDE ?? 25 * 60);
  const [affirmation, setAffirmation] = useState('');
  const [intervalMinutes, setIntervalMinutes] = useState(25);
  const [isPlaying, setIsPlaying] = useState(false);
  const [trackName, setTrackName] = useState('No music');
  const [slideIndex, setSlideIndex] = useState(() => Math.floor(Math.random() * SLIDES.length));

  const slideOpacity = useRef(new Animated.Value(1)).current;
  const endTimeRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const affirmationRef = useRef<ReturnType<typeof setInterval> | null>(null);
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
      loadPersona().then(p => {
        setPersona(p);
        if (p) setAffirmation(getRandomAffirmation(p));
      });
      if (hasTracks()) {
        playTrack().then(() => {
          setIsPlaying(true);
          setTrackName(getCurrentTrackName());
        });
      }
      startTimer();
      slideRef.current = setInterval(advanceSlide, SLIDE_DURATION_MS);

      return () => {
        clearInterval(timerRef.current!);
        clearInterval(affirmationRef.current!);
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
        handleSessionComplete();
      } else {
        setTimeLeft(remaining);
      }
    }, 500);
  };

  useEffect(() => {
    if (!persona) return;
    affirmationRef.current = setInterval(() => {
      setAffirmation(prev => getNextAffirmation(prev, persona));
    }, AFFIRMATION_INTERVAL);
    return () => clearInterval(affirmationRef.current!);
  }, [persona]);

  const handleSessionComplete = () => {
    stopAudio();
    nav.replace('SessionComplete', { earnedThisSession: EARN_PER_SESSION });
  };

  const togglePlay = async () => {
    if (isPlaying) {
      await pauseAudio();
      setIsPlaying(false);
    } else {
      await resumeAudio();
      setIsPlaying(true);
    }
  };

  const handleSkip = async () => {
    await skipTrack();
    setTrackName(getCurrentTrackName());
  };

  return (
    <View style={styles.root}>
      {/* Slideshow background */}
      <Animated.Image
        source={SLIDES[slideIndex]}
        style={[StyleSheet.absoluteFill, { opacity: slideOpacity }]}
        resizeMode="cover"
      />
      <View style={styles.scrim} />

      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.timer}>{formatTime(timeLeft)}</Text>
          {affirmation ? (
            <Text style={styles.affirmation}>{affirmation}</Text>
          ) : null}
        </View>

        <View style={styles.musicBarWrap}>
          <BlurView intensity={28} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={styles.musicOverlay} />
          <TouchableOpacity onPress={() => {}} style={styles.musicIcon}>
            <Ionicons name="play-skip-back" size={18} color={Colors.dim} />
          </TouchableOpacity>
          <TouchableOpacity onPress={togglePlay} style={styles.musicIcon}>
            <Ionicons
              name={isPlaying ? 'pause' : 'play'}
              size={20}
              color={Colors.primaryText}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSkip} style={styles.musicIcon}>
            <Ionicons name="play-skip-forward" size={18} color={Colors.dim} />
          </TouchableOpacity>
          <View style={styles.trackInfo}>
            <Text style={styles.trackName} numberOfLines={1}>{trackName}</Text>
          </View>
        </View>

        <View style={{ height: 72 }} />

        <TouchableOpacity style={styles.endBtn} onPress={() => nav.goBack()}>
          <Text style={styles.endBtnLabel}>End session</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: Colors.background },
  scrim:  { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.62)' },
  safe:   { flex: 1, backgroundColor: 'transparent' },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  timer: {
    ...Typography.heroNumber,
    fontSize: 85,
    color: Colors.pureWhite,
    marginBottom: 28,
  },
  affirmation: {
    ...Typography.largeAffirmation,
    color: 'rgba(255,255,255,0.72)',
    textAlign: 'center',
  },
  musicBarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 12,
    height: 52,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: Colors.glassBorder,
    paddingHorizontal: 14,
    gap: 10,
  },
  musicOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: Colors.glassBg },
  musicIcon:    { width: 32, alignItems: 'center', justifyContent: 'center' },
  trackInfo:    { flex: 1 },
  trackName:    { ...Typography.musicTrackName, color: Colors.primaryText },
  endBtn: {
    position: 'absolute',
    bottom: 80,
    alignSelf: 'center',
    padding: 8,
  },
  endBtnLabel: { ...Typography.metaLabel, color: 'rgba(255,255,255,0.35)' },
});
