import React, { useRef, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  Animated, Easing, Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import PillButton from './PillButton';
import { Colors } from '../constants/colors';

const DURATIONS = [15, 25, 45, 60, 90];

type Props = {
  visible: boolean;
  initialInterval: number;
  onConfirm: (minutes: number) => void;
  onClose: () => void;
};

export default function SessionPickerModal({ visible, initialInterval, onConfirm, onClose }: Props) {
  const translateY = useRef(new Animated.Value(420)).current;
  const [selected, setSelected] = useState(initialInterval);

  useEffect(() => {
    if (visible) {
      setSelected(initialInterval);
      Animated.timing(translateY, {
        toValue: 0,
        duration: 360,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }
  }, [visible, initialInterval]);

  const dismiss = (callback?: () => void) => {
    Animated.timing(translateY, {
      toValue: 420,
      duration: 280,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => callback?.());
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={() => dismiss(onClose)}>
      <BlurView intensity={18} tint="dark" style={StyleSheet.absoluteFill}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          onPress={() => dismiss(onClose)}
          activeOpacity={1}
        />
      </BlurView>

      <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
        <LinearGradient
          colors={['rgba(255,255,255,0.09)', 'rgba(255,255,255,0.02)']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
        <View style={styles.topShine} />
        <View style={styles.handle} />

        <Text style={styles.title}>Session Duration</Text>
        <Text style={styles.sub}>How long do you want to lock in?</Text>

        <View style={styles.chipRow}>
          {DURATIONS.map(d => {
            const active = d === selected;
            return (
              <TouchableOpacity
                key={d}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => setSelected(d)}
                activeOpacity={0.7}
              >
                <Text style={[styles.chipNum, active && styles.chipNumActive]}>{d}</Text>
                <Text style={[styles.chipUnit, active && styles.chipUnitActive]}>min</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <PillButton
          label="Start Session"
          variant="primary"
          onPress={() => dismiss(() => onConfirm(selected))}
          width="100%"
          height={54}
          style={styles.confirmBtn}
        />
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1C1C1C',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
    paddingHorizontal: 28,
    paddingTop: 14,
    paddingBottom: 48,
  },
  topShine: {
    position: 'absolute',
    top: 0,
    left: 32,
    right: 32,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.30)',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignSelf: 'center',
    marginBottom: 28,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.pureWhite,
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  sub: {
    fontSize: 13,
    fontWeight: '400',
    color: Colors.dim,
    letterSpacing: 0.1,
    marginBottom: 28,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 10,
  },
  chip: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  chipActive: {
    backgroundColor: Colors.pureWhite,
    borderColor: Colors.pureWhite,
  },
  chipNum: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.pureWhite,
    letterSpacing: -0.5,
  },
  chipNumActive: {
    color: Colors.background,
  },
  chipUnit: {
    fontSize: 10,
    fontWeight: '500',
    color: Colors.dim,
    letterSpacing: 0.5,
    marginTop: 3,
  },
  chipUnitActive: {
    color: 'rgba(0,0,0,0.45)',
  },
  confirmBtn: {
    marginTop: 24,
  },
});
