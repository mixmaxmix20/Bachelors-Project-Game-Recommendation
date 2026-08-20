import Navbar from "../../components/layout/Navbar";
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
      setGames([...games, game]);
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

  const updateRating = async (gameId: number, star_rating: number) => {
    const previousRating = games.find((g) => g.id === gameId)?.star_rating || 0;
    setGames((prevGames) =>
      prevGames.map((game) =>
        game.id === gameId ? { ...game, star_rating } : game
      )
    );

    if (!uid) return;
    try {
      await updateUserGameRating(uid, gameId, star_rating, previousRating);
    } catch (error) {
      console.error("Bład ratingu");
      alert("Nie udalo sie zmienic ratingu");
    }
  };

  const updatePlaytime = async (gameId: number, hours: number) => {
    setGames((prevGames) =>
      prevGames.map((game) =>
        game.id === gameId ? { ...game, playtime: hours } : game
      )
    );

    if (!uid) return;
    try {
      await updateUserGamePlaytime(uid, gameId, hours);
    } catch (error) {
      console.error("Błąd zapisu czasu gry");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#121416] text-[#ddddff] pb-5">
      <Navbar />
      <div className="flex flex-col items-center justify-center text-6xl font-bold"></div>
      <br />
      <div className="relative mb-4">
        <input
          type="text"
          placeholder="Wyszukaj grę"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="text-2xl w-150 h-10 p-2 border border-[#ddd] rounded bg-transparent"
        />
        {searchQuery.trim() && (
          <div className="absolute top-10 left-0 right-0 bg-black border border-[#ddd] rounded max-h-54 overflow-y-auto z-10">
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
      <div className="flex gap-4 flex-wrap justify-center">
        {games.map((game) => (
          <div key={game.id} className="card text-center border border-[#ddd] p-2 rounded-lg">
            <figure>
              <img
              className="bg-cover bg-center"
              src={`https://images.igdb.com/igdb/image/upload/t_cover_big/${game.cover}.png`}
               alt={`${game.name} cover image`}/>
            </figure>
            <h3 className="pt-2.5">{game.name}</h3>
            <div>
              {[...Array(5)].map((_, index) => (
                <span
                  key={index}
                  className={`text-2xl cursor-pointer ${index < game.star_rating ? "text-amber-400" : "text-[#ccc]"}`}
                  onClick={() => updateRating(game.id, index + 1)}
                >
                  &#9733;
                </span>
              ))}
            </div>
            <div className="flex items-center gap-1.25 mt-2">
              <input
                type="number"
                min="0"
                value={game.playtime || ""}
                onChange={(e) =>
                  updatePlaytime(game.id, Number(e.target.value))
                }
                placeholder="Czas gry"
                className="w-full p-1 border border-[#ddd] rounded m-2 bg-transparent"
              />
              <span className="text-sm text-[#666]">godz.</span>
            </div>
            <div className="px-8 self-center cursor-pointer text-white bg-[rgb(203,49,49)] rounded-[5%] hover:bg-red-800" onClick={() => deleteGame(game)}>
              X
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Collection;