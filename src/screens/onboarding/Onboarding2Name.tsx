import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import Animated, { FadeInDown, Easing } from 'react-native-reanimated';
import { RootStackParamList } from '../../types';
import { useOnboarding } from '../../context/OnboardingContext';
import { Colors } from '../../constants/colors';
import { capture } from '../../services/analytics';

type Props = StackScreenProps<RootStackParamList, 'Onboarding2'>;

export default function Onboarding2Name({ navigation }: Props) {
  const { setName } = useOnboarding();
  const [input, setInput] = useState('');

  const handleContinue = () => {
    capture('onboarding_step', { step: 2 });
    setName(input.trim());
    navigation.navigate('Onboarding3');
  };

  const canContinue = input.trim().length > 0;

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Animated.View entering={FadeInDown.delay(100).duration(500).easing(Easing.out(Easing.cubic))} style={styles.content}>
          <View style={styles.iconCircle}>
            <Text style={styles.iconEmoji}>👋</Text>
          </View>
          <Text style={styles.label}>first things first</Text>
          <Text style={styles.heading}>What should we call you?</Text>
          <TextInput
            style={styles.input}
            placeholder="Your first name"
            placeholderTextColor={Colors.textMuted}
            value={input}
            onChangeText={setInput}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={canContinue ? handleContinue : undefined}
          />
        </Animated.View>

        <View style={styles.ctaArea}>
          <TouchableOpacity
            style={[styles.btn, !canContinue && styles.btnDisabled]}
            onPress={handleContinue}
            disabled={!canContinue}
            activeOpacity={0.85}
          >
            <Text style={styles.btnText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.backgroundAlt },
  container: { flex: 1, paddingHorizontal: 32 },
  content: { flex: 1, justifyContent: 'center', gap: 16 },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary + '1A',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 8,
  },
  iconEmoji: { fontSize: 32 },
  label: {
    fontSize: 11,
    color: Colors.textMuted,
    letterSpacing: 2,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  heading: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
    lineHeight: 36,
  },
  input: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.textPrimary,
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
    paddingVertical: 10,
    marginTop: 8,
  },
  ctaArea: { paddingBottom: 32 },
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
});
