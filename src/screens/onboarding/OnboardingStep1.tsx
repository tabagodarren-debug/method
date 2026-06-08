import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, SafeAreaView,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import PillButton from '../../components/PillButton';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';

type Props = { onContinue: (name: string) => void };

export default function OnboardingStep1({ onContinue }: Props) {
  const [name, setName] = useState('');

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <View style={styles.top}>
          <Text style={styles.stepIndicator}>1 / 3</Text>
        </View>
        <View style={styles.content}>
          <Text style={styles.question}>{"What's your\nname?"}</Text>
          <View style={styles.inputWrap}>
            <BlurView intensity={28} tint="dark" style={StyleSheet.absoluteFill} />
            <View style={styles.inputOverlay} />
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              placeholderTextColor={Colors.fade}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={() => name.trim() && onContinue(name.trim())}
            />
          </View>
        </View>
        <View style={styles.bottom}>
          <PillButton
            label="Continue"
            onPress={() => name.trim() && onContinue(name.trim())}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: Colors.background },
  flex:          { flex: 1 },
  top:           { paddingTop: 8, paddingHorizontal: 28 },
  stepIndicator: { ...Typography.stepIndicator, color: Colors.fade },
  content:       { flex: 1, justifyContent: 'center', paddingHorizontal: 28 },
  question:      { ...Typography.onboardingQuestion, color: Colors.primaryText, marginBottom: 28 },
  inputWrap: {
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: Colors.glassBorder,
  },
  inputOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: Colors.glassBg },
  input: {
    ...Typography.statRowLabel,
    color: Colors.primaryText,
    paddingVertical: 17,
    paddingHorizontal: 20,
  },
  bottom: {
    alignItems: 'center',
    paddingBottom: 8,
    paddingHorizontal: 28,
  },
});
