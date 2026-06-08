import { loadStats, recordSession, DEFAULT_STATS } from '../../src/storage/stats';
import AsyncStorage from '@react-native-async-storage/async-storage';

beforeEach(() => AsyncStorage.clear());

it('loadStats returns defaults when nothing saved', async () => {
  const stats = await loadStats();
  expect(stats).toEqual(DEFAULT_STATS);
});

it('recordSession increments totalEarned by 25', async () => {
  await recordSession('2026-06-08');
  const stats = await loadStats();
  expect(stats.totalEarned).toBe(25);
  expect(stats.sessionsCompleted).toBe(1);
  expect(stats.totalMinutes).toBe(25);
});

it('recordSession on consecutive day extends streak', async () => {
  await recordSession('2026-06-07');
  await recordSession('2026-06-08');
  const stats = await loadStats();
  expect(stats.currentStreak).toBe(2);
  expect(stats.longestStreak).toBe(2);
});

it('recordSession on same day does not double-count streak', async () => {
  await recordSession('2026-06-08');
  await recordSession('2026-06-08');
  const stats = await loadStats();
  expect(stats.currentStreak).toBe(1);
  expect(stats.sessionsCompleted).toBe(2);
});

it('recordSession after gap resets streak to 1', async () => {
  await recordSession('2026-06-01');
  await recordSession('2026-06-08');
  const stats = await loadStats();
  expect(stats.currentStreak).toBe(1);
});
