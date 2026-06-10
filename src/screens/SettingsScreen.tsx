import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Alert, ScrollView } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { loadPersona, clearPersona } from '../storage/persona';
import { loadInterval, saveInterval } from '../storage/settings';
import { checkAppUnlock } from '../services/purchases';
import { meritRangeLabel } from '../utils/merit';
import type { PersonaData, RootStackParamList } from '../types';

const FREE_PRESETS = [15, 30, 60];
const CUSTOM_MIN = 5;
const CUSTOM_MAX = 180;
const CUSTOM_STEP = 5;

const TIMELINE_LABELS: Record<string, string> = {
  '6mo': '6 months',
  '1yr': '1 year',
  '2yr': '2 years',
  '5yr': '5 years',
};

function SettingRow({ label, value, isLast = false }: { label: string; value: string; isLast?: boolean }) {
  return (
    <View style={[styles.row, !isLast && styles.rowBorder]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue} numberOfLines={1}>{value}</Text>
    </View>
  );
}

export default function SettingsScreen() {
  const nav = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [persona, setPersona] = useState<PersonaData | null>(null);
  const [interval, setIntervalMinutes] = useState(30);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [customMinutes, setCustomMinutes] = useState(45);

  useFocusEffect(
    useCallback(() => {
      loadPersona().then(setPersona);
      checkAppUnlock().then(setIsUnlocked);
      loadInterval().then(mins => {
        setIntervalMinutes(mins);
        if (!FREE_PRESETS.includes(mins)) setCustomMinutes(mins);
      });
    }, [])
  );

  const selectInterval = async (minutes: number) => {
    await saveInterval(minutes);
    setIntervalMinutes(minutes);
  };

  const adjustCustom = async (delta: number) => {
    const next = Math.min(CUSTOM_MAX, Math.max(CUSTOM_MIN, customMinutes + delta));
    setCustomMinutes(next);
    await selectInterval(next);
  };

  const handleResetPersona = () => {
    Alert.alert('Reset persona?', 'This will restart onboarding.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset', style: 'destructive',
        onPress: async () => {
          await clearPersona();
          nav.reset({ index: 0, routes: [{ name: 'Onboarding' }] });
        },
      },
    ]);
  };

  const isCustomSelected = !FREE_PRESETS.includes(interval);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        <Text style={styles.sectionTitle}>FOCUS INTERVAL</Text>
        <View style={styles.card}>
          <BlurView intensity={28} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={styles.cardOverlay} />

          {/* Free presets */}
          <View style={styles.presetRow}>
            {FREE_PRESETS.map(mins => {
              const selected = interval === mins;
              return (
                <TouchableOpacity
                  key={mins}
                  onPress={() => selectInterval(mins)}
                  activeOpacity={0.75}
                  style={[styles.preset, selected && styles.presetSelected]}
                >
                  <BlurView intensity={28} tint="dark" style={StyleSheet.absoluteFill} />
                  <View style={[StyleSheet.absoluteFill, { backgroundColor: selected ? Colors.glassPrimary : 'transparent' }]} />
                  <Text style={[styles.presetNum, selected && styles.presetTextOn]}>{mins}</Text>
                  <Text style={[styles.presetUnit, selected && styles.presetTextOn]}>min</Text>
                  <Text style={[styles.presetMerit, selected && styles.presetMeritOn]}>
                    {meritRangeLabel(mins)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Custom interval — Pro */}
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
                  <Ionicons name="remove" size={18} color={customMinutes <= CUSTOM_MIN ? Colors.ghost : Colors.primaryText} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => selectInterval(customMinutes)} style={styles.stepValue}>
                  <Text style={[styles.stepValueText, isCustomSelected && styles.presetTextOn]}>
                    {customMinutes} min
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => adjustCustom(CUSTOM_STEP)}
                  style={styles.stepBtn}
                  disabled={customMinutes >= CUSTOM_MAX}
                >
                  <Ionicons name="add" size={18} color={customMinutes >= CUSTOM_MAX ? Colors.ghost : Colors.primaryText} />
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

        <Text style={[styles.sectionTitle, { marginTop: 32 }]}>YOUR PERSONA</Text>
        <View style={styles.card}>
          <BlurView intensity={28} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={styles.cardOverlay} />
          <View style={styles.cardInner}>
            {persona ? (
              <>
                <SettingRow label="Name"     value={persona.name} />
                <SettingRow label="Goal"     value={persona.goal} />
                <SettingRow label="Timeline" value={TIMELINE_LABELS[persona.timeline] ?? persona.timeline} isLast />
              </>
            ) : (
              <SettingRow label="Status" value="Not set" isLast />
            )}
          </View>
        </View>
        <TouchableOpacity style={styles.linkBtn} onPress={handleResetPersona}>
          <Text style={styles.linkLabel}>Edit persona</Text>
        </TouchableOpacity>

        <Text style={[styles.sectionTitle, { marginTop: 32 }]}>METHOD PRO</Text>
        <View style={styles.card}>
          <BlurView intensity={28} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={styles.cardOverlay} />
          <View style={styles.cardInner}>
            <SettingRow label="Status" value={isUnlocked ? 'Active' : 'Free'} isLast />
          </View>
        </View>
        {!isUnlocked && (
          <TouchableOpacity
            style={styles.linkBtn}
            onPress={() => Alert.alert('Coming soon', 'Method Pro — $3.99 one-time IAP coming in next build.')}
          >
            <Text style={styles.linkLabel}>Unlock Method Pro — $3.99</Text>
          </TouchableOpacity>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: Colors.background },
  content:      { paddingTop: 88, paddingHorizontal: 24, paddingBottom: 100 },
  sectionTitle: { ...Typography.personaLabel, color: Colors.pureWhite, marginBottom: 12 },
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: Colors.glassBorder,
    marginBottom: 4,
  },
  cardOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: Colors.glassBg },
  cardInner:   { paddingHorizontal: 20 },
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
  presetMeritOn: { color: 'rgba(255,255,255,0.55)' },
  presetTextOn:  { color: Colors.pureWhite },
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
  customLeft: { gap: 3 },
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
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
  },
  rowBorder:  { borderBottomWidth: 0.5, borderBottomColor: Colors.statSeparator },
  rowLabel:   { ...Typography.statRowLabel, color: Colors.dim },
  rowValue:   { ...Typography.statRowValue, color: Colors.primaryText, maxWidth: '60%' },
  linkBtn:    { paddingVertical: 12, paddingHorizontal: 4 },
  linkLabel:  { ...Typography.metaLabel, color: Colors.fade },
});
