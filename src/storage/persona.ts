import AsyncStorage from '@react-native-async-storage/async-storage';
import type { PersonaData } from '../types';

const PERSONA_KEY = '@method/persona';
const ONBOARDED_KEY = '@method/onboarded';

export const savePersona = async (data: PersonaData): Promise<void> => {
  const withStart: PersonaData = {
    ...data,
    startDate: data.startDate ?? new Date().toISOString().split('T')[0],
  };
  await AsyncStorage.setItem(PERSONA_KEY, JSON.stringify(withStart));
};

export const loadPersona = async (): Promise<PersonaData | null> => {
  const raw = await AsyncStorage.getItem(PERSONA_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as PersonaData;
    if (!parsed.startDate) {
      parsed.startDate = new Date().toISOString().split('T')[0];
      await AsyncStorage.setItem(PERSONA_KEY, JSON.stringify(parsed));
    }
    return parsed;
  } catch {
    return null;
  }
};

export const clearPersona = async (): Promise<void> => {
  await AsyncStorage.removeItem(PERSONA_KEY);
};

export const isOnboarded = async (): Promise<boolean> => {
  const raw = await AsyncStorage.getItem(ONBOARDED_KEY);
  return raw === 'true';
};

export const setOnboarded = async (): Promise<void> => {
  await AsyncStorage.setItem(ONBOARDED_KEY, 'true');
};
