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
  expect(loaded).toEqual(persona);
});

it('isOnboarded returns false initially', async () => {
  expect(await isOnboarded()).toBe(false);
});

it('setOnboarded makes isOnboarded return true', async () => {
  await setOnboarded();
  expect(await isOnboarded()).toBe(true);
});
