import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withDelay, withSequence, Easing,
} from 'react-native-reanimated';
import { Colors } from '../constants/colors';
import type { Rank } from '../utils/ranks';

type Props = {
  visible: boolean;
  rank: Rank | null;
  onShare: () => void;
  onContinue: () => void;
};

function AnimatedLetter({ char, delay, trigger }: { char: string; delay: number; trigger: boolean }) {
  const opacity = useSharedValue(0);
  const ty = useSharedValue(16);

  useEffect(() => {
    if (trigger) {
      opacity.value = withDelay(delay, withTiming(1, { duration: 280, easing: Easing.out(Easing.cubic) }));
      ty.value = withDelay(delay, withTiming(0, { duration: 280, easing: Easing.out(Easing.cubic) }));
    } else {
      opacity.value = 0;
      ty.value = 16;
    }
  }, [trigger]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: ty.value }],
  }));

  return (
    <Animated.Text style={[styles.rankTitle, style]}>
      {char === ' ' ? ' ' : char}
    </Animated.Text>
  );
}

export default function RankUpCard({ visible, rank, onShare, onContinue }: Props) {
  const backdrop  = useSharedValue(0);
  const labelOp   = useSharedValue(0);
  const lineW     = useSharedValue(0);
  const footerOp  = useSharedValue(0);
  const glowOp    = useSharedValue(0);
  const sweepX    = useSharedValue(-120);
  const sweepOp   = useSharedValue(0);

  useEffect(() => {
    if (visible && rank) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      backdrop.value = withTiming(1, { duration: 400 });
      labelOp.value  = withDelay(200, withTiming(1, { duration: 500 }));
      lineW.value    = withDelay(500, withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) }));

      // Letters stagger starts at 380ms, each 58ms apart
      const lastLetterEnd = 380 + (rank.title.length - 1) * 58 + 280;

      // Glow fades in after last letter lands
      glowOp.value = withDelay(lastLetterEnd, withTiming(1, { duration: 300 }));

      // Sweep fires after glow appears
      const sweepStart = lastLetterEnd + 120;
      sweepOp.value = withDelay(sweepStart, withSequence(
        withTiming(1, { duration: 40 }),
        withTiming(1, { duration: 380 }),
        withTiming(0, { duration: 160 }),
      ));
      sweepX.value = withDelay(sweepStart, withTiming(480, { duration: 580, easing: Easing.inOut(Easing.quad) }));

      footerOp.value = withDelay(sweepStart + 200, withTiming(1, { duration: 500 }));
    } else {
      backdrop.value = 0;
      labelOp.value  = 0;
      lineW.value    = 0;
      footerOp.value = 0;
      glowOp.value   = 0;
      sweepX.value   = -120;
      sweepOp.value  = 0;
    }
  }, [visible, rank]);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdrop.value }));
  const labelStyle    = useAnimatedStyle(() => ({ opacity: labelOp.value }));
  const lineStyle     = useAnimatedStyle(() => ({ transform: [{ scaleX: lineW.value }] }));
  const footerStyle   = useAnimatedStyle(() => ({ opacity: footerOp.value }));
  const glowStyle     = useAnimatedStyle(() => ({ opacity: glowOp.value }));
  const sweepStyle    = useAnimatedStyle(() => ({
    opacity: sweepOp.value,
    transform: [{ translateX: sweepX.value }],
  }));

  if (!rank) return null;

  const chars = rank.title.toUpperCase().split('');

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onContinue}>
      <Animated.View style={[StyleSheet.absoluteFill, backdropStyle]}>
        <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={styles.scrim} />
      </Animated.View>

      <View style={styles.center}>
        <Animated.Text style={[styles.kicker, labelStyle]}>YOU'VE RISEN</Animated.Text>

        <Animated.View style={[styles.lineWrap, lineStyle]}>
          <LinearGradient
            colors={['transparent', 'rgba(255,255,255,0.6)', 'transparent']}
            style={styles.line}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
          />
        </Animated.View>

        <Text style={styles.rankLevel}>RANK {rank.level.toString().padStart(2, '0')}</Text>

        {/* Title: letter stagger + sweep overlay */}
        <View style={styles.titleContainer}>
          <View style={styles.titleRow}>
            {chars.map((char, i) => (
              <AnimatedLetter
                key={i}
                char={char}
                delay={380 + i * 58}
                trigger={visible}
              />
            ))}
          </View>

          {/* Glow layer */}
          <Animated.Text style={[styles.rankTitleGlow, glowStyle]}>
            {rank.title.toUpperCase()}
          </Animated.Text>

          {/* Light sweep */}
          <Animated.View style={[styles.sweep, sweepStyle]} pointerEvents="none">
            <LinearGradient
              colors={['transparent', 'rgba(255,255,255,0.75)', 'transparent']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
            />
          </Animated.View>
        </View>

        <Animated.Text style={[styles.subtext, labelStyle]}>
          New affirmations unlocked.
        </Animated.Text>

        <Animated.View style={[styles.footer, footerStyle]}>
          <TouchableOpacity style={styles.shareBtn} onPress={onShare} activeOpacity={0.8}>
            <BlurView intensity={40} tint="light" style={StyleSheet.absoluteFill} />
            <Text style={styles.shareLabel}>Share This</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.continueBtn} onPress={onContinue} activeOpacity={0.7}>
            <Text style={styles.continueLabel}>Continue</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.55)' },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  kicker: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 4,
    color: 'rgba(255,255,255,0.50)',
    marginBottom: 18,
  },
  lineWrap: {
    width: 200,
    height: 1,
    marginBottom: 26,
  },
  line: { flex: 1, height: 1 },
  rankLevel: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 3,
    color: 'rgba(255,255,255,0.40)',
    textAlign: 'center',
    marginBottom: 12,
  },
  titleContainer: {
    alignItems: 'center',
    overflow: 'hidden',
    paddingVertical: 4,
    marginBottom: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rankTitle: {
    fontSize: 38,
    fontWeight: '800',
    letterSpacing: -0.5,
    color: Colors.pureWhite,
  },
  rankTitleGlow: {
    position: 'absolute',
    left: 0,
    right: 0,
    fontSize: 38,
    fontWeight: '800',
    letterSpacing: -0.5,
    color: 'transparent',
    textAlign: 'center',
    textShadowColor: 'rgba(255,255,255,0.45)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 24,
  },
  sweep: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 90,
    left: 0,
  },
  subtext: {
    fontSize: 13,
    fontWeight: '300',
    color: 'rgba(255,255,255,0.45)',
    marginTop: 22,
    letterSpacing: 0.3,
  },
  footer: {
    position: 'absolute',
    bottom: 60,
    left: 32,
    right: 32,
    alignItems: 'center',
    gap: 16,
  },
  shareBtn: {
    width: '100%',
    height: 54,
    borderRadius: 100,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  shareLabel: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 1.2,
    color: Colors.pureWhite,
  },
  continueBtn:  { paddingVertical: 6 },
  continueLabel: {
    fontSize: 13,
    fontWeight: '400',
    letterSpacing: 0.5,
    color: 'rgba(255,255,255,0.45)',
  },
});
