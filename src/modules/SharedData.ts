// src/modules/SharedData.ts
import { requireNativeModule } from 'expo-modules-core';
import { getRankProgress } from '../utils/ranks';
import { getGoalCountdown } from '../utils/goal';
import type { SessionStats, PersonaData } from '../types';

const Native = requireNativeModule('MethodSharedData');

export type SharedSnapshot = {
  totalEarned: number;
  rankTitle: string;
  rankLevel: number;
  rankPercent: number;
  meritToNext: number;
  nextRankTitle: string;
  currentStreak: number;
  personaName: string;
  daysRemaining: number;
  weekActivity: boolean[]; // 7 elements, index 0 = 6 days ago, index 6 = today
};

export async function updateSharedData(snapshot: SharedSnapshot): Promise<void> {
  try {
    await Native.update(snapshot);
  } catch (_) {
    // silently skip if the native module isn't available (Expo Go, tests)
  }
}

export function buildSnapshot(
  stats: SessionStats,
  persona: PersonaData | null
): SharedSnapshot {
  const progress  = getRankProgress(stats.totalEarned);
  const countdown = persona ? getGoalCountdown(persona) : null;
  const today     = new Date();

  const weekActivity = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    const key = d.toISOString().split('T')[0];
    return (stats.dailySessions[key] ?? 0) > 0;
  });

  return {
    totalEarned:   stats.totalEarned,
    rankTitle:     progress.current.title,
    rankLevel:     progress.current.level,
    rankPercent:   progress.percent,
    meritToNext:   progress.meritToNext,
    nextRankTitle: progress.next?.title ?? '',
    currentStreak: stats.currentStreak,
    personaName:   persona?.name ?? '',
    daysRemaining: countdown?.daysRemaining ?? 0,
    weekActivity,
  };
}
