import Navbar from "../../components/layout/Navbar";
import GameCard from "../../components/layout/GameCard";
import { useState, useEffect, useRef } from "react";
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

function Collection() {
  const { user } = useAuth();
  const uid = user?.uid;
  const [allGames, setAllGames] = useState<Game[] | null>(null);
  const loadingCatalog = useRef(false);
  const [games, setGames] = useState<Game[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const normalizedQuery = searchQuery.toLowerCase();
  const searchResults: Game[] = [];
  if (allGames && normalizedQuery.trim()) {
    const ownedIds = new Set(games.map((game) => game.id));
    for (const game of allGames) {
      if (game.name.toLowerCase().includes(normalizedQuery) && !ownedIds.has(game.id)) {
        searchResults.push(game);
        if (searchResults.length === 10) break;
      }
    }
  }

  useEffect(() => {
    if (!uid) return;

    let active = true;
    fetchUserGames(uid)
      .then((userGamesList) => {
        if (active) setGames(userGamesList);
      })
      .catch((error) => {
        if (active) console.error("Nie udało się wczytać kolekcji", error);
      });

    return () => {
      active = false;
    };
  }, [uid]);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim() || allGames !== null || loadingCatalog.current) return;

    loadingCatalog.current = true;
    try {
      setAllGames(await fetchGamesDatabase());
    } catch (error) {
      console.error("Nie udało się wczytać katalogu gier", error);
    } finally {
      loadingCatalog.current = false;
    }
  };

  const addGame = async (game: Game) => {
    if (!games.some((g) => g.id === game.id)) {
      setGames([game, ...games]);
    }
    setSearchQuery("");

    if (!uid) return;
    try {
      await addGameToUserCollection(uid, game);
    } catch (error) {
      console.error("Błąd dodawania gry");
      alert("Nie udało się dodać gry");
    }
  };

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

  const saveChanges = async (gameId: number, starRating: number, hours: number) => {
    const previousRating = games.find((g) => g.id === gameId)?.starRating || 0;

    setGames((prevGames) =>
      prevGames.map((game) =>
        game.id === gameId ? { ...game, starRating: starRating, playtime: hours } : game
      )
    );

    if (!uid) return;
    try {
      await updateUserGameRating(uid, gameId, starRating, previousRating)
      await updateUserGamePlaytime(uid, gameId, hours);
    } catch (error) {
      console.error("Błąd edycji danych.");
    }
  }

  return (
    <div className="flex flex-col items-center justify-start pt-2 sm:pt-5 min-h-screen bg-[#121416] text-[#ddddff] pb-24 pointer-fine:pb-8 pointer-fine:pl-16">
      <Navbar />
      <div className="flex flex-col items-center justify-center text-6xl font-bold"></div>
      {/*Search bar*/}
      <div className="relative mb-4 mt-5 w-full max-w-xl px-4">
        <input
          type="text"
          placeholder="Wyszukaj grę"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="text-lg sm:text-2xl w-full h-12 p-2 border border-ui-border ui-focus rounded bg-transparent"
        />
        {searchQuery.trim() && (
          <div className="absolute top-full mt-1.5 left-4 right-4 bg-black border border-ui-border rounded max-h-54 overflow-y-auto z-10">
            {searchResults.map((game) => (
              <div
                key={game.id}
                className="flex items-center p-2 cursor-pointer hover:bg-[#585858]"
                onClick={() => addGame(game)}
              >
                <img
                  loading="lazy"
                  src={`https://images.igdb.com/igdb/image/upload/t_cover_big/${game.cover}.png`}
                  alt={`Okładka gry ${game.name}`}
                  className="w-17.5 h-22 object-cover mr-2"
                />
                <span>{game.name}</span>
              </div>
            ))}
          </div>
        )}
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
        {games.length === 0 && (
            <p className="text-ui-muted mt-12 text-center text-lg">
              Twoja kolekcja jest pusta! Wyszukaj i dodaj gry powyżej.
            </p>
        )}
      </div>
    </div>
  );
}

export default Collection;
