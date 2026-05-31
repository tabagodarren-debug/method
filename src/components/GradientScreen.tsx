import React, { useRef } from 'react';
import { SafeAreaView, StyleSheet, ViewStyle, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { useReducedMotion } from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';

type Props = {
  children: React.ReactNode;
  style?: ViewStyle;
};

export default function GradientScreen({ children, style }: Props) {
  const theme = useTheme();
  const reducedMotion = useReducedMotion();
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.97)).current;

  useFocusEffect(
    React.useCallback(() => {
      if (reducedMotion) {
        opacity.setValue(1);
        scale.setValue(1);
        return;
      }
      opacity.setValue(0);
      scale.setValue(0.97);
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          tension: 120,
          friction: 10,
          useNativeDriver: true,
        }),
      ]).start();
    }, [reducedMotion])
  );

  return (
    <LinearGradient
      colors={[theme.gradientDark, theme.gradientMid, theme.gradientLight]}
      locations={[0, 0.5, 1]}
      style={styles.gradient}
    >
      <SafeAreaView style={[styles.safe, style]}>
        <Animated.View style={[styles.animContainer, { opacity, transform: [{ scale }] }]}>
          {children}
        </Animated.View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safe: { flex: 1, backgroundColor: 'transparent' },
  animContainer: { flex: 1 },
});
