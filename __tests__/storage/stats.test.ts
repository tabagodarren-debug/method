jest.mock('expo-modules-core', () => ({
  requireNativeModule: () => ({ update: jest.fn().mockResolvedValue(undefined) }),
}));

import { loadStats, recordSession, recordAbandon, ABANDON_PENALTY, DEFAULT_STATS } from '../../src/storage/stats';
import AsyncStorage from '@react-native-async-storage/async-storage';

beforeEach(() => AsyncStorage.clear());

it('loadStats returns defaults when nothing saved', async () => {
  const stats = await loadStats();
  expect(stats).toEqual(DEFAULT_STATS);
});

it('recordSession adds the earned amount and minutes', async () => {
  await recordSession('2026-06-08', 25, 25);
  const stats = await loadStats();
  expect(stats.totalEarned).toBe(25);
  expect(stats.sessionsCompleted).toBe(1);
  expect(stats.totalMinutes).toBe(25);
});

it('recordSession on consecutive day extends streak', async () => {
  await recordSession('2026-06-07', 25, 25);
  await recordSession('2026-06-08', 25, 25);
  const stats = await loadStats();
  expect(stats.currentStreak).toBe(2);
  expect(stats.longestStreak).toBe(2);
});

it('recordSession on same day does not double-count streak', async () => {
  await recordSession('2026-06-08', 25, 25);
  await recordSession('2026-06-08', 25, 25);
  const stats = await loadStats();
  expect(stats.currentStreak).toBe(1);
  expect(stats.sessionsCompleted).toBe(2);
});

it('recordSession after gap resets streak to 1', async () => {
  await recordSession('2026-06-01', 25, 25);
  await recordSession('2026-06-08', 25, 25);
  const stats = await loadStats();
  expect(stats.currentStreak).toBe(1);
});

it('recordAbandon applies the discipline tax and counts the abandon', async () => {
  await recordSession('2026-06-08', 100, 60);
  await recordAbandon();
  const stats = await loadStats();
  expect(stats.sessionsAbandoned).toBe(1);
  expect(stats.totalEarned).toBe(100 - ABANDON_PENALTY);
});

it('recordAbandon never drives the balance below zero', async () => {
  await recordAbandon();
  const stats = await loadStats();
  expect(stats.totalEarned).toBe(0);
  expect(stats.sessionsAbandoned).toBe(1);
});
