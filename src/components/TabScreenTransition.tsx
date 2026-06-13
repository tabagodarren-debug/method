import React, { useRef } from 'react';
import { Animated, StyleProp, ViewStyle } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useReducedMotion } from 'react-native-reanimated';

type Props = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

export default function TabScreenTransition({ children, style }: Props) {
  const reducedMotion = useReducedMotion();
  const opacity = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useFocusEffect(
    React.useCallback(() => {
      opacity.stopAnimation();
      translateY.stopAnimation();
      scale.stopAnimation();

      if (reducedMotion) {
        opacity.setValue(1);
        translateY.setValue(0);
        scale.setValue(1);
        return undefined;
      }

      opacity.setValue(0.01);
      translateY.setValue(8);
      scale.setValue(0.985);

      const motion = Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 240,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          damping: 18,
          stiffness: 150,
          mass: 0.8,
          useNativeDriver: true,
        }),
      ]);

      motion.start();
      return () => motion.stop();
    }, [opacity, reducedMotion, scale, translateY])
  );

  return (
    <Animated.View
      style={[
        style,
        {
          opacity,
          transform: [{ translateY }, { scale }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}
