import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, Easing,
} from 'react-native-reanimated';
import { Colors } from '../constants/colors';

type Props = {
  percent: number;
  leftLabel?: string;
  rightLabel?: string;
  height?: number;
  animate?: boolean;
};

export default function RankProgressBar({
  percent,
  leftLabel,
  rightLabel,
  height = 6,
  animate = true,
}: Props) {
  const fill = useSharedValue(animate ? 0 : percent);

  useEffect(() => {
    fill.value = withTiming(percent, { duration: animate ? 900 : 0, easing: Easing.out(Easing.cubic) });
  }, [percent, animate]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${Math.max(0, Math.min(1, fill.value)) * 100}%`,
  }));

  return (
    <View style={styles.wrap}>
      <View style={[styles.track, { height, borderRadius: height / 2 }]}>
        <Animated.View style={[styles.fill, { borderRadius: height / 2 }, fillStyle]}>
          <LinearGradient
            colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.55)']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />
          <View style={styles.fillShine} />
        </Animated.View>
      </View>
      {(leftLabel || rightLabel) && (
        <View style={styles.labelRow}>
          {leftLabel ? <Text style={styles.label}>{leftLabel}</Text> : <View />}
          {rightLabel ? <Text style={styles.labelStrong}>{rightLabel}</Text> : <View />}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%' },
  track: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    overflow: 'hidden',
  },
  fillShine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  label: {
    fontSize: 10,
    fontWeight: '400',
    letterSpacing: 0.4,
    color: Colors.dim,
  },
  labelStrong: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.70)',
  },
});
