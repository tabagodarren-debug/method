import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';

import {
  TabParamList,
  HomeStackParamList,
  BrowseStackParamList,
  SettingsStackParamList,
} from '../types';
import CustomTabBar from '../components/CustomTabBar';

import HomeScreen from '../screens/HomeScreen';
import BrowseScreen from '../screens/BrowseScreen';
import SettingsScreen from '../screens/SettingsScreen';
import PrivacyPolicyScreen from '../screens/PrivacyPolicyScreen';

const Tab = createBottomTabNavigator<TabParamList>();
const HomeStack    = createStackNavigator<HomeStackParamList>();
const BrowseStack  = createStackNavigator<BrowseStackParamList>();
const SettingsStack = createStackNavigator<SettingsStackParamList>();

function HomeNavigator() {
  return (
    <HomeStack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyleInterpolator: ({ current }) => ({
          cardStyle: {
            opacity: current.progress,
            transform: [
              {
                scale: current.progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.96, 1],
                }),
              },
            ],
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
      <HomeStack.Screen name="Home" component={HomeScreen} />
    </HomeStack.Navigator>
  );
}

function BrowseNavigator() {
  return (
    <BrowseStack.Navigator screenOptions={{ headerShown: false }}>
      <BrowseStack.Screen name="Browse" component={BrowseScreen} />
    </BrowseStack.Navigator>
  );
}

function SettingsNavigator() {
  return (
    <SettingsStack.Navigator screenOptions={{ headerShown: false }}>
      <SettingsStack.Screen name="Settings" component={SettingsScreen} />
      <SettingsStack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
    </SettingsStack.Navigator>
  );
}

export default function TabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tab.Screen name="HomeTab"     component={HomeNavigator} />
      <Tab.Screen name="BrowseTab"   component={BrowseNavigator} />
      <Tab.Screen name="SettingsTab" component={SettingsNavigator} />
    </Tab.Navigator>
  );
}
