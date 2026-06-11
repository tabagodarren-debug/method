import { savePersona, loadPersona, clearPersona, isOnboarded, setOnboarded } from '../../src/storage/persona';
import AsyncStorage from '@react-native-async-storage/async-storage';

beforeEach(() => AsyncStorage.clear());

it('loadPersona returns null when nothing saved', async () => {
  const result = await loadPersona();
  expect(result).toBeNull();
});

it('savePersona and loadPersona round-trip', async () => {
  const persona = { name: 'Darren', goal: '$10k/month', timeline: '1yr' as const };
  await savePersona(persona);
  const loaded = await loadPersona();
  expect(loaded).toMatchObject(persona);
});

it('savePersona stamps a startDate for the goal countdown', async () => {
  const persona = { name: 'Darren', goal: '$10k/month', timeline: '1yr' as const };
  await savePersona(persona);
  const loaded = await loadPersona();
  expect(loaded?.startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
});

it('isOnboarded returns false initially', async () => {
  expect(await isOnboarded()).toBe(false);
});

it('setOnboarded makes isOnboarded return true', async () => {
  await setOnboarded();
  expect(await isOnboarded()).toBe(true);
});
