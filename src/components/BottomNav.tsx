import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Colors } from '../constants/colors';

const ICONS: Record<string, string> = {
  HomeTab:     'home-outline',
  StatsTab:    'bar-chart',
  SettingsTab: 'options-outline',
};

export default function BottomNav({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom || 16 }]}>
      <BlurView intensity={28} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={styles.overlay} />
      <View style={styles.topBorder} />
      <View style={styles.row}>
        {state.routes.map((route, i) => {
          const focused = state.index === i;
          return (
            <TouchableOpacity
              key={route.key}
              onPress={() => navigation.navigate(route.name)}
              style={styles.tab}
              hitSlop={{ top: 10, bottom: 10, left: 20, right: 20 }}
            >
              <Ionicons
                name={ICONS[route.name] as any}
                size={22}
                color={Colors.pureWhite}
                style={{ opacity: focused ? 1 : 0.28 }}
              />
            </TouchableOpacity>
          );
        })}
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
    overflow: 'hidden',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.navBg,
  },
  topBorder: {
    height: 0.5,
    backgroundColor: Colors.navBorder,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    paddingHorizontal: 32,
  },
  tab: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
