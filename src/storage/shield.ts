import AsyncStorage from '@react-native-async-storage/async-storage';

const SHIELD_KEY = '@method/shield';

export type ShieldState = {
  available: boolean;
  usedAt: string | null;    // YYYY-MM-DD
  refillAt: string | null;  // YYYY-MM-DD (usedAt + 7 days)
};

const DEFAULT_SHIELD: ShieldState = { available: true, usedAt: null, refillAt: null };

export const loadShield = async (): Promise<ShieldState> => {
  const raw = await AsyncStorage.getItem(SHIELD_KEY);
  if (!raw) return { ...DEFAULT_SHIELD };
  try {
    return { ...DEFAULT_SHIELD, ...(JSON.parse(raw) as Partial<ShieldState>) };
  } catch {
    return { ...DEFAULT_SHIELD };
  }
};

const saveShield = async (s: ShieldState): Promise<void> => {
  await AsyncStorage.setItem(SHIELD_KEY, JSON.stringify(s));
};

// Check if shield should refill; returns updated state
export const checkShieldRefill = async (): Promise<ShieldState> => {
  const shield = await loadShield();
  if (!shield.available && shield.refillAt) {
    const today = new Date().toISOString().slice(0, 10);
    if (today >= shield.refillAt) {
      const refilled: ShieldState = { available: true, usedAt: null, refillAt: null };
      await saveShield(refilled);
      return refilled;
    }
  }
  return shield;
};

export const consumeShield = async (): Promise<void> => {
  const today = new Date();
  const usedAt = today.toISOString().slice(0, 10);
  const refill = new Date(today);
  refill.setDate(refill.getDate() + 7);
  const refillAt = refill.toISOString().slice(0, 10);
  await saveShield({ available: false, usedAt, refillAt });
};

export const resetShield = async (): Promise<void> => {
  await saveShield({ ...DEFAULT_SHIELD });
};

// Days until shield refills (0 if available or overdue)
export const shieldDaysUntilRefill = (shield: ShieldState): number => {
  if (shield.available || !shield.refillAt) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const refill = new Date(shield.refillAt);
  const diff = Math.ceil((refill.getTime() - today.getTime()) / 86400000);
  return Math.max(0, diff);
};
