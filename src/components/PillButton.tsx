import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';

type Props = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  style?: ViewStyle;
  width?: number | string;
  height?: number;
};

export default function PillButton({
  label,
  onPress,
  variant = 'primary',
  style,
  width = 280,
  height = 60,
}: Props) {
  const isPrimary = variant === 'primary';

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.75}
      style={[styles.pill, { height, width: width as number }, style]}
    >
      <BlurView intensity={28} tint="dark" style={StyleSheet.absoluteFill} />
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: isPrimary ? Colors.glassPrimary : Colors.glassBg },
        ]}
      />
      <View style={styles.shine} />
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  pill: {
    borderRadius: 9999,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: Colors.glassBorderLight,
  },
  shine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1.5,
    backgroundColor: 'rgba(255,255,255,0.24)',
    borderTopLeftRadius: 9999,
    borderTopRightRadius: 9999,
  },
  label: {
    ...Typography.buttonLabel,
    color: Colors.pureWhite,
  },
});
