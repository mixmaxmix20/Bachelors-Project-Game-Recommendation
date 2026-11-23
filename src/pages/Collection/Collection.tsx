import GameCard from "../../components/layout/GameCard";
import PageHeading from "../../components/layout/PageHeading";
import { protectedPages } from "../../protectedPages";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../contexts/AuthContext";
import type { Game } from "../../types/game";
import {
  fetchUserGames,
  addGameToUserCollection,
  deleteGameFromUserCollection,
  updateUserGame,
} from "../../services/collectionService";
import CollectionSearch from "./CollectionSearch";

function Collection() {
  const { user } = useAuth();
  const uid = user?.uid;
  const [collectionStatus, setCollectionStatus] = useState<
    "loading" | "ready" | "error"
  >("loading");
  const [games, setGames] = useState<Game[]>([]);
  const searchInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!uid) return;

    let active = true;
    fetchUserGames(uid)
      .then((userGamesList) => {
        if (!active) return;
        setGames(userGamesList);
        setCollectionStatus("ready");
      })
      .catch((error) => {
        if (!active) return;
        setCollectionStatus("error");
        console.error("Nie udało się wczytać kolekcji", error);
      });

    return () => {
      active = false;
    };
  }, [uid]);

  async function addGame(game: Game) {
    if (!uid) throw new Error("Brak aktywnej sesji");

    const savedGame = await addGameToUserCollection(uid, game);
    setGames((previous) => [savedGame, ...previous]);
  }

  function moveFocusFromCard(card: HTMLDivElement) {
    if (!card.contains(document.activeElement)) return;

    const editButtonSelector =
      'button[data-collection-edit]:not([aria-disabled="true"])';
    let nextCard = card.nextElementSibling;
    let previousCard = card.previousElementSibling;
    while (nextCard || previousCard) {
      const editButton =
        nextCard?.querySelector<HTMLButtonElement>(editButtonSelector) ??
        previousCard?.querySelector<HTMLButtonElement>(editButtonSelector);
      if (editButton) {
        editButton.focus();
        return;
      }
      nextCard = nextCard?.nextElementSibling ?? null;
      previousCard = previousCard?.previousElementSibling ?? null;
    }
    searchInput.current?.focus();
  }

  async function deleteGame(gameId: number, card: HTMLDivElement) {
    if (!uid) throw new Error("Brak aktywnej sesji");

    await deleteGameFromUserCollection(uid, gameId);
    moveFocusFromCard(card);
    setGames((previous) => previous.filter((game) => game.id !== gameId));
  }

  async function saveChanges(
    gameId: number,
    starRating: number | undefined,
    hours: number,
  ) {
    if (!uid) throw new Error("Brak aktywnej sesji");

    const changes = await updateUserGame(uid, gameId, starRating, hours);
    setGames((previous) =>
      previous.map((game) =>
        game.id === gameId ? { ...game, ...changes } : game,
      ),
    );
  }

  return (
    <div className="flex flex-col items-center justify-start min-h-full bg-[#121416] text-[#ddddff] pb-8">
      <PageHeading title={protectedPages.collection.label} />
      <CollectionSearch
        ownedGames={games}
        collectionStatus={collectionStatus}
        onAddGame={addGame}
        inputRef={searchInput}
      />
      {/*Game cards*/}
      <div className="w-full max-w-7xl px-4">
        <p
          role="status"
          className="mt-12 text-center text-lg text-ui-muted empty:sr-only"
        >
          {collectionStatus === "loading"
            ? "Wczytywanie kolekcji…"
            : collectionStatus === "ready" && games.length === 0
              ? "Twoja kolekcja jest pusta. Wyszukaj i dodaj grę powyżej."
              : null}
        </p>
        <p
          role="alert"
          className="mt-12 text-center text-lg text-red-300 empty:sr-only"
        >
          {collectionStatus === "error" &&
            "Nie udało się wczytać kolekcji. Odśwież stronę, aby spróbować ponownie."}
        </p>
        {collectionStatus === "ready" && games.length > 0 && (
          <div className="grid grid-cols-2 @min-[40rem]/app-content:grid-cols-3 @min-[48rem]/app-content:grid-cols-4 @min-[64rem]/app-content:grid-cols-5 @min-[80rem]/app-content:grid-cols-6 gap-4">
            {games.map((game) => (
              <GameCard
                key={game.id}
                game={game}
                deleteGame={deleteGame}
                saveChanges={saveChanges}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Collection;
