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

export default function RankUpCard({ visible, rank, onShare, onContinue }: Props) {
  const backdrop = useSharedValue(0);
  const labelOp = useSharedValue(0);
  const titleOp = useSharedValue(0);
  const titleScale = useSharedValue(0.82);
  const lineW = useSharedValue(0);
  const footerOp = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      backdrop.value = withTiming(1, { duration: 400 });
      labelOp.value = withDelay(200, withTiming(1, { duration: 500 }));
      titleOp.value = withDelay(380, withTiming(1, { duration: 600 }));
      titleScale.value = withDelay(380, withSequence(
        withTiming(1.04, { duration: 600, easing: Easing.out(Easing.cubic) }),
        withTiming(1, { duration: 220 }),
      ));
      lineW.value = withDelay(700, withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) }));
      footerOp.value = withDelay(1100, withTiming(1, { duration: 500 }));
    } else {
      backdrop.value = 0;
      labelOp.value = 0;
      titleOp.value = 0;
      titleScale.value = 0.82;
      lineW.value = 0;
      footerOp.value = 0;
    }
  }, [visible]);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdrop.value }));
  const labelStyle = useAnimatedStyle(() => ({ opacity: labelOp.value }));
  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOp.value,
    transform: [{ scale: titleScale.value }],
  }));
  const lineStyle = useAnimatedStyle(() => ({ transform: [{ scaleX: lineW.value }] }));
  const footerStyle = useAnimatedStyle(() => ({ opacity: footerOp.value }));

  if (!rank) return null;

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

        <Animated.View style={titleStyle}>
          <Text style={styles.rankLevel}>RANK {rank.level.toString().padStart(2, '0')}</Text>
          <Text style={styles.rankTitle}>{rank.title.toUpperCase()}</Text>
          <Text style={styles.rankTitleGlow}>{rank.title.toUpperCase()}</Text>
        </Animated.View>

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
    marginBottom: 10,
  },
  rankTitle: {
    fontSize: 38,
    fontWeight: '800',
    letterSpacing: -1,
    color: Colors.pureWhite,
    textAlign: 'center',
  },
  rankTitleGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    fontSize: 38,
    fontWeight: '800',
    letterSpacing: -1,
    color: 'transparent',
    textAlign: 'center',
    textShadowColor: 'rgba(255,255,255,0.45)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 24,
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
    color: Colors.background,
  },
  continueBtn: { paddingVertical: 6 },
  continueLabel: {
    fontSize: 13,
    fontWeight: '400',
    letterSpacing: 0.5,
    color: 'rgba(255,255,255,0.45)',
  },
});
