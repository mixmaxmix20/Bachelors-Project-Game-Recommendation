export const releaseYearBounds = { min: 1990, max: 2026 } as const;
export const gameLengthBounds = { min: 1, max: 400 } as const;

export type PreferenceRange = [min: number, max: number];

export function normalizePreferenceRange(
  start: unknown,
  end: unknown,
  bounds: { min: number; max: number },
): PreferenceRange {
  function normalizeEndpoint(value: unknown, fallback: number) {
    if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
    return Math.min(bounds.max, Math.max(bounds.min, Math.round(value)));
  }

  const min = normalizeEndpoint(start, bounds.min);
  const max = normalizeEndpoint(end, bounds.max);
  return [Math.min(min, max), Math.max(min, max)];
}
