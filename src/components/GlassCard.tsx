import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { Colors } from '../constants/colors';

type Props = {
  children: React.ReactNode;
  style?: ViewStyle;
  radius?: number;
  padding?: number;
};

export default function GlassCard({ children, style, radius = 20, padding = 20 }: Props) {
  return (
    <View style={[styles.wrapper, { borderRadius: radius }, style]}>
      <BlurView intensity={28} tint="dark" style={[StyleSheet.absoluteFill, { borderRadius: radius }]} />
      <View style={[styles.overlay, { borderRadius: radius }]} />
      <View style={[styles.shine, { borderRadius: radius }]} />
      <View style={{ padding }}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: Colors.glassBorder,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.glassBg,
  },
  shine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: Colors.glassShineTop,
  },
});
