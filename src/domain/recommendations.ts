import { matchesGamePlatforms, supportedPlatforms } from "./platforms.ts";
import type {
  InferredPreferences,
  RankedRecommendation,
  RecommendationCandidate,
  RecommendationCollectionEntry,
  RecommendationSettings,
  UserProfilePreferences,
} from "../types/recommendation";

function splitString(value?: string): string[] {
  return (value || "").split(",").map((entry) => entry.trim()).filter(Boolean);
}

export function inferPreferences(
  collection: readonly RecommendationCollectionEntry[],
  candidates: readonly RecommendationCandidate[]
): InferredPreferences {
  const genreWeights: Record<string, number> = {};
  const themeWeights: Record<string, number> = {};
  let totalWeight = 0;
  const ratios: number[] = [];

  for (const entry of collection) {
    const game = candidates.find((candidate) => candidate.id.toString() === entry.id);
    if (!game || !entry.playtime) continue;

    ratios.push(entry.playtime / Number(game.time));

    // Preserve the distinction between a missing rating and an explicit zero.
    const weight = (Number(entry.starRating) - 1) / 4;
    totalWeight += weight;

    for (const genre of splitString(game.genres)) {
      genreWeights[genre] = (genreWeights[genre] || 0) + weight;
    }

    for (const theme of splitString(game.themes)) {
      themeWeights[theme] = (themeWeights[theme] || 0) + weight;
    }
  }

  const avgPlaytimeRatio = ratios.reduce((sum, ratio) => sum + ratio, 0) / ratios.length;
  const variance =
    ratios.reduce((sum, ratio) => sum + (ratio - avgPlaytimeRatio) ** 2, 0) / ratios.length;
  const zScore = (avgPlaytimeRatio - 1.0) / Math.sqrt(variance);
  const timePreference = zScore < -0.5 ? "short" : zScore > 0.5 ? "long" : "medium";

  if (totalWeight > 0) {
    for (const genre of Object.keys(genreWeights)) {
      genreWeights[genre] /= totalWeight;
    }
    for (const theme of Object.keys(themeWeights)) {
      themeWeights[theme] /= totalWeight;
    }
  }

  return { genreWeights, themeWeights, timePreference, avgPlaytimeRatio };
}

function calculateTimeEngagement(
  game: RecommendationCandidate,
  prefs: InferredPreferences,
  profile: UserProfilePreferences
): number {
  const expectedPlaytime = Number(game.time) * prefs.avgPlaytimeRatio;

  let rangeMatch;
  if (expectedPlaytime >= profile.minTime && expectedPlaytime <= profile.maxTime) {
    rangeMatch = 1;
  } else {
    const distance =
      expectedPlaytime < profile.minTime
        ? profile.minTime - expectedPlaytime
        : expectedPlaytime - profile.maxTime;
    const penalty = 1 - Math.exp(-0.2 * Math.max(0, distance - 5));
    rangeMatch = Math.max(0, 1 - penalty);
  }

  let preferenceBonus = 0;
  if (prefs.timePreference === "long" && expectedPlaytime >= 50) {
    preferenceBonus = 1;
  } else if (prefs.timePreference === "medium" && expectedPlaytime > 15 && expectedPlaytime < 50) {
    preferenceBonus = 1;
  } else if (prefs.timePreference === "short" && expectedPlaytime <= 15) {
    preferenceBonus = 1;
  }

  return rangeMatch * 0.8 + preferenceBonus * 0.4;
}

function calculateGameScore(
  game: RecommendationCandidate,
  prefs: InferredPreferences,
  ratedGamesCount: number,
  profile: UserProfilePreferences,
  settings: RecommendationSettings
): number {
  const { ratingWeight, genreWeight, criticRatingWeight } = settings;
  const personalizationWeight = 1 - ratingWeight;
  const themeWeight = 1 - genreWeight;
  const userRatingWeight = 1 - criticRatingWeight;

  const normalizedRating = Number(game.rating) / 100;
  const normalizedUserRating = game.globalRating / 5;
  const combinedRating =
    normalizedRating * criticRatingWeight + normalizedUserRating * userRatingWeight;
  const popularityScore = combinedRating * ratingWeight;

  let personalizationScore = 0;
  if (ratedGamesCount > 0) {
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
  settings: RecommendationSettings
): RankedRecommendation[] {
  const supported = supportedPlatforms(profile.platforms);
  return candidates
    .filter((game) => !collection.some((entry) => entry.id === game.id.toString()))
    .map((game) => ({
      ...game,
      score: calculateGameScore(game, prefs, collection.length, profile, settings),
    }))
    .filter((game) => {
      const matchesYear = game.releaseDate >= profile.minYear && game.releaseDate <= profile.maxYear;
      const matchesPlatform = matchesGamePlatforms(supported, game.platforms);
      const genres = splitString(game.genres);
      const themes = splitString(game.themes);
      const matchesGenre = profile.genres.some((genre) => genres.includes(genre));
      const matchesTheme = profile.themes.some((theme) => themes.includes(theme) || themes.includes("-"));
      return matchesYear && matchesPlatform && matchesGenre && matchesTheme;
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
}
