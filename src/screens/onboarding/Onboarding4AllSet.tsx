import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StackScreenProps } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { FadeInDown, FadeIn, Easing } from 'react-native-reanimated';
import { RootStackParamList } from '../../types';
import { useOnboarding } from '../../context/OnboardingContext';
import { Colors } from '../../constants/colors';
import { capture } from '../../services/analytics';
import { setOnboarded, saveOnboardingData } from '../../storage/settings';

type Props = StackScreenProps<RootStackParamList, 'Onboarding4'>;

const CHECKMARKS = [
  'Your profile is set up',
  'Personalisation complete',
  'Ready to go',
];

export default function Onboarding4AllSet({ navigation }: Props) {
  const { name } = useOnboarding();
  const [saving, setSaving] = useState(false);

  const handleStart = async () => {
    setSaving(true);
    try {
      capture('onboarding_step', { step: 4 });
      await saveOnboardingData({ name });
      await setOnboarded();
      navigation.replace('MainTabs');
    } catch {
      setSaving(false);
      Alert.alert('Something went wrong', 'Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Animated.View entering={FadeIn.delay(200).duration(600)} style={styles.topSection}>
          <View style={styles.successCircle}>
            <Ionicons name="checkmark" size={48} color="#fff" />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400).duration(500).easing(Easing.out(Easing.cubic))} style={styles.middle}>
          {CHECKMARKS.map((item, i) => (
            <View key={i} style={styles.checkRow}>
              <View style={styles.checkIcon}>
                <Ionicons name="checkmark-circle" size={22} color={Colors.success} />
              </View>
              <Text style={styles.checkLabel}>{item}</Text>
            </View>
          ))}
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(700).duration(500).easing(Easing.out(Easing.cubic))} style={styles.bottom}>
          <Text style={styles.headline}>
            {name ? `You're all set, ${name}!` : "You're all set!"}
          </Text>
          <Text style={styles.sub}>Let's get started.</Text>
          <TouchableOpacity
            style={[styles.btn, saving && styles.btnDisabled]}
            onPress={handleStart}
            disabled={saving}
            activeOpacity={0.9}
          >
            {saving
              ? <ActivityIndicator color={Colors.primary} />
              : <Text style={styles.btnText}>Let's go</Text>
            }
          </TouchableOpacity>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#1A0A2E' },
  container: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 24,
    paddingBottom: 36,
    justifyContent: 'space-between',
  },
  topSection: { alignItems: 'center', paddingTop: 16 },
  successCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.success,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  middle: {
    gap: 16,
    paddingHorizontal: 8,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 14,
    padding: 16,
  },
  checkIcon: {},
  checkLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  bottom: { gap: 10 },
  headline: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 36,
    letterSpacing: -0.3,
  },
  sub: { fontSize: 15, color: 'rgba(255,255,255,0.5)', fontWeight: '500' },
  btn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 100,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 8,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: Colors.primary, fontSize: 17, fontWeight: '800' },
});
