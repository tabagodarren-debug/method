import type { NavigatorScreenParams } from '@react-navigation/native';

export type Timeline = '6mo' | '1yr' | '2yr' | '5yr';

export type PersonaData = {
  name: string;
  goal: string;
  timeline: Timeline;
  startDate?: string;
};

export type SessionStats = {
  totalEarned: number;
  sessionsCompleted: number;
  sessionsAbandoned: number;
  currentStreak: number;
  longestStreak: number;
  lastSessionDate: string;
  totalMinutes: number;
  dailySessions: Record<string, number>;
};

export type OnboardingStackParamList = {
  Step1: undefined;
  Step2: { name: string };
  Step3: { name: string; goal: string };
};

export type MainTabParamList = {
  HomeTab: undefined;
  StatsTab: undefined;
  SettingsTab: undefined;
};

export type RootStackParamList = {
  Onboarding: undefined;
  Main: undefined;
  FocusSession: undefined;
  SessionComplete: { earnedThisSession: number; intervalMinutes: number };
  Break: undefined;
};
