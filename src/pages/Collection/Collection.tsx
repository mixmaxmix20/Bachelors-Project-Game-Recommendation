import Navbar from "../../components/layout/Navbar";
import GameCard from "../../components/layout/GameCard";
import ActionFeedback, {
  type ActionMessage,
} from "../../components/common/ActionFeedback";
import { useState, useEffect, useRef, type KeyboardEvent } from "react";
import { useAuth } from "../../contexts/AuthContext";
import type { Game } from "../../types/game";
import {
  fetchGamesDatabase,
  fetchUserGames,
  addGameToUserCollection,
  deleteGameFromUserCollection,
  updateUserGameRating,
  updateUserGamePlaytime,
} from "../../services/gameService";

type Catalog =
  { status: "idle" | "loading" | "error" } | { status: "ready"; games: Game[] };

const searchResultsId = "collection-search-results";

function Collection() {
  const { user } = useAuth();
  const uid = user?.uid;
  const [catalog, setCatalog] = useState<Catalog>({ status: "idle" });
  const [collectionStatus, setCollectionStatus] = useState<
    "loading" | "ready" | "error"
  >("loading");
  const [games, setGames] = useState<Game[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeGameId, setActiveGameId] = useState<number | null>(null);
  const [addFeedback, setAddFeedback] = useState<ActionMessage | null>(null);
  const addingGame = useRef(false);
  const isAdding = addFeedback?.kind === "pending";
  const normalizedQuery = searchQuery.toLowerCase();
  const searchResults: Game[] = [];
  if (
    catalog.status === "ready" &&
    collectionStatus === "ready" &&
    normalizedQuery.trim()
  ) {
    const ownedIds = new Set(games.map((game) => game.id));
    for (const game of catalog.games) {
      if (
        game.name.toLowerCase().includes(normalizedQuery) &&
        !ownedIds.has(game.id)
      ) {
        searchResults.push(game);
        if (searchResults.length === 10) break;
      }
    }
  }
  const showResults = isSearchOpen && !isAdding && searchResults.length > 0;
  const activeIndex = showResults
    ? searchResults.findIndex((game) => game.id === activeGameId)
    : -1;
  const activeGame = searchResults[activeIndex];
  let searchStatus = "";
  if (isSearchOpen && normalizedQuery.trim() && !isAdding) {
    if (collectionStatus === "loading") searchStatus = "Wczytywanie kolekcji…";
    else if (catalog.status === "loading")
      searchStatus = "Wczytywanie katalogu…";
    else if (
      collectionStatus === "ready" &&
      catalog.status === "ready" &&
      !showResults
    ) {
      searchStatus = "Brak pasujących gier spoza kolekcji.";
    }
  }
  const searchFeedback =
    collectionStatus === "error"
      ? {
          kind: "error" as const,
          message:
            "Nie udało się wczytać kolekcji. Odśwież stronę, aby spróbować ponownie.",
        }
      : isSearchOpen && normalizedQuery.trim() && catalog.status === "error"
        ? {
            kind: "error" as const,
            message:
              "Nie udało się wczytać katalogu. Zmień zapytanie, aby spróbować ponownie.",
          }
        : addFeedback;

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

  function closeSearchResults() {
    setIsSearchOpen(false);
    setActiveGameId(null);
  }

  async function handleSearch(query: string) {
    setSearchQuery(query);
    setIsSearchOpen(true);
    setActiveGameId(null);
    setAddFeedback(null);
    if (
      !query.trim() ||
      catalog.status === "ready" ||
      catalog.status === "loading"
    )
      return;

    setCatalog({ status: "loading" });
    try {
      setCatalog({ status: "ready", games: await fetchGamesDatabase() });
    } catch (error) {
      setCatalog({ status: "error" });
      console.error("Nie udało się wczytać katalogu gier", error);
    }
  }

  function handleSearchKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.nativeEvent.isComposing || addingGame.current) return;
    if (event.key === "Escape" && isSearchOpen) {
      event.preventDefault();
      closeSearchResults();
    } else if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
      setActiveGameId(null);
    } else if (event.key === "Enter" && activeGame) {
      event.preventDefault();
      if (!event.repeat) void addGame(activeGame);
    } else if (
      (event.key === "ArrowDown" || event.key === "ArrowUp") &&
      !event.altKey &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.shiftKey &&
      searchResults.length > 0
    ) {
      event.preventDefault();
      const lastIndex = searchResults.length - 1;
      const nextIndex =
        event.key === "ArrowDown"
          ? Math.min(activeIndex + 1, lastIndex)
          : activeIndex < 0
            ? lastIndex
            : Math.max(activeIndex - 1, 0);
      const game = searchResults[nextIndex];
      setIsSearchOpen(true);
      setActiveGameId(game.id);
      requestAnimationFrame(() => {
        document
          .getElementById(`${searchResultsId}-${game.id}`)
          ?.scrollIntoView({ block: "nearest" });
      });
    }
  }

  async function addGame(game: Game) {
    if (
      !uid ||
      collectionStatus !== "ready" ||
      addingGame.current ||
      games.some((owned) => owned.id === game.id)
    )
      return;

    addingGame.current = true;
    setAddFeedback({ kind: "pending", message: "Dodawanie gry…" });
    try {
      await addGameToUserCollection(uid, game);
      setGames((previous) => [game, ...previous]);
      setSearchQuery("");
      closeSearchResults();
      setAddFeedback({ kind: "success", message: "Dodano grę do kolekcji." });
    } catch (error) {
      console.error("Błąd dodawania gry", error);
      setAddFeedback({
        kind: "error",
        message: "Nie udało się dodać gry. Spróbuj ponownie.",
      });
    } finally {
      addingGame.current = false;
    }
  }

  const deleteGame = async (game: Game) => {
    setGames((prevGames) => prevGames.filter((g) => g.id !== game.id));
    if (!uid) return;

    try {
      await deleteGameFromUserCollection(uid, game);
    } catch (error) {
      console.error("Błąd usuwania gry");
      alert("Nie udało się usunąć gry");
    }
  };

  const saveChanges = async (
    gameId: number,
    starRating: number,
    hours: number,
  ) => {
    const previousRating = games.find((g) => g.id === gameId)?.starRating || 0;

    setGames((prevGames) =>
      prevGames.map((game) =>
        game.id === gameId
          ? { ...game, starRating: starRating, playtime: hours }
          : game,
      ),
    );

    if (!uid) return;
    try {
      await updateUserGameRating(uid, gameId, starRating, previousRating);
      await updateUserGamePlaytime(uid, gameId, hours);
    } catch (error) {
      console.error("Błąd edycji danych.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-start pt-2 sm:pt-5 min-h-screen bg-[#121416] text-[#ddddff] pb-24 pointer-fine:pb-8 pointer-fine:pl-16">
      <Navbar />
      <div className="flex flex-col items-center justify-center text-6xl font-bold"></div>
      {/*Search bar*/}
      <div className="relative mb-4 mt-5 w-full max-w-xl px-4">
        <label htmlFor="collection-search" className="mb-1 block font-semibold">
          Wyszukaj grę
        </label>
        <input
          id="collection-search"
          type="text"
          role="combobox"
          autoComplete="off"
          aria-autocomplete="list"
          aria-controls={searchResultsId}
          aria-expanded={showResults}
          aria-activedescendant={
            activeGame ? `${searchResultsId}-${activeGame.id}` : undefined
          }
          aria-describedby="collection-search-hint collection-search-feedback"
          value={searchQuery}
          readOnly={isAdding}
          onChange={(event) => handleSearch(event.currentTarget.value)}
          onFocus={() => setIsSearchOpen(true)}
          onClick={() => setIsSearchOpen(true)}
          onBlur={closeSearchResults}
          onKeyDown={handleSearchKeyDown}
          className="text-lg sm:text-2xl w-full h-12 p-2 border border-ui-border ui-focus rounded bg-transparent"
        />
        <p role="status" className="text-sm text-ui-muted empty:sr-only">
          {searchStatus}
        </p>
        <div id="collection-search-feedback">
          <ActionFeedback feedback={searchFeedback} />
        </div>
        <ul
          id={searchResultsId}
          role="listbox"
          aria-label="Wyniki wyszukiwania gier"
          hidden={!showResults}
          className="absolute top-full mt-1.5 left-4 right-4 bg-black border border-ui-border rounded max-h-54 overflow-y-auto z-10"
        >
          {showResults &&
            searchResults.map((game) => (
              <li
                key={game.id}
                id={`${searchResultsId}-${game.id}`}
                role="option"
                aria-selected={game.id === activeGame?.id}
                className="flex items-center p-2 cursor-pointer hover:bg-[#585858] aria-selected:bg-[#585858]"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => addGame(game)}
              >
                <img
                  loading="lazy"
                  src={`https://images.igdb.com/igdb/image/upload/t_cover_big/${game.cover}.png`}
                  alt=""
                  className="w-17.5 h-22 object-cover mr-2"
                />
                <span>{game.name}</span>
              </li>
            ))}
        </ul>
      </div>
      {/*Game cards*/}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 w-full max-w-7xl px-4">
        {games.map((game) => (
          <GameCard
            key={game.id}
            game={game}
            deleteGame={deleteGame}
            saveChanges={saveChanges}
          />
        ))}
        {collectionStatus === "ready" && games.length === 0 && (
          <p className="text-ui-muted mt-12 text-center text-lg">
            Twoja kolekcja jest pusta! Wyszukaj i dodaj gry powyżej.
          </p>
        )}
      </div>
    </div>
  );
}

export default Collection;
