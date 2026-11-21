import { isPositiveTime, isStarRating } from "../domain/recommendations.ts";
import type {
  RecommendationCollectionEntry,
  RecommendationHistoryEntry,
} from "../types/recommendation";

type HistoryMetadata = Pick<
  RecommendationHistoryEntry,
  "id" | "genres" | "themes" | "time"
>;

export async function loadRecommendationHistory(
  collection: readonly RecommendationCollectionEntry[],
  fetchMetadata: (ids: string[]) => Promise<HistoryMetadata[]>,
): Promise<RecommendationHistoryEntry[]> {
  const observations = new Map<string, RecommendationCollectionEntry>();
  for (const entry of collection) {
    if (isStarRating(entry.starRating) || isPositiveTime(entry.playtime)) {
      observations.set(entry.id, entry);
    }
  }

  const ids = [...observations.keys()];
  const history: RecommendationHistoryEntry[] = [];
  // Firestore accepts up to 30 document IDs per 'in' query.
  for (let offset = 0; offset < ids.length; offset += 30) {
    const games = await fetchMetadata(ids.slice(offset, offset + 30));
    for (const game of games) {
      const entry = observations.get(game.id);
      if (entry) history.push({ ...entry, ...game });
    }
  }
  return history;
}
