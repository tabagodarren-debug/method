import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import Animated, { FadeInDown, Easing } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../types';
import { useOnboarding } from '../../context/OnboardingContext';
import { Colors } from '../../constants/colors';
import { capture } from '../../services/analytics';

type Props = StackScreenProps<RootStackParamList, 'Onboarding3'>;

// TODO: Replace these options with your app's actual question and choices
const OPTIONS = [
  { id: 'a', icon: 'flash-outline' as const,   label: 'Option A', description: 'Short description of option A' },
  { id: 'b', icon: 'leaf-outline' as const,    label: 'Option B', description: 'Short description of option B' },
  { id: 'c', icon: 'planet-outline' as const,  label: 'Option C', description: 'Short description of option C' },
  { id: 'd', icon: 'diamond-outline' as const, label: 'Option D', description: 'Short description of option D' },
];

export default function Onboarding3Question({ navigation }: Props) {
  const { name } = useOnboarding();
  const [selected, setSelected] = useState<string | null>(null);

  const handleContinue = () => {
    capture('onboarding_step', { step: 3, selection: selected });
    navigation.navigate('Onboarding4');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Animated.View entering={FadeInDown.delay(100).duration(500).easing(Easing.out(Easing.cubic))} style={styles.header}>
          <Text style={styles.label}>quick question</Text>
          {/* TODO: Replace this question with something relevant to your app */}
          <Text style={styles.heading}>
            {name ? `${name}, what` : 'What'} brings you here?
          </Text>
          <Text style={styles.subheading}>Pick what fits best — we'll personalise your experience.</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(250).duration(500).easing(Easing.out(Easing.cubic))} style={styles.options}>
          {OPTIONS.map((option) => {
            const isSelected = selected === option.id;
            return (
              <TouchableOpacity
                key={option.id}
                style={[styles.option, isSelected && styles.optionSelected]}
                onPress={() => setSelected(option.id)}
                activeOpacity={0.8}
              >
                <View style={[styles.optionIcon, isSelected && styles.optionIconSelected]}>
                  <Ionicons name={option.icon} size={20} color={isSelected ? '#fff' : Colors.primary} />
                </View>
                <View style={styles.optionText}>
                  <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>
                    {option.label}
                  </Text>
                  <Text style={[styles.optionDesc, isSelected && styles.optionDescSelected]}>
                    {option.description}
                  </Text>
                </View>
                {isSelected && (
                  <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
                )}
              </TouchableOpacity>
            );
          })}
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400).duration(500).easing(Easing.out(Easing.cubic))} style={styles.ctaArea}>
          <TouchableOpacity
            style={[styles.btn, !selected && styles.btnDisabled]}
            onPress={handleContinue}
            disabled={!selected}
            activeOpacity={0.85}
          >
            <Text style={styles.btnText}>Continue</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleContinue} style={styles.skipBtn}>
            <Text style={styles.skipText}>Skip for now</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.backgroundAlt },
  container: { flex: 1, paddingHorizontal: 24, paddingTop: 24, paddingBottom: 32, justifyContent: 'space-between' },
  header: { gap: 8, marginBottom: 8 },
  label: {
    fontSize: 11,
    color: Colors.textMuted,
    letterSpacing: 2,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  heading: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
    lineHeight: 34,
  },
  subheading: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  options: { flex: 1, gap: 10, justifyContent: 'center' },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    gap: 12,
  },
  optionSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '0D',
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.primary + '1A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionIconSelected: {
    backgroundColor: Colors.primary,
  },
  optionText: { flex: 1 },
  optionLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  optionLabelSelected: { color: Colors.primary },
  optionDesc: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 2,
  },
  optionDescSelected: { color: Colors.primaryMid },
  ctaArea: { gap: 8 },
  btn: {
    backgroundColor: Colors.primary,
    borderRadius: 100,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  btnDisabled: { opacity: 0.4 },
  btnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  skipBtn: { alignItems: 'center', paddingVertical: 8 },
  skipText: { fontSize: 14, color: Colors.textMuted, fontWeight: '500' },
});
