import type { PersonaData } from '../types';

export const TEMPLATE_POOL: string[] = [
  "[name] doesn't quit this early.",
  "Every session gets [name] closer to [goal].",
  "Stay locked in. [name] is watching.",
  "The version of you that made it never stopped here.",
  "[name] built it one session at a time.",
  "This is what [goal] costs. Keep going.",
  "You don't feel like it. [name] does it anyway.",
  "[name] clocked in. Don't let them down.",
  "Right now, [name] is ahead.",
  "The goal doesn't care how you feel.",
  "[name] doesn't check the phone right now.",
  "Focus is the price. [goal] is the reward.",
  "One session at a time. [name] knows this.",
  "This is the work. [name] does the work.",
  "The clock is running. [name] is building.",
  "No shortcuts. [name] earns every dollar.",
  "Eyes on [goal]. Nothing else.",
  "You started. [name] finishes.",
  "This session is non-negotiable.",
  "[name] at the end of this timer is worth it.",
];

// Rank-tiered pools — the voice sharpens as you climb the ladder.
const TIER_RAW: string[] = [
  "Nobody's coming. [name] gets up anyway.",
  "Broke is temporary. Quitting is forever.",
  "[name] is hungry. Stay hungry.",
  "You want [goal]? Earn it right now.",
  "Every dollar starts with one session.",
  "Grind in silence. Let [goal] make the noise.",
  "[name] doesn't wait to feel ready.",
  "This is the bottom. The only way is work.",
  "Prove it. [name] is built different.",
  "No one believes you yet. Use that.",
];

const TIER_SHARP: string[] = [
  "[name] doesn't chase. [name] attracts.",
  "Discipline is the difference now.",
  "You've done this before. Do it again.",
  "Momentum is yours. Don't break it.",
  "[name] operates while others hesitate.",
  "[goal] is closer than it's ever been.",
  "Sharpen the edge. One session at a time.",
  "Consistency built this. Consistency keeps it.",
  "[name] shows up when it's boring.",
  "The work compounds. So does [name].",
];

const TIER_COMMAND: string[] = [
  "[name] sets the standard now.",
  "You don't compete. You build empires.",
  "Pressure is a privilege. [name] earned it.",
  "Lead the work. The work follows.",
  "[name] moves with intention, not urgency.",
  "[goal] was never the ceiling.",
  "Few make it here. [name] is one of them.",
  "Command the hour. Own the outcome.",
  "[name] doesn't react. [name] decides.",
  "This is mastery. Keep refining.",
];

const TIER_LEGACY: string[] = [
  "[name] builds what outlasts [name].",
  "The grind became the life. Honor it.",
  "You are who you said you'd become.",
  "[goal] was just the beginning of the legend.",
  "[name] does this for the ones still watching.",
  "Stillness and power. [name] holds both.",
  "Legacy is built in quiet hours like this.",
  "[name] has nothing to prove and everything to build.",
  "The work is the reward now.",
  "Become the proof that it was possible.",
];

function poolForRank(level: number): string[] {
  if (level <= 3) return TIER_RAW;
  if (level <= 6) return TIER_SHARP;
  if (level <= 8) return TIER_COMMAND;
  return TIER_LEGACY;
}

export function resolveAffirmation(template: string, persona: PersonaData): string {
  return template
    .replace(/\[name\]/g, persona.name)
    .replace(/\[goal\]/g, persona.goal);
}

export function getRandomAffirmation(persona: PersonaData): string {
  const template = TEMPLATE_POOL[Math.floor(Math.random() * TEMPLATE_POOL.length)];
  return resolveAffirmation(template, persona);
}

export function getRankAffirmation(persona: PersonaData, rankLevel: number): string {
  const pool = poolForRank(rankLevel);
  const template = pool[Math.floor(Math.random() * pool.length)];
  return resolveAffirmation(template, persona);
}

export function getNextAffirmation(current: string, persona: PersonaData): string {
  const resolved = TEMPLATE_POOL.map(t => resolveAffirmation(t, persona));
  const others = resolved.filter(a => a !== current);
  return others[Math.floor(Math.random() * others.length)];
}
