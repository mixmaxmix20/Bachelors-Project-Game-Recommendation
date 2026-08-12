import Navbar from "../../components/layout/Navbar";
import "./Collection.css";
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

interface CollectionProps {}

function Collection(props: CollectionProps) {
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
    <div className="mainContainer">
      <Navbar />
      <div className="titleContainer">{/* <h2>Kolekcja gier</h2> */}</div>
      <br />
      <div className="searchContainer">
        <input
          type="text"
          placeholder="Wyszukaj grę"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="searchInput"
        />
        {searchQuery.trim() && (
          <div className="searchResults">
            {searchResults.map((game) => (
              <div
                key={game.id}
                className="searchResult"
                onClick={() => addGame(game)}
              >
                <img
                  loading="lazy"
                  src={`https://images.igdb.com/igdb/image/upload/t_cover_big/${game.cover}.png`}
                  alt={game.name}
                  className="resultCover"
                />
                <span>{game.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="gamesContainer">
        {games.map((game) => (
          <div key={game.id} className="gameTile">
            <div
              className="gameCover"
              style={{
                backgroundImage: `url(https://images.igdb.com/igdb/image/upload/t_cover_big/${game.cover}.png)`,
              }}
            ></div>
            <h3 className="gameTitle">{game.name}</h3>
            <div className="stars">
              {[...Array(5)].map((_, index) => (
                <span
                  key={index}
                  className={index < game.star_rating ? "star filled" : "star"}
                  onClick={() => updateRating(game.id, index + 1)}
                >
                  &#9733;
                </span>
              ))}
            </div>
            <div className="time">
              <input
                type="number"
                min="0"
                value={game.playtime || ""}
                onChange={(e) =>
                  updatePlaytime(game.id, Number(e.target.value))
                }
                placeholder="Czas gry"
                className="timeInput"
              />
              <span className="timeLabel">godz.</span>
            </div>
            <div className="deleteButton" onClick={() => deleteGame(game)}>
              X
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Collection;