import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AppNavigator from './src/navigation/AppNavigator';
import { initAudio } from './src/services/audio';

export default function App() {
  useEffect(() => {
    initAudio();
  }, []);

  return (
    <GestureHandlerRootView style={StyleSheet.absoluteFill}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <AppNavigator />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
