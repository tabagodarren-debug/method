import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts, DMSans_400Regular, DMSans_500Medium, DMSans_600SemiBold, DMSans_700Bold } from '@expo-google-fonts/dm-sans';
import { RootStackParamList } from '../types';
import { CardStyleInterpolators } from '@react-navigation/stack';
import { Colors } from '../constants/colors';
import { OnboardingProvider } from '../context/OnboardingContext';
import { ThemeProvider } from '../context/ThemeContext';

import Onboarding1Hook    from '../screens/onboarding/Onboarding1Hook';
import Onboarding2Name    from '../screens/onboarding/Onboarding2Name';
import Onboarding3Question from '../screens/onboarding/Onboarding3Question';
import Onboarding4AllSet  from '../screens/onboarding/Onboarding4AllSet';
import TabNavigator       from './TabNavigator';

const Stack = createStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const [initialRoute, setInitialRoute] = useState<'Onboarding1' | 'MainTabs' | null>(null);
  const [fontsLoaded] = useFonts({ DMSans_400Regular, DMSans_500Medium, DMSans_600SemiBold, DMSans_700Bold });

  useEffect(() => {
    AsyncStorage.getItem('@app/onboarded')
      .then(v => setInitialRoute(v === 'true' ? 'MainTabs' : 'Onboarding1'))
      .catch(() => setInitialRoute('Onboarding1'));
  }, []);

  if (!fontsLoaded || !initialRoute) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={Colors.primaryMid} />
      </View>
    );
  }

  return (
    <ThemeProvider>
    <NavigationContainer>
      <OnboardingProvider>
        <Stack.Navigator
          initialRouteName={initialRoute}
          screenOptions={{
            headerShown: false,
            cardStyle: { backgroundColor: Colors.gradientDark },
            cardStyleInterpolator: ({ current }) => ({
              cardStyle: {
                opacity: current.progress,
                transform: [{
                  scale: current.progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.97, 1],
                  }),
                }],
              },
              overlayStyle: {
                opacity: current.progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 0.15],
                }),
              },
            }),
          }}
        >
          <Stack.Screen name="Onboarding1" component={Onboarding1Hook} />
          <Stack.Screen name="Onboarding2" component={Onboarding2Name} />
          <Stack.Screen name="Onboarding3" component={Onboarding3Question} />
          <Stack.Screen name="Onboarding4" component={Onboarding4AllSet} />
          <Stack.Screen
            name="MainTabs"
            component={TabNavigator}
            options={{ cardStyleInterpolator: CardStyleInterpolators.forNoAnimation }}
          />
        </Stack.Navigator>
      </OnboardingProvider>
    </NavigationContainer>
    </ThemeProvider>
  );
}
