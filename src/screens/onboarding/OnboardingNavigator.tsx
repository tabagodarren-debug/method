import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { CardStyleInterpolators } from '@react-navigation/stack';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { Colors } from '../../constants/colors';
import { savePersona, setOnboarded } from '../../storage/persona';
import type { OnboardingStackParamList, RootStackParamList, Timeline } from '../../types';
import OnboardingStep1 from './OnboardingStep1';
import OnboardingStep2 from './OnboardingStep2';
import OnboardingStep3 from './OnboardingStep3';

const Stack = createStackNavigator<OnboardingStackParamList>();

function Step1Wrapper() {
  const nav = useNavigation<StackNavigationProp<OnboardingStackParamList, 'Step1'>>();
  return <OnboardingStep1 onContinue={name => nav.navigate('Step2', { name })} />;
}

function Step2Wrapper() {
  const nav = useNavigation<StackNavigationProp<OnboardingStackParamList, 'Step2'>>();
  return (
    <OnboardingStep2
      onContinue={goal => {
        const params = nav.getState().routes[nav.getState().index].params as { name: string };
        nav.navigate('Step3', { name: params.name, goal });
      }}
    />
  );
}

function Step3Wrapper() {
  const nav = useNavigation<StackNavigationProp<OnboardingStackParamList, 'Step3'>>();
  const rootNav = nav.getParent<StackNavigationProp<RootStackParamList>>();

  const handleComplete = async (timeline: Timeline) => {
    const params = nav.getState().routes[nav.getState().index].params as { name: string; goal: string };
    await savePersona({ name: params.name, goal: params.goal, timeline });
    await setOnboarded();
    rootNav?.reset({ index: 0, routes: [{ name: 'Main' }] });
  };

  return <OnboardingStep3 onComplete={handleComplete} />;
}

export default function OnboardingNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: Colors.background },
        cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
      }}
    >
      <Stack.Screen name="Step1" component={Step1Wrapper} />
      <Stack.Screen name="Step2" component={Step2Wrapper} />
      <Stack.Screen name="Step3" component={Step3Wrapper} />
    </Stack.Navigator>
  );
}
