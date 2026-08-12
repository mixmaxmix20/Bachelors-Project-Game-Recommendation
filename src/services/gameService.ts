import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  increment,
  query,
  where,
  and,
  orderBy,
  CollectionReference,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Game } from "../types/game";

export interface NewGameData {
  name: string;
  coverId: string;
  platforms: string;
  genres: string;
  themes: string;
  desc: string;
  rating: number | null;
  time: number | null;
  year: number | null;
}

export interface UserPreferences {
  minTime: number;
  maxTime: number;
  minYear: number;
  maxYear: number;
  platforms: string[];
  genres: string[];
  themes: string[];
}

export interface RecommendationSettings {
  ratingWeight: number;
  genreWeight: number;
  criticRatingWeight: number;
}

let memoryGamesCache: Game[] | null = null;
let gamesFetchPromise: Promise<Game[]> | null = null;

export const addGameToDatabase = async (id: string, data: NewGameData) => {
  const gamesDoc = doc(db, "gamesDatabase", id);
  memoryGamesCache = null;
  gamesFetchPromise = null;
  sessionStorage.removeItem("srg_games_cache");
  return setDoc(gamesDoc, data);
};

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
          star_rating: 0,
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
      star_rating: starRating || 0,
      playtime: playtime || 0,
      notes: notes || "",
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
  const previousRating = game.star_rating || 0;
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

export const fetchUserProfilePreferences = async (
  uid: string
): Promise<UserPreferences> => {
  const profileRef = collection(db, `users/${uid}/profileInfo`);
  const snapshot = await getDocs(profileRef);
  const data = snapshot.docs[0]?.data() || {};

  return {
    minTime: data.timeStart || 0,
    maxTime: data.timeEnd || 1000,
    minYear: data.yearStart || 1970,
    maxYear: data.yearEnd || new Date().getFullYear(),
    platforms: data.platforms || [],
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
  const profileInfo = doc(db, `users/${uid}/profileInfo`, "preferences");
  return setDoc(profileInfo, data, { merge: true });
};

export const fetchRecommendationSettings = async (
  uid: string
): Promise<RecommendationSettings> => {
  const settingsRef = doc(db, "users", uid, "recommendationInfo", "settings");
  const snapshot = await getDoc(settingsRef);
  const data = snapshot.data() || {};

  return {
    ratingWeight: data.ratingWeight ?? 0.2,
    genreWeight: data.genreWeight ?? 0.5,
    criticRatingWeight: data.criticRatingWeight ?? 0.5,
  };
};

export const saveRecommendationSettings = async (
  uid: string,
  settings: RecommendationSettings
) => {
  const settingsRef = doc(db, "users", uid, "recommendationInfo", "settings");
  return setDoc(settingsRef, settings, { merge: true });
};
