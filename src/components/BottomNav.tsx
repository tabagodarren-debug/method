import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, LayoutChangeEvent } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue, useAnimatedStyle, withSequence, withSpring, SharedValue,
} from 'react-native-reanimated';

const TAB_LABELS: Record<string, string> = {
  HomeTab:     'Home',
  StatsTab:    'Stats',
  SettingsTab: 'Settings',
};

const TAB_ICONS: Record<string, [string, string]> = {
  HomeTab:     ['home',      'home-outline'],
  StatsTab:    ['bar-chart', 'bar-chart-outline'],
  SettingsTab: ['options',   'options-outline'],
};

function AnimatedTabIcon({ name, size, color, focused, isSpin }: {
  name: string; size: number; color: string; focused: boolean; isSpin?: boolean;
}) {
  const scale  = useSharedValue(1);
  const rotate = useSharedValue(0);

  useEffect(() => {
    if (focused) {
      scale.value = withSequence(
        withSpring(1.22, { damping: 6,  stiffness: 300 }),
        withSpring(1,    { damping: 12, stiffness: 300 })
      );
      if (isSpin) rotate.value = withSpring(45, { damping: 8, stiffness: 120 });
    } else {
      if (isSpin) rotate.value = withSpring(0, { damping: 10 });
    }
  }, [focused]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { rotate: `${rotate.value}deg` }],
  }));

  return (
    <Animated.View style={style}>
      <Ionicons name={name as any} size={size} color={color} />
    </Animated.View>
  );
}

function SlidingIndicator({ slideX, width }: { slideX: SharedValue<number>; width: number }) {
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: slideX.value }] }));
  return (
    <Animated.View style={[styles.slideIndicator, { width }, style]}>
      <LinearGradient
        colors={['rgba(255,255,255,0.20)', 'rgba(255,255,255,0.07)']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />
    </Animated.View>
  );
}

export default function BottomNav({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const [pillWidth, setPillWidth] = useState(0);
  const slideX = useSharedValue(0);

  useEffect(() => {
    if (pillWidth > 0) {
      const tabW = pillWidth / state.routes.length;
      slideX.value = withSpring(state.index * tabW, { damping: 38, stiffness: 200 });
    }
  }, [state.index, pillWidth]);

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 12 }]}>
      <View style={styles.pillShadow}>
        <View style={styles.pillClip}>
          {/* Liquid glass layers */}
          <BlurView intensity={65} tint="dark" style={StyleSheet.absoluteFill} />
          <LinearGradient
            colors={['rgba(255,255,255,0.14)', 'rgba(255,255,255,0.04)']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
          />
          <View style={styles.topShine} />

          <View
            style={styles.pillInner}
            onLayout={(e: LayoutChangeEvent) => {
              const w = e.nativeEvent.layout.width;
              if (w !== pillWidth) {
                const tabW = w / state.routes.length;
                slideX.value = state.index * tabW;
                setPillWidth(w);
              }
            }}
          >
            {pillWidth > 0 && (
              <SlidingIndicator slideX={slideX} width={pillWidth / state.routes.length} />
            )}

            {state.routes.map((route, index) => {
              const focused = state.index === index;
              const [activeIcon, inactiveIcon] = TAB_ICONS[route.name] ?? ['ellipse', 'ellipse-outline'];
              const color = focused ? '#FFFFFF' : 'rgba(255,255,255,0.32)';

              const onPress = () => {
                const event = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });
                if (!focused && !event.defaultPrevented) {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  navigation.navigate(route.name);
                }
              };

              return (
                <TouchableOpacity
                  key={route.key}
                  style={styles.tabBtn}
                  onPress={onPress}
                  activeOpacity={0.7}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: focused }}
                >
                  <AnimatedTabIcon
                    name={focused ? activeIcon : inactiveIcon}
                    size={22}
                    color={color}
                    focused={focused}
                    />
                  <Text style={[styles.tabLabel, { color }]}>
                    {TAB_LABELS[route.name]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
  },
  pillShadow: {
    flex: 1,
    borderRadius: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  pillClip: {
    height: 62,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    overflow: 'hidden',
  },
  topShine: {
    position: 'absolute',
    top: 0,
    left: 32,
    right: 32,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.50)',
    zIndex: 1,
  },
  pillInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  slideIndicator: {
    position: 'absolute',
    top: 5,
    bottom: 5,
    left: 0,
    borderRadius: 100,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: 8,
  },
  tabLabel: {
    fontSize: 10.5,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
});
