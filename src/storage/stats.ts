import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SessionStats } from '../types';
import { updateSharedData, buildSnapshot } from '../modules/SharedData';
import { loadPersona } from './persona';

const STATS_KEY = '@method/stats';

export const ABANDON_PENALTY = 10;

export const DEFAULT_STATS: SessionStats = {
  totalEarned: 0,
  sessionsCompleted: 0,
  sessionsAbandoned: 0,
  currentStreak: 0,
  longestStreak: 0,
  lastSessionDate: '',
  totalMinutes: 0,
  dailySessions: {},
  dailyEarned: {},
  dailyLost: {},
};

export const loadStats = async (): Promise<SessionStats> => {
  const raw = await AsyncStorage.getItem(STATS_KEY);
  if (!raw) return { ...DEFAULT_STATS };
  try {
    return { ...DEFAULT_STATS, ...(JSON.parse(raw) as Partial<SessionStats>) };
  } catch {
    return { ...DEFAULT_STATS };
  }
};

const saveStats = async (stats: SessionStats): Promise<void> => {
  await AsyncStorage.setItem(STATS_KEY, JSON.stringify(stats));
};

export const recordSession = async (dateStr: string, earnedAmount: number, intervalMinutes: number): Promise<SessionStats> => {
  const stats = await loadStats();

  stats.totalEarned += earnedAmount;
  stats.sessionsCompleted += 1;
  stats.totalMinutes += intervalMinutes;
  stats.dailySessions = stats.dailySessions ?? {};
  stats.dailySessions[dateStr] = (stats.dailySessions[dateStr] ?? 0) + 1;
  stats.dailyEarned = stats.dailyEarned ?? {};
  stats.dailyEarned[dateStr] = (stats.dailyEarned[dateStr] ?? 0) + earnedAmount;

  if (stats.lastSessionDate !== dateStr) {
    const isConsecutive = isYesterday(stats.lastSessionDate, dateStr);
    stats.currentStreak = isConsecutive ? stats.currentStreak + 1 : 1;
    stats.longestStreak = Math.max(stats.longestStreak, stats.currentStreak);
    stats.lastSessionDate = dateStr;
  }

  await saveStats(stats);
  const persona = await loadPersona();
  updateSharedData(buildSnapshot(stats, persona)).catch(() => {});
  return stats;
};

export const resetStats = async (): Promise<void> => {
  await AsyncStorage.setItem(STATS_KEY, JSON.stringify({ ...DEFAULT_STATS }));
};

export const recordAbandon = async (): Promise<SessionStats> => {
  const stats = await loadStats();
  const today = new Date().toISOString().slice(0, 10);
  stats.sessionsAbandoned += 1;
  stats.totalEarned = Math.max(0, stats.totalEarned - ABANDON_PENALTY);
  stats.dailyLost = stats.dailyLost ?? {};
  stats.dailyLost[today] = (stats.dailyLost[today] ?? 0) + ABANDON_PENALTY;
  await saveStats(stats);
  const persona = await loadPersona();
  updateSharedData(buildSnapshot(stats, persona)).catch(() => {});
  return stats;
};

function isYesterday(prevDate: string, today: string): boolean {
  if (!prevDate) return false;
  const prev = new Date(prevDate);
  const curr = new Date(today);
  const diff = curr.getTime() - prev.getTime();
  return diff === 86400000;
}
