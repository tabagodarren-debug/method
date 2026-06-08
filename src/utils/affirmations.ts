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

export function resolveAffirmation(template: string, persona: PersonaData): string {
  return template
    .replace(/\[name\]/g, persona.name)
    .replace(/\[goal\]/g, persona.goal);
}

export function getRandomAffirmation(persona: PersonaData): string {
  const template = TEMPLATE_POOL[Math.floor(Math.random() * TEMPLATE_POOL.length)];
  return resolveAffirmation(template, persona);
}

export function getNextAffirmation(current: string, persona: PersonaData): string {
  const resolved = TEMPLATE_POOL.map(t => resolveAffirmation(t, persona));
  const others = resolved.filter(a => a !== current);
  return others[Math.floor(Math.random() * others.length)];
}
