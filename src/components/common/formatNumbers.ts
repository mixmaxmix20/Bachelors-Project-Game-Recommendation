export const hoursUnit = "godz.";

const numberFormatter = new Intl.NumberFormat("pl-PL", {
  maximumFractionDigits: 1,
});

const percentFormatter = new Intl.NumberFormat("pl-PL", {
  style: "percent",
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

export function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

export function formatHours(value: number): string {
  return `${formatNumber(value)}\u00a0${hoursUnit}`;
}

export function formatRelativeScore(score: number, maxScore: number): string {
  if (!Number.isFinite(score) || !Number.isFinite(maxScore) || maxScore <= 0) {
    return "Brak wyniku";
  }

  return percentFormatter.format(score / maxScore);
}
