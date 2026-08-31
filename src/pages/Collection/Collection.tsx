import Navbar from "../../components/layout/Navbar";
import GameCard from "../../components/layout/GameCard";
import { useState, useEffect } from "react";
import { auth } from "../../services/firebase";
import { onAuthStateChanged } from "firebase/auth";
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
  const [allGames, setAllGames] = useState<Game[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<Game[]>([]);
  const [uid, setUid] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user == null) {
        return;
      }

      const { uid } = user;
      setUid(uid);

      const userGamesList = await fetchUserGames(uid);
      setGames(userGamesList);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    let currentAllGames = allGames;
    if (currentAllGames.length === 0) {
      currentAllGames = await fetchGamesDatabase();
      setAllGames(currentAllGames);
    }

    const filteredGames = currentAllGames
      .filter(
        (game) =>
          game.name.toLowerCase().includes(query.toLowerCase()) &&
          !games.some((g) => g.id === game.id)
      )
      .slice(0, 10);
    setSearchResults(filteredGames);
  };

  const addGame = async (game: Game) => {
    if (!games.some((g) => g.id === game.id)) {
      setGames([game, ...games]);
    }
    setSearchQuery("");
    setSearchResults([]);

    if (!uid) return;
    try {
      await addGameToUserCollection(uid, game);
    } catch (error) {
      console.error("Bład dodawania gry");
      alert("Nie udalo sie dodac gry");
    }
  };

  const deleteGame = async (game: Game) => {
    setGames((prevGames) => prevGames.filter((g) => g.id !== game.id));
    if (!uid) return;

    try {
      await deleteGameFromUserCollection(uid, game);
    } catch (error) {
      console.error("Bład usuwania gry");
      alert("Nie udalo sie usunąć gry");
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
          className="text-lg sm:text-2xl w-full h-12 p-2 border border-[#ddd] rounded bg-transparent"
        />
        {searchQuery.trim() && (
          <div className="absolute top-full mt-1.5 left-4 right-4 bg-black border border-[#ddd] rounded max-h-54 overflow-y-auto z-10">
            {searchResults.map((game) => (
              <div
                key={game.id}
                className="flex items-center p-2 cursor-pointer hover:bg-[#585858]"
                onClick={() => addGame(game)}
              >
                <img
                  loading="lazy"
                  src={`https://images.igdb.com/igdb/image/upload/t_cover_big/${game.cover}.png`}
                  alt={game.name}
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
            <p className="text-gray-400 mt-12 text-center text-lg">
              Twoja kolekcja jest pusta! Wyszukaj i dodaj gry powyżej.
            </p>
        )}
      </div>
    </div>
  );
}

export default Collection;