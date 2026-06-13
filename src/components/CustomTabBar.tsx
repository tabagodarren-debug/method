import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, LayoutChangeEvent } from 'react-native';
import { BlurView, BlurTint } from 'expo-blur';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, useThemeId } from '../context/ThemeContext';
import { SoundHaptics } from '../utils/soundHaptics';
import Animated, { useSharedValue, useAnimatedStyle, withSequence, withSpring, SharedValue } from 'react-native-reanimated';

function AnimatedTabIcon({ name, size, color, focused, isSettings, pressKey }: {
  name: string; size: number; color: string; focused: boolean; isSettings?: boolean; pressKey?: number;
}) {
  const scale = useSharedValue(1);
  const rotate = useSharedValue(0);

  useEffect(() => {
    if (focused) {
      scale.value = withSequence(
        withSpring(1.22, { damping: 6, stiffness: 300 }),
        withSpring(1, { damping: 12, stiffness: 300 })
      );
      if (isSettings) {
        rotate.value = withSpring(45, { damping: 8, stiffness: 120 });
      }
    } else {
      if (isSettings) {
        rotate.value = withSpring(0, { damping: 10 });
      }
    }
  }, [focused]);

  useEffect(() => {
    if (!pressKey) return;
    scale.value = 0.85;
    scale.value = withSpring(1, { damping: 12, stiffness: 360 });
  }, [pressKey]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { rotate: `${rotate.value}deg` }],
  }));

  return (
    <Animated.View style={style}>
      <Ionicons name={name as any} size={size} color={color} />
    </Animated.View>
  );
}

function SlidingIndicator({ slideX, width, isDark }: {
  slideX: SharedValue<number>;
  width: number;
  isDark: boolean;
}) {
  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: slideX.value }],
  }));
  return (
    <Animated.View
      style={[
        styles.slideIndicator,
        { width, backgroundColor: isDark ? 'rgba(255,255,255,0.11)' : 'rgba(0,0,0,0.07)' },
        style,
      ]}
    />
  );
}

const TAB_LABELS: Record<string, string> = {
  HomeTab:     'Home',
  BrowseTab:   'Browse',
  SettingsTab: 'Settings',
};

const TAB_ICONS: Record<string, [string, string]> = {
  HomeTab:     ['home',     'home-outline'],
  BrowseTab:   ['compass',  'compass-outline'],
  SettingsTab: ['settings', 'settings-outline'],
};

export default function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const themeId = useThemeId();
  const isDark = themeId === 'dark';

  const [pillWidth, setPillWidth] = useState(0);
  const [pressTicks, setPressTicks] = useState<Record<string, number>>({});
  const slideX = useSharedValue(0);

  useEffect(() => {
    if (pillWidth > 0) {
      const tabWidth = pillWidth / state.routes.length;
      slideX.value = withSpring(state.index * tabWidth, { damping: 38, stiffness: 200 });
    }
  }, [state.index, pillWidth]);

  const blurTint = isDark ? 'dark' : 'light';
  const blurIntensity = 55;
  const overlayColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.50)';
  const borderColor = isDark ? 'rgba(255,255,255,0.10)' : theme.glassBorder;
  const activeColor = isDark ? 'white' : theme.textPrimary;
  const inactiveColor = isDark ? 'rgba(255,255,255,0.35)' : theme.textMuted;

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 12 }]}>
      {/* Shadow shell — no overflow:hidden so shadows render */}
      <View style={styles.pillShadow}>
        {/* Clip shell — clips blur to rounded shape */}
        <View style={[styles.pillClip, { borderColor }]}>
          <BlurView intensity={blurIntensity} tint={blurTint} style={StyleSheet.absoluteFill} />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: overlayColor }]} />
          {/* Tab buttons sit above blur layers */}
          <View
            style={styles.pillInner}
            onLayout={(e: LayoutChangeEvent) => {
              const w = e.nativeEvent.layout.width;
              if (w !== pillWidth) {
                const tabWidth = w / state.routes.length;
                slideX.value = state.index * tabWidth;
                setPillWidth(w);
              }
            }}
          >
            {pillWidth > 0 && (
              <SlidingIndicator
                slideX={slideX}
                width={pillWidth / state.routes.length}
                isDark={isDark}
              />
            )}
            {state.routes.map((route, index) => {
              const focused = state.index === index;
              const [activeIcon, inactiveIcon] = TAB_ICONS[route.name] ?? ['ellipse', 'ellipse-outline'];
              const iconName = focused ? activeIcon : inactiveIcon;
              const color = focused ? activeColor : inactiveColor;

              const onPress = () => {
                const event = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });
                if (!focused && !event.defaultPrevented) {
                  SoundHaptics.tabSwitch();
                  navigation.navigate(route.name);
                }
              };

              return (
                <TouchableOpacity
                  key={route.key}
                  style={styles.tabBtn}
                  onPress={onPress}
                  onPressIn={() => setPressTicks(ticks => ({ ...ticks, [route.key]: (ticks[route.key] ?? 0) + 1 }))}
                  activeOpacity={0.7}
                  accessibilityLabel={TAB_LABELS[route.name]}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: focused }}
                >
                  <View style={styles.iconWrap}>
                    <AnimatedTabIcon
                      name={iconName}
                      size={22}
                      color={color}
                      focused={focused}
                      isSettings={route.name === 'SettingsTab'}
                      pressKey={pressTicks[route.key] ?? 0}
                    />
                  </View>
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
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
  },
  pillShadow: {
    flex: 1,
    borderRadius: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  pillClip: {
    height: 59,
    borderRadius: 100,
    borderWidth: 1,
    overflow: 'hidden',
  },
  pillInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: 8,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  slideIndicator: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    left: 0,
    borderRadius: 100,
  },
});
