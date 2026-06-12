import React, { useRef, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  Animated, Easing, Alert,
} from 'react-native';
import { BlurView } from 'expo-blur';
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
  const translateY = useRef(new Animated.Value(520)).current;
  const [selected, setSelected] = useState(initialInterval);
  const [customMinutes, setCustomMinutes] = useState(
    FREE_PRESETS.includes(initialInterval) ? 45 : initialInterval
  );

  const isCustomSelected = !FREE_PRESETS.includes(selected);

  useEffect(() => {
    if (visible) {
      setSelected(initialInterval);
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
      toValue: 520,
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
      <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          onPress={() => dismiss(onClose)}
          activeOpacity={1}
        />
      </BlurView>

      <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
        <View style={styles.topShine} />
        <View style={styles.handle} />

        <Text style={styles.title}>Session Duration</Text>
        <Text style={styles.sub}>How long do you want to lock in?</Text>

        {/* Preset tiles */}
        <View style={styles.presetRow}>
          {FREE_PRESETS.map(mins => {
            const active = selected === mins;
            return (
              <TouchableOpacity
                key={mins}
                onPress={() => setSelected(mins)}
                activeOpacity={0.8}
                style={[styles.tile, active && styles.tileActive]}
              >
                <Text style={[styles.tileNum, active && styles.tileNumActive]}>{mins}</Text>
                <Text style={[styles.tileUnit, active && styles.tileUnitActive]}>min</Text>
                <View style={styles.tileDivider} />
                <Text style={[styles.tileMerit, active && styles.tileMeritActive]}>
                  {meritRangeLabel(mins)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Custom row */}
        {isUnlocked ? (
          <View style={styles.customRow}>
            <View style={styles.customLeft}>
              <Text style={[styles.customLabel, isCustomSelected && styles.customLabelActive]}>
                Custom
              </Text>
              <Text style={styles.customMerit}>{meritRangeLabel(customMinutes)}</Text>
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
              <TouchableOpacity onPress={() => setSelected(customMinutes)} style={styles.stepValue}>
                <Text style={[styles.stepValueText, isCustomSelected && styles.customLabelActive]}>
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
            activeOpacity={0.7}
          >
            <View style={styles.customLockedLeft}>
              <Ionicons name="lock-closed" size={13} color={Colors.ghost} />
              <Text style={styles.customLockedLabel}>Custom interval</Text>
            </View>
            <View style={styles.proBadge}>
              <Text style={styles.proBadgeText}>PRO</Text>
            </View>
          </TouchableOpacity>
        )}

        <PillButton
          label="Start Session"
          variant="primary"
          onPress={() => dismiss(() => onConfirm(selected))}
          width="100%"
          height={56}
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
    backgroundColor: '#191919',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: 'rgba(255,255,255,0.10)',
    paddingHorizontal: 24,
    paddingTop: 14,
    paddingBottom: 48,
  },
  topShine: {
    position: 'absolute',
    top: 0,
    left: 40,
    right: 40,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignSelf: 'center',
    marginBottom: 28,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.pureWhite,
    letterSpacing: -0.6,
    marginBottom: 6,
  },
  sub: {
    fontSize: 14,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.38)',
    marginBottom: 24,
  },

  /* Preset tiles */
  presetRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  tile: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingTop: 20,
    paddingBottom: 16,
    alignItems: 'center',
    gap: 2,
  },
  tileActive: {
    backgroundColor: Colors.pureWhite,
    borderColor: Colors.pureWhite,
  },
  tileNum: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.pureWhite,
    letterSpacing: -1,
  },
  tileNumActive: {
    color: Colors.background,
  },
  tileUnit: {
    fontSize: 11,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.35)',
    letterSpacing: 0.3,
    marginBottom: 10,
  },
  tileUnitActive: {
    color: 'rgba(0,0,0,0.40)',
  },
  tileDivider: {
    width: 24,
    height: 0.5,
    backgroundColor: 'rgba(255,255,255,0.12)',
    marginBottom: 10,
  },
  tileMerit: {
    fontSize: 10,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.30)',
    letterSpacing: 0.3,
  },
  tileMeritActive: {
    color: 'rgba(0,0,0,0.40)',
  },

  /* Custom unlocked row */
  customRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginBottom: 4,
  },
  customLeft:       { gap: 4 },
  customLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.50)',
  },
  customLabelActive: { color: Colors.pureWhite },
  customMerit: {
    fontSize: 11,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.28)',
    letterSpacing: 0.2,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stepBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  stepValue: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.12)',
    minWidth: 76,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  stepValueText: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.50)',
  },

  /* Custom locked row */
  customLocked: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    marginBottom: 4,
  },
  customLockedLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  customLockedLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.28)',
  },
  proBadge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  proBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.35)',
    letterSpacing: 1,
  },

  confirmBtn: {
    marginTop: 20,
  },
});
