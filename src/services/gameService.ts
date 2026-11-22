import { FirebaseError } from "firebase/app";
import {
  collection,
  doc,
  documentId,
  getDocs,
  getDoc,
  setDoc,
  increment,
  runTransaction,
  query,
  and,
  where,
  orderBy,
  limit,
  type DocumentData,
  type Transaction,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Game } from "../types/game";
import type {
  RecommendationCandidate,
  RecommendationCollectionEntry,
  RecommendationSettings,
  UserProfilePreferences,
} from "../types/recommendation";
import { normalizePlatforms } from "../domain/platforms";
import { getCollectionRatingChange } from "../domain/collectionRatings";
import { resolveRecommendationSettings } from "../domain/recommendations";
import { loadRecommendationHistory } from "./recommendationHistory";
import {
  gameLengthBounds,
  normalizePreferenceRange,
  releaseYearBounds,
} from "../domain/profileRanges";

let memoryGamesCache: Game[] | null = null;
let gamesFetchPromise: Promise<Game[]> | null = null;

export const fetchGamesDatabase = async (): Promise<Game[]> => {
  if (memoryGamesCache && memoryGamesCache.length > 0) {
    return memoryGamesCache;
  }

  const cached = sessionStorage.getItem("srg_games_cache");
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        memoryGamesCache = parsed;
        return parsed;
      }
    } catch {}
  }

  if (gamesFetchPromise) {
    return gamesFetchPromise;
  }

  gamesFetchPromise = (async () => {
    try {
      const gamesRef = collection(db, "gamesDatabase");
      const snapshot = await getDocs(gamesRef);
      const games = snapshot.docs.map((docSnap) => {
        const { coverId, name } = docSnap.data();
        return {
          id: parseInt(docSnap.id, 10),
          cover: coverId,
          name: name,
          starRating: 0,
          playtime: 0,
          notes: "",
        };
      });

      memoryGamesCache = games;
      sessionStorage.setItem("srg_games_cache", JSON.stringify(games));
      return games;
    } finally {
      gamesFetchPromise = null;
    }
  })();

  return gamesFetchPromise;
};

function toCollectionGame(id: string, data: DocumentData): Game {
  const { coverId, name, starRating, playtime, notes } = data;
  return {
    id: parseInt(id, 10),
    cover: coverId,
    name,
    starRating: starRating ?? 0,
    playtime: playtime ?? 0,
    notes: notes ?? "",
  };
}

export const fetchUserGames = async (uid: string): Promise<Game[]> => {
  const gamesRef = collection(db, `users/${uid}/games`);
  const snapshot = await getDocs(gamesRef);
  return snapshot.docs.map((docSnap) =>
    toCollectionGame(docSnap.id, docSnap.data()),
  );
};

export const fetchRecommendationCollection = async (
  uid: string,
): Promise<RecommendationCollectionEntry[]> => {
  const gamesRef = collection(db, `users/${uid}/games`);
  const snapshot = await getDocs(gamesRef);
  return snapshot.docs.map((docSnap) => {
    const { starRating, playtime } = docSnap.data();
    return { id: docSnap.id, starRating, playtime };
  });
};

export const fetchRecommendationHistory = (
  entries: readonly RecommendationCollectionEntry[],
) =>
  loadRecommendationHistory(entries, async (ids) => {
    const games = collection(db, "gamesDatabase");
    const snapshot = await getDocs(
      query(games, where(documentId(), "in", ids)),
    );
    return snapshot.docs.map((docSnap) => {
      const { genres, themes, time } = docSnap.data();
      return { id: docSnap.id, genres, themes, time };
    });
  });

export const fetchRecommendationCandidates = async (
  minYear: number,
  maxYear: number,
): Promise<RecommendationCandidate[]> => {
  const gamesRef = collection(db, "gamesDatabase");
  const gamesQuery = query(
    gamesRef,
    and(where("year", ">=", minYear), where("year", "<=", maxYear)),
    orderBy("rating", "desc"),
    limit(100),
  );
  const snapshot = await getDocs(gamesQuery);
  return snapshot.docs.map((docSnap) => {
    const data = docSnap.data();
    return {
      id: parseInt(docSnap.id, 10),
      name: data.name,
      cover: data.coverId,
      platforms: data.platforms,
      description: data.desc,
      rating: data.rating,
      time: data.time,
      releaseDate: data.year,
      genres: data.genres,
      themes: data.themes,
      globalRating:
        data.ratingCount > 0 ? data.totalRatings / data.ratingCount : 0,
    };
  });
};

async function runCollectionTransaction<T>(
  write: (transaction: Transaction) => Promise<T>,
): Promise<T> {
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    throw new FirebaseError(
      "unavailable",
      "Collection writes require a connection.",
    );
  }
  return runTransaction(db, write);
}

function updateCollectionRatingTotals(
  transaction: Transaction,
  gameId: number,
  previousRating: number,
  starRating: number,
) {
  const { totalRatings, ratingCount } = getCollectionRatingChange(
    previousRating,
    starRating,
  );
  if (totalRatings === 0) return;

  transaction.update(doc(db, "gamesDatabase", String(gameId)), {
    totalRatings: increment(totalRatings),
    ...(ratingCount !== 0 && { ratingCount: increment(ratingCount) }),
  });
}

export const addGameToUserCollection = (
  uid: string,
  game: Game,
): Promise<Game> => {
  const gameDoc = doc(db, "users", uid, "games", String(game.id));
  return runCollectionTransaction(async (transaction) => {
    const existing = await transaction.get(gameDoc);
    const details = { name: game.name, coverId: game.cover };
    transaction.set(gameDoc, details, { merge: true });
    return toCollectionGame(gameDoc.id, { ...existing.data(), ...details });
  });
};

export const deleteGameFromUserCollection = (uid: string, gameId: number) => {
  const gameDoc = doc(db, "users", uid, "games", String(gameId));
  return runCollectionTransaction(async (transaction) => {
    const existing = await transaction.get(gameDoc);
    if (!existing.exists()) return;

    transaction.delete(gameDoc);
    updateCollectionRatingTotals(
      transaction,
      gameId,
      existing.get("starRating") ?? 0,
      0,
    );
  });
};

export const updateUserGame = (
  uid: string,
  gameId: number,
  starRating: number | undefined,
  playtime: number,
): Promise<Pick<Game, "starRating" | "playtime">> => {
  const gameDoc = doc(db, "users", uid, "games", String(gameId));
  return runCollectionTransaction(async (transaction) => {
    const existing = await transaction.get(gameDoc);
    if (!existing.exists()) {
      throw new FirebaseError(
        "not-found",
        "The collection entry no longer exists.",
      );
    }

    const previousRating: number = existing.get("starRating") ?? 0;
    const changes = { starRating: starRating ?? previousRating, playtime };
    transaction.update(gameDoc, changes);
    updateCollectionRatingTotals(
      transaction,
      gameId,
      previousRating,
      changes.starRating,
    );
    return changes;
  });
};

const getProfilePreferencesRef = (uid: string) =>
  doc(db, "users", uid, "profileInfo", "preferences");

export const fetchUserProfilePreferences = async (
  uid: string,
): Promise<UserProfilePreferences> => {
  const snapshot = await getDoc(getProfilePreferencesRef(uid));
  const data = snapshot.data() ?? {};
  const [minYear, maxYear] = normalizePreferenceRange(
    data.yearStart,
    data.yearEnd,
    releaseYearBounds,
  );
  const [minTime, maxTime] = normalizePreferenceRange(
    data.timeStart,
    data.timeEnd,
    gameLengthBounds,
  );

  return {
    minTime,
    maxTime,
    minYear,
    maxYear,
    platforms: normalizePlatforms(data.platforms ?? []),
    genres: data.genres || [],
    themes: data.themes || [],
  };
};

export const saveUserProfilePreferences = async (
  uid: string,
  data: {
    yearStart: number;
    yearEnd: number;
    genres: string[];
    themes: string[];
    platforms: string[];
    timeStart: number;
    timeEnd: number;
  },
) => {
  const [yearStart, yearEnd] = normalizePreferenceRange(
    data.yearStart,
    data.yearEnd,
    releaseYearBounds,
  );
  const [timeStart, timeEnd] = normalizePreferenceRange(
    data.timeStart,
    data.timeEnd,
    gameLengthBounds,
  );
  return setDoc(
    getProfilePreferencesRef(uid),
    {
      ...data,
      yearStart,
      yearEnd,
      timeStart,
      timeEnd,
      platforms: normalizePlatforms(data.platforms),
    },
    { merge: true },
  );
};

export const fetchRecommendationSettings = async (
  uid: string,
): Promise<RecommendationSettings> => {
  const settingsRef = doc(db, "users", uid, "recommendationInfo", "settings");
  const snapshot = await getDoc(settingsRef);
  return resolveRecommendationSettings(snapshot.data());
};

export const saveRecommendationSettings = async (
  uid: string,
  settings: RecommendationSettings,
) => {
  const settingsRef = doc(db, "users", uid, "recommendationInfo", "settings");
  return setDoc(settingsRef, settings, { merge: true });
};
