export const parseJson = <T>(raw: string | null, fallback: T): T => {
  if (!raw) return fallback;

  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

export const parseJsonArray = <T>(raw: string | null): T[] => {
  const parsed = parseJson<unknown>(raw, []);
  return Array.isArray(parsed) ? (parsed as T[]) : [];
};

export const parseJsonObject = <T extends object>(raw: string | null, fallback: T): T => {
  const parsed = parseJson<unknown>(raw, fallback);
  return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
    ? { ...fallback, ...(parsed as Partial<T>) }
    : fallback;
};
