export interface UserProfilePreferences {
  minTime: number;
  maxTime: number;
  minYear: number;
  maxYear: number;
  platforms: string[];
  genres: string[];
  themes: string[];
}

export interface InferredPreferences {
  genreWeights: Record<string, number>;
  themeWeights: Record<string, number>;
  timePreference: "short" | "medium" | "long";
  avgPlaytimeRatio: number;
}

export interface RecommendationSettings {
  ratingWeight: number;
  genreWeight: number;
  criticRatingWeight: number;
}

export interface RecommendationCollectionEntry {
  id: string | number;
  starRating?: number | null;
  playtime?: number | null;
}

export interface RecommendationCandidate {
  id: number;
  name: string;
  cover: string;
  platforms: string;
  description: string;
  rating?: number | null;
  time?: number | null;
  releaseDate: number;
  genres: string;
  themes: string;
  globalRating: number;
}

export interface RankedRecommendation extends RecommendationCandidate {
  score: number;
}
