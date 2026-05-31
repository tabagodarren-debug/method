import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppSettings } from '../types';
import { parseJsonObject } from './json';

const SETTINGS_KEY = '@app/settings';
const IAP_KEY = '@app/unlocked';
const ONBOARDED_KEY = '@app/onboarded';
const ONBOARDING_DATA_KEY = '@app/onboarding_data';

const defaults: AppSettings = {
  reminderEnabled: false,
  reminderTime: '20:00',
};

export const getSettings = async (): Promise<AppSettings> => {
  const raw = await AsyncStorage.getItem(SETTINGS_KEY);
  return parseJsonObject<AppSettings>(raw, defaults);
};

export const saveSettings = async (settings: Partial<AppSettings>): Promise<void> => {
  const current = await getSettings();
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...current, ...settings }));
};

export const hasAppUnlock = async (): Promise<boolean> => {
  const raw = await AsyncStorage.getItem(IAP_KEY);
  return raw === 'true';
};

export const setAppUnlocked = async (): Promise<void> => {
  await AsyncStorage.setItem(IAP_KEY, 'true');
};

export const revokeAppUnlock = async (): Promise<void> => {
  await AsyncStorage.removeItem(IAP_KEY);
};

export const isOnboarded = async (): Promise<boolean> => {
  const raw = await AsyncStorage.getItem(ONBOARDED_KEY);
  return raw === 'true';
};

export const setOnboarded = async (): Promise<void> => {
  await AsyncStorage.setItem(ONBOARDED_KEY, 'true');
};

export const saveOnboardingData = async (data: { name: string }): Promise<void> => {
  await AsyncStorage.setItem(ONBOARDING_DATA_KEY, JSON.stringify(data));
};

export const getOnboardingData = async (): Promise<{ name: string }> => {
  const raw = await AsyncStorage.getItem(ONBOARDING_DATA_KEY);
  return parseJsonObject<{ name: string }>(raw, { name: '' });
};
