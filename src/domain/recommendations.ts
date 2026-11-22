import { matchesGamePlatforms, supportedPlatforms } from "./platforms.ts";
import type {
  InferredPreferences,
  RankedRecommendation,
  RecommendationCandidate,
  RecommendationCollectionEntry,
  RecommendationHistoryEntry,
  RecommendationSettings,
  UserProfilePreferences,
} from "../types/recommendation";

function splitString(value?: string): string[] {
  return (value || "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export const defaultRecommendationSettings: RecommendationSettings = {
  ratingWeight: 0.2,
  genreWeight: 0.5,
  criticRatingWeight: 0.5,
};

export function resolveRecommendationSettings(
  data?: Partial<RecommendationSettings>,
): RecommendationSettings {
  return {
    ratingWeight:
      data?.ratingWeight ?? defaultRecommendationSettings.ratingWeight,
    genreWeight: data?.genreWeight ?? defaultRecommendationSettings.genreWeight,
    criticRatingWeight:
      data?.criticRatingWeight ??
      defaultRecommendationSettings.criticRatingWeight,
  };
}

export function isStarRating(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 1 &&
    value <= 5
  );
}

export function isPositiveTime(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

export function expectedPlaytime(
  time: number | null | undefined,
  ratio: number | null,
): number | null {
  return isPositiveTime(time) ? time * (ratio ?? 1) : null;
}

export function inferPreferences(
  history: readonly RecommendationHistoryEntry[],
): InferredPreferences {
  const genreWeights: Record<string, number> = {};
  const themeWeights: Record<string, number> = {};
  let totalWeight = 0;
  let ratedGamesCount = 0;
  const ratios: number[] = [];

  for (const entry of history) {
    if (isPositiveTime(entry.playtime) && isPositiveTime(entry.time)) {
      ratios.push(entry.playtime / entry.time);
    }

    if (!isStarRating(entry.starRating)) continue;
    const genres = splitString(entry.genres).filter((genre) => genre !== "-");
    const themes = splitString(entry.themes).filter((theme) => theme !== "-");
    if (!genres.length && !themes.length) continue;

    ratedGamesCount++;
    const weight = (entry.starRating - 1) / 4;
    totalWeight += weight;

    for (const genre of genres) {
      genreWeights[genre] = (genreWeights[genre] || 0) + weight;
    }

    for (const theme of themes) {
      themeWeights[theme] = (themeWeights[theme] || 0) + weight;
    }
  }

  if (totalWeight > 0) {
    for (const genre of Object.keys(genreWeights)) {
      genreWeights[genre] /= totalWeight;
    }
    for (const theme of Object.keys(themeWeights)) {
      themeWeights[theme] /= totalWeight;
    }
  }

  if (!ratios.length) {
    return {
      genreWeights,
      themeWeights,
      ratedGamesCount,
      timePreference: null,
      avgPlaytimeRatio: null,
    };
  }

  const avgPlaytimeRatio =
    ratios.reduce((sum, ratio) => sum + ratio, 0) / ratios.length;
  const variance =
    ratios.reduce((sum, ratio) => sum + (ratio - avgPlaytimeRatio) ** 2, 0) /
    ratios.length;
  const threshold = 0.5 * Math.sqrt(variance);
  const deviation = avgPlaytimeRatio - 1;
  const timePreference =
    deviation < -threshold
      ? "short"
      : deviation > threshold
        ? "long"
        : "medium";
  return {
    genreWeights,
    themeWeights,
    ratedGamesCount,
    timePreference,
    avgPlaytimeRatio,
  };
}

function calculateTimeEngagement(
  game: RecommendationCandidate,
  prefs: InferredPreferences,
  profile: UserProfilePreferences,
): number {
  const hours = expectedPlaytime(game.time, prefs.avgPlaytimeRatio);
  if (hours === null) return 0;

  let rangeMatch;
  if (hours >= profile.minTime && hours <= profile.maxTime) {
    rangeMatch = 1;
  } else {
    const distance =
      hours < profile.minTime
        ? profile.minTime - hours
        : hours - profile.maxTime;
    const penalty = 1 - Math.exp(-0.2 * Math.max(0, distance - 5));
    rangeMatch = Math.max(0, 1 - penalty);
  }

  let preferenceBonus = 0;
  if (prefs.timePreference === "long" && hours >= 50) {
    preferenceBonus = 1;
  } else if (prefs.timePreference === "medium" && hours > 15 && hours < 50) {
    preferenceBonus = 1;
  } else if (prefs.timePreference === "short" && hours <= 15) {
    preferenceBonus = 1;
  }

  return rangeMatch * 0.8 + preferenceBonus * 0.4;
}

function calculateGameScore(
  game: RecommendationCandidate,
  prefs: InferredPreferences,
  profile: UserProfilePreferences,
  settings: RecommendationSettings,
): number {
  const { ratingWeight, genreWeight, criticRatingWeight } = settings;
  const personalizationWeight = 1 - ratingWeight;
  const themeWeight = 1 - genreWeight;
  const userRatingWeight = 1 - criticRatingWeight;

  const normalizedRating = Number(game.rating) / 100;
  const normalizedUserRating = game.globalRating / 5;
  const combinedRating =
    normalizedRating * criticRatingWeight +
    normalizedUserRating * userRatingWeight;
  const popularityScore = combinedRating * ratingWeight;

  let personalizationScore = 0;
  if (prefs.ratedGamesCount > 0) {
    let genreScore = 0;
    let themeScore = 0;

    for (const genre of splitString(game.genres)) {
      genreScore += prefs.genreWeights[genre] || 0;
    }
    for (const theme of splitString(game.themes)) {
      themeScore += prefs.themeWeights[theme] || 0;
    }

    const rawScore = genreScore * genreWeight + themeScore * themeWeight;
    personalizationScore = rawScore * personalizationWeight;
  }

  const totalScore = popularityScore + personalizationScore;
  const timeEngagementScore = calculateTimeEngagement(game, prefs, profile);

  return totalScore * 0.7 + timeEngagementScore * 0.3;
}

export function rankRecommendations(
  candidates: readonly RecommendationCandidate[],
  collection: readonly RecommendationCollectionEntry[],
  profile: UserProfilePreferences,
  prefs: InferredPreferences,
  settings: RecommendationSettings,
): RankedRecommendation[] {
  const supported = supportedPlatforms(profile.platforms);
  const ownedIds = new Set(collection.map((entry) => entry.id));
  return candidates
    .filter((game) => !ownedIds.has(game.id.toString()))
    .map((game) => ({
      ...game,
      score: calculateGameScore(game, prefs, profile, settings),
    }))
    .filter((game) => {
      const matchesYear =
        game.releaseDate >= profile.minYear &&
        game.releaseDate <= profile.maxYear;
      const matchesPlatform =
        supported.size === 0 || matchesGamePlatforms(supported, game.platforms);
      const genres = splitString(game.genres);
      const themes = splitString(game.themes);
      const matchesGenre =
        profile.genres.length === 0 ||
        profile.genres.some((genre) => genres.includes(genre));
      const matchesTheme =
        profile.themes.length === 0 ||
        themes.includes("-") ||
        profile.themes.some((theme) => themes.includes(theme));
      return matchesYear && matchesPlatform && matchesGenre && matchesTheme;
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
}
