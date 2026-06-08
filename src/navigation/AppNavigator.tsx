import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { CardStyleInterpolators } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { isOnboarded } from '../storage/persona';
import { Colors } from '../constants/colors';
import BottomNav from '../components/BottomNav';
import type { RootStackParamList, MainTabParamList } from '../types';

import OnboardingNavigator from '../screens/onboarding/OnboardingNavigator';
import HomeScreen from '../screens/HomeScreen';
import StatsScreen from '../screens/StatsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import FocusSessionScreen from '../screens/FocusSessionScreen';
import SessionCompleteScreen from '../screens/SessionCompleteScreen';
import BreakScreen from '../screens/BreakScreen';

const Root = createStackNavigator<RootStackParamList>();
const Tab  = createBottomTabNavigator<MainTabParamList>();

function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={props => <BottomNav {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="HomeTab"     component={HomeScreen} />
      <Tab.Screen name="StatsTab"    component={StatsScreen} />
      <Tab.Screen name="SettingsTab" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const [initialRoute, setInitialRoute] = useState<'Onboarding' | 'Main' | null>(null);

  useEffect(() => {
    isOnboarded()
      .then(done => setInitialRoute(done ? 'Main' : 'Onboarding'))
      .catch(() => setInitialRoute('Onboarding'));
  }, []);

  if (!initialRoute) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={Colors.primaryText} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Root.Navigator
        initialRouteName={initialRoute}
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: Colors.background },
        }}
      >
        <Root.Screen name="Onboarding"      component={OnboardingNavigator} />
        <Root.Screen
          name="Main"
          component={MainTabs}
          options={{ cardStyleInterpolator: CardStyleInterpolators.forNoAnimation }}
        />
        <Root.Screen
          name="FocusSession"
          component={FocusSessionScreen}
          options={{ cardStyleInterpolator: CardStyleInterpolators.forVerticalIOS }}
        />
        <Root.Screen
          name="SessionComplete"
          component={SessionCompleteScreen}
          options={{ cardStyleInterpolator: CardStyleInterpolators.forFadeFromBottomAndroid }}
        />
        <Root.Screen
          name="Break"
          component={BreakScreen}
          options={{ cardStyleInterpolator: CardStyleInterpolators.forFadeFromBottomAndroid }}
        />
      </Root.Navigator>
    </NavigationContainer>
  );
}
