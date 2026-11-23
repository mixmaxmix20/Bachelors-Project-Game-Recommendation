import { useRef, useState, type KeyboardEvent, type RefObject } from "react";
import ActionFeedback, {
  type ActionMessage,
} from "../../components/common/ActionFeedback";
import { fetchGamesDatabase } from "../../services/gameCatalogService";
import { describeOperationError } from "../../services/operationError";
import type { Game } from "../../types/game";

interface CollectionSearchProps {
  ownedGames: readonly Game[];
  collectionStatus: "loading" | "ready" | "error";
  onAddGame: (game: Game) => Promise<void>;
  inputRef: RefObject<HTMLInputElement>;
}

type Catalog =
  { status: "idle" | "loading" | "error" } | { status: "ready"; games: Game[] };

const searchResultsId = "collection-search-results";

export default function CollectionSearch({
  ownedGames,
  collectionStatus,
  onAddGame,
  inputRef,
}: CollectionSearchProps) {
  const [catalog, setCatalog] = useState<Catalog>({ status: "idle" });
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeGameId, setActiveGameId] = useState<number | null>(null);
  const [addFeedback, setAddFeedback] = useState<ActionMessage | null>(null);
  const addingGame = useRef(false);
  const isAdding = addFeedback?.kind === "pending";
  const normalizedQuery = searchQuery.toLowerCase();
  const hasQuery = Boolean(normalizedQuery.trim());
  const searchResults: Game[] = [];
  if (catalog.status === "ready" && collectionStatus === "ready" && hasQuery) {
    const ownedIds = new Set(ownedGames.map((game) => game.id));
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
  if (isSearchOpen && hasQuery && !isAdding && collectionStatus !== "error") {
    if (catalog.status === "loading") searchStatus = "Wczytywanie katalogu…";
    else if (
      collectionStatus === "ready" &&
      catalog.status === "ready" &&
      !showResults
    ) {
      searchStatus = "Brak pasujących gier spoza kolekcji.";
    }
  }
  const searchFeedback =
    collectionStatus !== "error" &&
    isSearchOpen &&
    hasQuery &&
    catalog.status === "error"
      ? {
          kind: "error" as const,
          message:
            "Nie udało się wczytać katalogu. Zmień zapytanie, aby spróbować ponownie.",
        }
      : addFeedback;

  function closeSearchResults() {
    setIsSearchOpen(false);
    setActiveGameId(null);
  }

  async function handleSearch(query: string) {
    if (addingGame.current) return;
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
      if (!event.repeat) void handleAddGame(activeGame);
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

  async function handleAddGame(game: Game) {
    if (
      collectionStatus !== "ready" ||
      addingGame.current ||
      ownedGames.some((owned) => owned.id === game.id)
    )
      return;

    addingGame.current = true;
    setAddFeedback({ kind: "pending", message: "Dodawanie gry…" });
    try {
      await onAddGame(game);
      setSearchQuery("");
      closeSearchResults();
      setAddFeedback({ kind: "success", message: "Dodano grę do kolekcji." });
    } catch (error) {
      setAddFeedback({
        kind: "error",
        message: describeOperationError(error, "collection-add").message,
      });
    } finally {
      addingGame.current = false;
    }
  }

  return (
    <div className="relative mb-4 mt-5 w-full max-w-xl px-4">
      <label htmlFor="collection-search" className="mb-1 block font-semibold">
        Wyszukaj grę
      </label>
      <input
        ref={inputRef}
        id="collection-search"
        type="text"
        role="combobox"
        autoComplete="off"
        aria-autocomplete="list"
        aria-controls={showResults ? searchResultsId : undefined}
        aria-expanded={showResults}
        aria-activedescendant={
          activeGame ? `${searchResultsId}-${activeGame.id}` : undefined
        }
        aria-describedby="collection-search-status collection-search-feedback"
        value={searchQuery}
        readOnly={isAdding}
        onChange={(event) => handleSearch(event.currentTarget.value)}
        onFocus={() => setIsSearchOpen(true)}
        onClick={() => setIsSearchOpen(true)}
        onBlur={closeSearchResults}
        onKeyDown={handleSearchKeyDown}
        className="text-lg sm:text-2xl w-full h-12 p-2 border border-ui-border ui-focus rounded bg-transparent"
      />
      <p
        id="collection-search-status"
        role="status"
        className="text-sm text-ui-muted empty:sr-only"
      >
        {searchStatus}
      </p>
      <div id="collection-search-feedback">
        <ActionFeedback feedback={searchFeedback} />
      </div>
      {showResults && (
        <ul
          id={searchResultsId}
          role="listbox"
          aria-label="Wyniki wyszukiwania gier"
          className="absolute top-full mt-1.5 left-4 right-4 bg-black border border-ui-border rounded max-h-54 overflow-y-auto z-10"
        >
          {searchResults.map((game) => (
            <li
              key={game.id}
              id={`${searchResultsId}-${game.id}`}
              role="option"
              aria-selected={game.id === activeGame?.id}
              className="flex items-center p-2 cursor-pointer hover:bg-[#585858] aria-selected:bg-[#585858]"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => handleAddGame(game)}
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
      )}
    </div>
  );
}
