import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import Animated, { FadeIn } from 'react-native-reanimated';
import { RootStackParamList } from '../../types';
import { capture } from '../../services/analytics';

type Props = StackScreenProps<RootStackParamList, 'Onboarding1'>;

export default function Onboarding1Hook({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Animated.View entering={FadeIn.delay(200).duration(500)} style={styles.quoteBlock}>
          <Text style={styles.quote}>{'Welcome to\nAppName.'}</Text>
          <Text style={[styles.quote, styles.quotePause]}>{'The app built\nfor you.'}</Text>
          <Text style={[styles.quote, styles.quoteKicker]}>{'Let\'s get\nstarted.'}</Text>
        </Animated.View>

        <Animated.View entering={FadeIn.delay(900).duration(600)} style={styles.ctaArea}>
          <TouchableOpacity
            onPress={() => { capture('onboarding_step', { step: 1 }); navigation.navigate('Onboarding2'); }}
            activeOpacity={0.7}
          >
            <Text style={styles.ctaText}>Tap to continue</Text>
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
    paddingHorizontal: 36,
    justifyContent: 'space-between',
    paddingVertical: 48,
  },
  quoteBlock: { flex: 1, justifyContent: 'center', gap: 20 },
  quote: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 46,
    letterSpacing: -0.5,
  },
  quotePause: { color: 'rgba(255,255,255,0.5)' },
  quoteKicker: { color: '#C27FE8' },
  ctaArea: { alignItems: 'center', paddingBottom: 8 },
  ctaText: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.35)',
    fontWeight: '500',
    letterSpacing: 0.5,
  },
});
