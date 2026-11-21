import {
  collection,
  doc,
  documentId,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  increment,
  query,
  and,
  where,
  orderBy,
  limit,
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
import { resolveRecommendationSettings } from "../domain/recommendations";
import { loadRecommendationHistory } from "./recommendationHistory";
import { gameLengthBounds, normalizePreferenceRange, releaseYearBounds } from "../domain/profileRanges";

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

export const fetchUserGames = async (uid: string): Promise<Game[]> => {
  const gamesRef = collection(db, `users/${uid}/games`);
  const snapshot = await getDocs(gamesRef);
  return snapshot.docs.map((docSnap) => {
    const { coverId, name, starRating, playtime, notes } = docSnap.data();
    return {
      id: parseInt(docSnap.id, 10),
      cover: coverId,
      name: name,
      starRating: starRating || 0,
      playtime: playtime || 0,
      notes: notes || "",
    };
  });
};

export const fetchRecommendationCollection = async (
  uid: string
): Promise<RecommendationCollectionEntry[]> => {
  const gamesRef = collection(db, `users/${uid}/games`);
  const snapshot = await getDocs(gamesRef);
  return snapshot.docs.map((docSnap) => {
    const { starRating, playtime } = docSnap.data();
    return { id: docSnap.id, starRating, playtime };
  });
};

export const fetchRecommendationHistory = (entries: readonly RecommendationCollectionEntry[]) =>
  loadRecommendationHistory(entries, async (ids) => {
    const games = collection(db, "gamesDatabase");
    const snapshot = await getDocs(query(games, where(documentId(), "in", ids)));
    return snapshot.docs.map((docSnap) => {
      const { genres, themes, time } = docSnap.data();
      return { id: docSnap.id, genres, themes, time };
    });
  });

export const fetchRecommendationCandidates = async (
  minYear: number,
  maxYear: number
): Promise<RecommendationCandidate[]> => {
  const gamesRef = collection(db, "gamesDatabase");
  const gamesQuery = query(
    gamesRef,
    and(
      where("year", ">=", minYear),
      where("year", "<=", maxYear)
    ),
    orderBy("rating", "desc"),
    limit(100)
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
      globalRating: data.ratingCount > 0 ? data.totalRatings / data.ratingCount : 0,
    };
  });
};

export const addGameToUserCollection = async (uid: string, game: Game) => {
  const gameDoc = doc(db, `users/${uid}/games`, String(game.id));
  return setDoc(
    gameDoc,
    { name: game.name, coverId: game.cover },
    { merge: true }
  );
};

export const deleteGameFromUserCollection = async (
  uid: string,
  game: Game
) => {
  const previousRating = game.starRating || 0;
  const gameDoc = doc(db, `users/${uid}/games`, String(game.id));
  await deleteDoc(gameDoc);

  if (previousRating > 0) {
    const globalGameRef = doc(db, "gamesDatabase", String(game.id));
    await setDoc(
      globalGameRef,
      {
        totalRatings: increment(-previousRating),
        ratingCount: increment(-1),
      },
      { merge: true }
    );
  }
};

export const updateUserGameRating = async (
  uid: string,
  gameId: number,
  starRating: number,
  previousRating: number
) => {
  const gameDoc = doc(db, `users/${uid}/games`, String(gameId));
  await setDoc(gameDoc, { starRating }, { merge: true });

  const globalGameRef = doc(db, "gamesDatabase", String(gameId));
  await setDoc(
    globalGameRef,
    {
      totalRatings: increment(starRating - previousRating),
      ratingCount: previousRating === 0 ? increment(1) : increment(0),
    },
    { merge: true }
  );
};

export const updateUserGamePlaytime = async (
  uid: string,
  gameId: number,
  hours: number
) => {
  const gameDoc = doc(db, `users/${uid}/games`, String(gameId));
  return setDoc(gameDoc, { playtime: hours }, { merge: true });
};

const getProfilePreferencesRef = (uid: string) =>
  doc(db, "users", uid, "profileInfo", "preferences");

export const fetchUserProfilePreferences = async (
  uid: string
): Promise<UserProfilePreferences> => {
  const snapshot = await getDoc(getProfilePreferencesRef(uid));
  const data = snapshot.data() ?? {};
  const [minYear, maxYear] = normalizePreferenceRange(data.yearStart, data.yearEnd, releaseYearBounds);
  const [minTime, maxTime] = normalizePreferenceRange(data.timeStart, data.timeEnd, gameLengthBounds);

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
  }
) => {
  const [yearStart, yearEnd] = normalizePreferenceRange(data.yearStart, data.yearEnd, releaseYearBounds);
  const [timeStart, timeEnd] = normalizePreferenceRange(data.timeStart, data.timeEnd, gameLengthBounds);
  return setDoc(getProfilePreferencesRef(uid), {
    ...data,
    yearStart,
    yearEnd,
    timeStart,
    timeEnd,
    platforms: normalizePlatforms(data.platforms),
  }, { merge: true });
};

export const fetchRecommendationSettings = async (
  uid: string
): Promise<RecommendationSettings> => {
  const settingsRef = doc(db, "users", uid, "recommendationInfo", "settings");
  const snapshot = await getDoc(settingsRef);
  return resolveRecommendationSettings(snapshot.data());
};

export const saveRecommendationSettings = async (
  uid: string,
  settings: RecommendationSettings
) => {
  const settingsRef = doc(db, "users", uid, "recommendationInfo", "settings");
  return setDoc(settingsRef, settings, { merge: true });
};
