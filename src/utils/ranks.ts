export type Rank = {
  level: number;
  title: string;
  threshold: number;
};

export const RANKS: Rank[] = [
  { level: 1,  title: 'The Broke One', threshold: 0 },
  { level: 2,  title: 'The Hustler',   threshold: 150 },
  { level: 3,  title: 'The Builder',   threshold: 400 },
  { level: 4,  title: 'The Operator',  threshold: 900 },
  { level: 5,  title: 'The Earner',    threshold: 1800 },
  { level: 6,  title: 'The Closer',    threshold: 3200 },
  { level: 7,  title: 'The Executive', threshold: 5500 },
  { level: 8,  title: 'The Mogul',     threshold: 9000 },
  { level: 9,  title: 'The Visionary', threshold: 15000 },
  { level: 10, title: 'The Legacy',    threshold: 25000 },
];

export function getRank(totalMerit: number): Rank {
  let current = RANKS[0];
  for (const rank of RANKS) {
    if (totalMerit >= rank.threshold) current = rank;
    else break;
  }
  return current;
}

export function getNextRank(totalMerit: number): Rank | null {
  const current = getRank(totalMerit);
  return RANKS.find(r => r.level === current.level + 1) ?? null;
}

export type RankProgress = {
  current: Rank;
  next: Rank | null;
  meritIntoTier: number;
  meritForTier: number;
  meritToNext: number;
  percent: number;
  isMax: boolean;
};

export function getRankProgress(totalMerit: number): RankProgress {
  const current = getRank(totalMerit);
  const next = getNextRank(totalMerit);

  if (!next) {
    return {
      current,
      next: null,
      meritIntoTier: totalMerit - current.threshold,
      meritForTier: 0,
      meritToNext: 0,
      percent: 1,
      isMax: true,
    };
  }

  const meritForTier = next.threshold - current.threshold;
  const meritIntoTier = totalMerit - current.threshold;
  const meritToNext = next.threshold - totalMerit;

  return {
    current,
    next,
    meritIntoTier,
    meritForTier,
    meritToNext,
    percent: Math.max(0, Math.min(1, meritIntoTier / meritForTier)),
    isMax: false,
  };
}

export function didRankUp(prevTotal: number, newTotal: number): Rank | null {
  const prev = getRank(prevTotal);
  const next = getRank(newTotal);
  return next.level > prev.level ? next : null;
}
