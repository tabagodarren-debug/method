import { getRank, getNextRank, getRankProgress, didRankUp } from '../../src/utils/ranks';

it('starts everyone at The Broke One', () => {
  expect(getRank(0).title).toBe('The Broke One');
  expect(getRank(149).title).toBe('The Broke One');
});

it('promotes at each threshold', () => {
  expect(getRank(150).title).toBe('The Hustler');
  expect(getRank(400).title).toBe('The Builder');
  expect(getRank(25000).title).toBe('The Legacy');
});

it('caps at the top rank', () => {
  expect(getRank(999999).title).toBe('The Legacy');
  expect(getNextRank(999999)).toBeNull();
});

it('reports progress within a tier', () => {
  const p = getRankProgress(275); // halfway between 150 and 400
  expect(p.current.title).toBe('The Hustler');
  expect(p.next?.title).toBe('The Builder');
  expect(p.meritToNext).toBe(125);
  expect(p.percent).toBeCloseTo(0.5, 1);
  expect(p.isMax).toBe(false);
});

it('flags max rank progress as full and complete', () => {
  const p = getRankProgress(25000);
  expect(p.isMax).toBe(true);
  expect(p.percent).toBe(1);
  expect(p.next).toBeNull();
});

it('detects a rank-up across a threshold', () => {
  expect(didRankUp(140, 160)?.title).toBe('The Hustler');
  expect(didRankUp(160, 200)).toBeNull();
});
