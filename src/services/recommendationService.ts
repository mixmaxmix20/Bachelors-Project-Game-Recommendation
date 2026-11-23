import {
  collection,
  doc,
  documentId,
  getDocs,
  getDoc,
  setDoc,
  query,
  and,
  where,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "./firebase";
import type {
  RecommendationCandidate,
  RecommendationCollectionEntry,
  RecommendationSettings,
} from "../types/recommendation";
import { resolveRecommendationSettings } from "../domain/recommendations";
import { loadRecommendationHistory } from "./recommendationHistory";

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
