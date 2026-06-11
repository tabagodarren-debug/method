// __tests__/modules/SharedData.test.ts
import { buildSnapshot } from '../../src/modules/SharedData';
import type { SessionStats, PersonaData } from '../../src/types';

// requireNativeModule is unavailable in jest; it's safe-caught inside updateSharedData
jest.mock('expo-modules-core', () => ({
  requireNativeModule: () => ({ update: jest.fn().mockResolvedValue(undefined) }),
}));

const baseStats: SessionStats = {
  totalEarned: 400,
  sessionsCompleted: 8,
  sessionsAbandoned: 1,
  currentStreak: 3,
  longestStreak: 5,
  lastSessionDate: '2026-06-11',
  totalMinutes: 200,
  dailySessions: {},
};

const persona: PersonaData = {
  name: 'Darren',
  goal: '$10k/month',
  timeline: '1yr',
  startDate: '2026-06-11',
};

it('buildSnapshot returns correct rank for 400 merit (The Builder)', () => {
  const snap = buildSnapshot(baseStats, persona);
  expect(snap.rankTitle).toBe('The Builder');
  expect(snap.rankLevel).toBe(3);
  expect(snap.personaName).toBe('Darren');
  expect(snap.currentStreak).toBe(3);
});

it('buildSnapshot nextRankTitle is The Operator at level 3', () => {
  const snap = buildSnapshot(baseStats, persona);
  expect(snap.nextRankTitle).toBe('The Operator');
  expect(snap.meritToNext).toBe(500); // 900 - 400
});

it('buildSnapshot weekActivity has 7 boolean entries', () => {
  const snap = buildSnapshot(baseStats, persona);
  expect(snap.weekActivity).toHaveLength(7);
  expect(snap.weekActivity.every(v => typeof v === 'boolean')).toBe(true);
});

it('buildSnapshot weekActivity reflects dailySessions', () => {
  const today = new Date().toISOString().split('T')[0];
  const stats = { ...baseStats, dailySessions: { [today]: 2 } };
  const snap = buildSnapshot(stats, persona);
  expect(snap.weekActivity[6]).toBe(true);  // today = index 6
  expect(snap.weekActivity[5]).toBe(false); // yesterday = no session
});

it('buildSnapshot gracefully handles null persona', () => {
  const snap = buildSnapshot(baseStats, null);
  expect(snap.personaName).toBe('');
  expect(snap.daysRemaining).toBe(0);
});

it('buildSnapshot returns empty nextRankTitle at max rank', () => {
  const snap = buildSnapshot({ ...baseStats, totalEarned: 25000 }, persona);
  expect(snap.nextRankTitle).toBe('');
  expect(snap.rankPercent).toBe(1);
});
