// src/modules/LiveActivity.ts
import { Platform } from 'react-native';
import { requireNativeModule } from 'expo-modules-core';

const isSupported = Platform.OS === 'ios';
let Native: any = null;
if (isSupported) {
  try { Native = requireNativeModule('MethodLiveActivity'); } catch (_) {}
}

export async function startLiveActivity(params: {
  personaName: string;
  rankTitle: string;
  intervalMinutes: number;
  projectedMerit: number;
}): Promise<void> {
  if (!isSupported || !Native) return;
  try { await Native.start(params); } catch (_) {}
}

export async function updateLiveActivity(timeRemaining: number): Promise<void> {
  if (!isSupported || !Native) return;
  try { await Native.update(timeRemaining); } catch (_) {}
}

export async function endLiveActivity(earnedMerit: number): Promise<void> {
  if (!isSupported || !Native) return;
  try { await Native.end(earnedMerit); } catch (_) {}
}
