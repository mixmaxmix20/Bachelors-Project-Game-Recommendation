import { auth } from "../../services/firebase";
import "./AddGame.css";
import Navbar from "../../components/layout/Navbar";
import { useState } from "react";
import { addGameToDatabase } from "../../services/gameService";

interface addGameProps {}

function AddGame(props: addGameProps) {
  const [id, setId] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [coverId, setCoverId] = useState<string>("");
  const [platforms, setPlatforms] = useState<string>("");
  const [genres, setGenres] = useState<string>("");
  const [themes, setThemes] = useState<string>("");
  const [desc, setDesc] = useState<string>("");
  const [rating, setRating] = useState<number | null>(null);
  const [time, setTime] = useState<number | null>(null);
  const [year, setYear] = useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      name,
      coverId,
      platforms,
      genres,
      themes,
      desc,
      rating,
      time,
      year,
    };
    await addGameToDatabase(id, data);
    setId("");
    setName("");
    setCoverId("");
    setPlatforms("");
    setGenres("");
    setThemes("");
    setDesc("");
    setRating(null);
    setTime(null);
    setYear(null);
  };

  return (
    <div className="main">
      <Navbar />
      <div className="form">
        <input
          value={id}
          onChange={(e) => setId(e.target.value)}
          type="text"
          placeholder="ID"
          id="id"
          required
        />
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          type="text"
          placeholder="Name"
          id="name"
        />
        <input
          value={coverId}
          onChange={(e) => setCoverId(e.target.value)}
          type="text"
          placeholder="coverId"
          id="coverId"
        />
        <input
          value={platforms}
          onChange={(e) => setPlatforms(e.target.value)}
          type="text"
          placeholder="Platforms"
          id="platforms"
        />
        <input
          value={genres}
          onChange={(e) => setGenres(e.target.value)}
          type="text"
          placeholder="Genres"
          id="genres"
        />
        <input
          value={themes}
          onChange={(e) => setThemes(e.target.value)}
          type="text"
          placeholder="Themes"
          id="themes"
        />
        <input
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          type="text"
          placeholder="Desc"
          id="desc"
        />
        <input
          value={rating || ""}
          onChange={(e) => setRating(Number(e.target.value))}
          type="number"
          placeholder="Rating"
          id="rating"
        />
        <input
          value={time || ""}
          onChange={(e) => setTime(Number(e.target.value))}
          type="number"
          placeholder="Time"
          id="time"
        />
        <input
          value={year || ""}
          onChange={(e) => setYear(Number(e.target.value))}
          type="number"
          placeholder="Year"
          id="year"
        />
        <button type="submit" onClick={handleSubmit}>
          Dodaj grę
        </button>
        <label></label>
      </div>
    </div>
  );
}

export default AddGame;
