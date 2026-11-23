import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebase";
import type { Game } from "../types/game";

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
