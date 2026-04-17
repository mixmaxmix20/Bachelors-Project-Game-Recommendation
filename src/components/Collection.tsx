import Navbar from "./Navbar";
import "./Collection.css";
import { useState, useEffect } from "react";
import {
  setDoc,
  collection,
  getDocs,
  CollectionReference,
  doc,
  deleteDoc,
  increment,
} from "firebase/firestore";
import { db, auth } from "../main";
import { onAuthStateChanged } from "firebase/auth";
import type { Game } from "../types/game";

// interface Game {
//   id: number;
//   cover: string;
//   // genres: { id: number; name: string }[];
//   name: string;
//   // platforms: { id: number; name: string }[];
//   // description: string;
//   // themes: { id: number; name: string }[];
//   // total_rating: number;
//   star_rating: number;
//   playtime: number;
//   notes: string;
// }

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
      const gamesList = collection(db, `users/${uid}/games`);
      const gamesDatabase = collection(db, `gamesDatabase`);
      loadCollectionData(gamesList);
      loadGamesData(gamesDatabase);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  async function loadGamesData(ref: CollectionReference) {
    const doc = await getDocs(ref);
    const gamesDatabase = doc.docs.map((doc) => {
      const { coverId, name } = doc.data();
      return {
        id: parseInt(doc.id, 10),
        cover: coverId,
        name: name,
        star_rating: 0,
        playtime: 0,
        notes: "",
      };
    });
    setAllGames(gamesDatabase);
  }

  async function loadCollectionData(ref: CollectionReference) {
    const doc = await getDocs(ref);
    const gamesList = doc.docs.map((doc) => {
      const { coverId, name, starRating, playtime, notes } = doc.data();
      return {
        id: parseInt(doc.id, 10),
        cover: coverId,
        name: name,
        star_rating: starRating,
        playtime: playtime || 0,
        notes: notes || "",
      };
    });
    setGames(gamesList);
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim().length < 0) {
      setSearchResults([]);
    } else {
      const filteredGames = allGames
        .filter(
          (game) =>
            game.name.toLowerCase().includes(query.toLowerCase()) &&
            !games.some((g) => g.id === game.id)
        )
        .slice(0, 10);
      setSearchResults(filteredGames);
    }
  };

  const addGame = async (game: Game) => {
    if (!games.some((g) => g.id === game.id)) {
      setGames([...games, game]);
    }
    setSearchQuery("");
    setSearchResults([]);

    try {
      const gameDoc = doc(db, `users/${uid}/games`, String(game.id));
      await setDoc(
        gameDoc,
        { name: game.name, coverId: game.cover },
        { merge: true }
      );
    } catch (error) {
      console.error("Bład dodawania gry");
      alert("Nie udalo sie dodac gry");
    }
  };

  const deleteGame = async (game: Game) => {
    const previousRating = game.star_rating || 0;
    setGames((prevGames) => prevGames.filter((g) => g.id !== game.id));

    try {
      const gameDoc = doc(db, `users/${uid}/games`, String(game.id));
      await deleteDoc(gameDoc);

      if (previousRating > 0) {
        const globalGameRef = doc(db, "gamesDatabase", String(game.id));
        await setDoc(
          globalGameRef,
          {
            totalRatings: increment(-previousRating),
            ratingCount: increment(-1),
          },
          { merge: true }
        );
      }
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

    try {
      const gameDoc = doc(db, `users/${uid}/games`, String(gameId));
      await setDoc(gameDoc, { starRating: star_rating }, { merge: true });

      const globalGameRef = doc(db, "gamesDatabase", String(gameId));
      await setDoc(
        globalGameRef,
        {
          totalRatings: increment(star_rating - previousRating),
          ratingCount: previousRating === 0 ? increment(1) : increment(0),
        },
        { merge: true }
      );
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

    try {
      const gameDoc = doc(db, `users/${uid}/games`, String(gameId));
      await setDoc(gameDoc, { playtime: hours }, { merge: true });
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

if (import.meta.hot) {
  import.meta.hot.accept("../types/game", () => {
    console.log("Przeładowanie Kolekcji");
    import.meta.hot?.invalidate();
  });
}
