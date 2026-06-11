import type { PersonaData, Timeline } from '../types';

const TIMELINE_DAYS: Record<Timeline, number> = {
  '6mo': 182,
  '1yr': 365,
  '2yr': 730,
  '5yr': 1825,
};

const MS_PER_DAY = 86400000;

export type GoalCountdown = {
  daysTotal: number;
  daysElapsed: number;
  daysRemaining: number;
  percent: number;
};

export function getGoalCountdown(persona: PersonaData): GoalCountdown {
  const daysTotal = TIMELINE_DAYS[persona.timeline] ?? 365;
  const start = persona.startDate ? new Date(persona.startDate) : new Date();
  const now = new Date();

  const daysElapsed = Math.max(0, Math.floor((now.getTime() - start.getTime()) / MS_PER_DAY));
  const daysRemaining = Math.max(0, daysTotal - daysElapsed);
  const percent = Math.max(0, Math.min(1, daysElapsed / daysTotal));

  return { daysTotal, daysElapsed, daysRemaining, percent };
}
