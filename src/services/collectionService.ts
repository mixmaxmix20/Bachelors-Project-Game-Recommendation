import { FirebaseError } from "firebase/app";
import {
  collection,
  doc,
  getDocs,
  increment,
  runTransaction,
  type DocumentData,
  type Transaction,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Game } from "../types/game";
import { getCollectionRatingChange } from "../domain/collectionRatings";

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
