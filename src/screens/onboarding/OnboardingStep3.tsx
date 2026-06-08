import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { BlurView } from 'expo-blur';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import type { Timeline } from '../../types';

const OPTIONS: { label: string; value: Timeline }[] = [
  { label: '6 months', value: '6mo' },
  { label: '1 year',   value: '1yr' },
  { label: '2 years',  value: '2yr' },
  { label: '5 years',  value: '5yr' },
];

type Props = { onComplete: (timeline: Timeline) => void };

export default function OnboardingStep3({ onComplete }: Props) {
  const [selected, setSelected] = useState<Timeline | null>(null);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.top}>
        <Text style={styles.stepIndicator}>3 / 3</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.question}>{'By when?'}</Text>
        <View style={styles.options}>
          {OPTIONS.map(opt => (
            <TouchableOpacity
              key={opt.value}
              onPress={() => setSelected(opt.value)}
              activeOpacity={0.75}
              style={[styles.option, selected === opt.value && styles.optionSelected]}
            >
              <BlurView intensity={28} tint="dark" style={StyleSheet.absoluteFill} />
              <View
                style={[
                  StyleSheet.absoluteFill,
                  { backgroundColor: selected === opt.value ? Colors.glassPrimary : Colors.glassBg },
                ]}
              />
              <Text style={styles.optionLabel}>{opt.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <View style={styles.bottom}>
        <TouchableOpacity
          onPress={() => selected && onComplete(selected)}
          activeOpacity={selected ? 0.75 : 1}
          style={[styles.continueBtn, !selected && styles.continueBtnDisabled]}
        >
          <BlurView intensity={28} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: Colors.glassPrimary }]} />
          <Text style={styles.continueBtnLabel}>Let's go</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: Colors.background },
  top:           { paddingTop: 8, paddingHorizontal: 28 },
  stepIndicator: { ...Typography.stepIndicator, color: Colors.fade },
  content:       { flex: 1, justifyContent: 'center', paddingHorizontal: 28 },
  question:      { ...Typography.onboardingQuestion, color: Colors.primaryText, marginBottom: 32 },
  options:       { gap: 14 },
  option: {
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: Colors.glassBorder,
    paddingVertical: 17,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  optionSelected:      { borderColor: Colors.glassBorderLight },
  optionLabel:         { ...Typography.buttonLabel, color: Colors.primaryText },
  bottom: {
    alignItems: 'center',
    paddingBottom: 8,
    paddingHorizontal: 28,
  },
  continueBtn: {
    borderRadius: 9999,
    overflow: 'hidden',
    height: 60,
    width: 280,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: Colors.glassBorderLight,
  },
  continueBtnDisabled: { opacity: 0.38 },
  continueBtnLabel:    { ...Typography.buttonLabel, color: Colors.pureWhite },
});
