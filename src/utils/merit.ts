const PRESET_RANGES: Record<number, [number, number]> = {
  15: [10, 18],
  30: [25, 35],
  60: [55, 65],
};

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function calculateMerit(intervalMinutes: number): number {
  const range = PRESET_RANGES[intervalMinutes];
  if (range) return randInt(range[0], range[1]);
  // Custom interval: ~0.95 merit/min with ±8% variance
  const base = Math.round(intervalMinutes * 0.95);
  const variance = Math.max(1, Math.round(base * 0.08));
  return randInt(base - variance, base + variance);
}

export function meritRangeLabel(intervalMinutes: number): string {
  const range = PRESET_RANGES[intervalMinutes];
  if (range) return `${range[0]}–${range[1]} merit`;
  const base = Math.round(intervalMinutes * 0.95);
  const variance = Math.max(1, Math.round(base * 0.08));
  return `${base - variance}–${base + variance} merit`;
}
