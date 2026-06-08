import { resolveAffirmation, getRandomAffirmation, TEMPLATE_POOL } from '../../src/utils/affirmations';
import type { PersonaData } from '../../src/types';

const persona: PersonaData = {
  name: 'Darren',
  goal: '$10k/month',
  timeline: '1yr',
};

it('resolveAffirmation replaces [name] token', () => {
  const result = resolveAffirmation('[name] clocked in.', persona);
  expect(result).toBe('Darren clocked in.');
});

it('resolveAffirmation replaces [goal] token', () => {
  const result = resolveAffirmation('Every session is one step toward [goal].', persona);
  expect(result).toBe('Every session is one step toward $10k/month.');
});

it('resolveAffirmation replaces both tokens', () => {
  const result = resolveAffirmation('[name] is building [goal].', persona);
  expect(result).toBe('Darren is building $10k/month.');
});

it('TEMPLATE_POOL has at least 15 templates', () => {
  expect(TEMPLATE_POOL.length).toBeGreaterThanOrEqual(15);
});

it('getRandomAffirmation returns a resolved non-empty string', () => {
  const result = getRandomAffirmation(persona);
  expect(typeof result).toBe('string');
  expect(result.length).toBeGreaterThan(0);
});
