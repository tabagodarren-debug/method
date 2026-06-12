import React, { useRef, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  Animated, Easing, Alert,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import PillButton from './PillButton';
import { Colors } from '../constants/colors';
import { meritRangeLabel } from '../utils/merit';

const FREE_PRESETS = [15, 30, 60];
const CUSTOM_MIN = 5;
const CUSTOM_MAX = 180;
const CUSTOM_STEP = 5;

type Props = {
  visible: boolean;
  initialInterval: number;
  isUnlocked: boolean;
  onConfirm: (minutes: number) => void;
  onClose: () => void;
};

export default function SessionPickerModal({
  visible,
  initialInterval,
  isUnlocked,
  onConfirm,
  onClose,
}: Props) {
  const translateY = useRef(new Animated.Value(480)).current;
  const [selected, setSelected] = useState(initialInterval);
  const [customMinutes, setCustomMinutes] = useState(
    FREE_PRESETS.includes(initialInterval) ? 45 : initialInterval
  );

  const isCustomSelected = !FREE_PRESETS.includes(selected);

  useEffect(() => {
    if (visible) {
      const safeInitial = FREE_PRESETS.includes(initialInterval) ? initialInterval : FREE_PRESETS[0];
      setSelected(FREE_PRESETS.includes(initialInterval) ? initialInterval : initialInterval);
      if (!FREE_PRESETS.includes(initialInterval)) setCustomMinutes(initialInterval);
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
      toValue: 480,
      duration: 280,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => callback?.());
  };

  const adjustCustom = (delta: number) => {
    const next = Math.min(CUSTOM_MAX, Math.max(CUSTOM_MIN, customMinutes + delta));
    setCustomMinutes(next);
    setSelected(next);
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

        {/* Preset cards */}
        <View style={styles.card}>
          <BlurView intensity={28} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={styles.cardOverlay} />

          <View style={styles.presetRow}>
            {FREE_PRESETS.map(mins => {
              const active = selected === mins;
              return (
                <TouchableOpacity
                  key={mins}
                  onPress={() => setSelected(mins)}
                  activeOpacity={0.75}
                  style={[styles.preset, active && styles.presetSelected]}
                >
                  <BlurView intensity={28} tint="dark" style={StyleSheet.absoluteFill} />
                  <View style={[StyleSheet.absoluteFill, { backgroundColor: active ? Colors.glassPrimary : 'transparent' }]} />
                  <Text style={[styles.presetNum, active && styles.presetTextOn]}>{mins}</Text>
                  <Text style={[styles.presetUnit, active && styles.presetTextOn]}>min</Text>
                  <Text style={[styles.presetMerit, active && styles.presetMeritOn]}>
                    {meritRangeLabel(mins)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.divider} />

          {/* Custom row */}
          {isUnlocked ? (
            <View style={styles.customRow}>
              <View style={styles.customLeft}>
                <Text style={[styles.customLabel, isCustomSelected && styles.presetTextOn]}>Custom</Text>
                <Text style={styles.presetMerit}>{meritRangeLabel(customMinutes)}</Text>
              </View>
              <View style={styles.stepper}>
                <TouchableOpacity
                  onPress={() => adjustCustom(-CUSTOM_STEP)}
                  style={styles.stepBtn}
                  disabled={customMinutes <= CUSTOM_MIN}
                >
                  <Ionicons
                    name="remove"
                    size={18}
                    color={customMinutes <= CUSTOM_MIN ? Colors.ghost : Colors.primaryText}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setSelected(customMinutes)}
                  style={styles.stepValue}
                >
                  <Text style={[styles.stepValueText, isCustomSelected && styles.presetTextOn]}>
                    {customMinutes} min
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => adjustCustom(CUSTOM_STEP)}
                  style={styles.stepBtn}
                  disabled={customMinutes >= CUSTOM_MAX}
                >
                  <Ionicons
                    name="add"
                    size={18}
                    color={customMinutes >= CUSTOM_MAX ? Colors.ghost : Colors.primaryText}
                  />
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.customLocked}
              onPress={() => Alert.alert('Method Pro', 'Unlock custom focus intervals and more with Method Pro.')}
            >
              <Ionicons name="lock-closed" size={12} color={Colors.ghost} style={{ marginRight: 6 }} />
              <Text style={styles.customLockedLabel}>Custom interval — Pro</Text>
            </TouchableOpacity>
          )}
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
    paddingHorizontal: 24,
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
    marginBottom: 16,
  },
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: Colors.glassBorder,
    marginBottom: 4,
  },
  cardOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: Colors.glassBg,
  },
  presetRow: {
    flexDirection: 'row',
    padding: 14,
    gap: 8,
  },
  preset: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: Colors.glassBorder,
    paddingVertical: 12,
    alignItems: 'center',
    gap: 2,
  },
  presetSelected: { borderColor: Colors.glassBorderLight },
  presetNum: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.dim,
  },
  presetUnit: {
    fontSize: 9,
    fontWeight: '400',
    color: Colors.ghost,
  },
  presetMerit: {
    fontSize: 8,
    fontWeight: '400',
    color: Colors.ghost,
    marginTop: 4,
    letterSpacing: 0.2,
  },
  presetMeritOn:  { color: 'rgba(255,255,255,0.55)' },
  presetTextOn:   { color: Colors.pureWhite },
  divider: {
    height: 0.5,
    backgroundColor: Colors.glassBorder,
    marginHorizontal: 14,
  },
  customRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  customLeft:  { gap: 3 },
  customLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.dim,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stepBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: Colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepValue: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: Colors.glassBorder,
    minWidth: 72,
    alignItems: 'center',
  },
  stepValueText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.dim,
  },
  customLocked: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  customLockedLabel: {
    fontSize: 13,
    fontWeight: '400',
    color: Colors.ghost,
  },
  confirmBtn: {
    marginTop: 16,
  },
});
