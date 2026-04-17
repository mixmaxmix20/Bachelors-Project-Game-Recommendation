import { useState, useEffect } from "react";
import Navbar from "./Navbar";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../main";
import {
  collection,
  CollectionReference,
  doc,
  getDocs,
  setDoc,
} from "firebase/firestore";
import "./Profile.css";

interface LoginProps {}

function Profile(props: LoginProps) {
  const [releaseDateMin, setReleaseDateMin] = useState("");
  const [releaseDateMax, setReleaseDateMax] = useState("");
  const [genres, setGenres] = useState<string[]>([]);
  const [themes, setThemes] = useState<string[]>([]);
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [lengthMin, setLengthMin] = useState("");
  const [lengthMax, setLengthMax] = useState("");
  const [uid, setUid] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const availableGenres = [
    { pl: "Przygodowa", en: "Adventure" },
    { pl: "Zręcznościowa", en: "Arcade" },
    { pl: "Karciana i planszowa", en: "Card & Board Game" },
    { pl: "Bijatyka", en: "Fighting" },
    {
      pl: "Hack and Slash/Bijatyka chodzona",
      en: "Hack and Slash/Beat 'em up",
    },
    { pl: "Niezależna", en: "Indie" },
    { pl: "Muzyczna", en: "Music" },
    { pl: "MOBA", en: "MOBA" },
    { pl: "Platformowa", en: "Platform" },
    { pl: "Pinball", en: "Pinball" },
    { pl: "Wskaż i kliknij", en: "Point-and-click" },
    { pl: "Logiczna", en: "Puzzle" },
    { pl: "Strategia czasu rzeczywistego", en: "RTS" },
    { pl: "RPG", en: "RPG" },
    { pl: "Wyścigowa", en: "Racing" },
    { pl: "Strzelanka", en: "Shooter" },
    { pl: "Symulacja", en: "Simulator" },
    { pl: "Sportowa", en: "Sport" },
    { pl: "Strategia", en: "Strategy" },
    { pl: "Strategia turowa", en: "TBS" },
    { pl: "Taktyczna", en: "Tactical" },
    { pl: "Powieść wizualna", en: "Visual Novel" },
  ];
  const availableThemes = [
    { pl: "Akcji", en: "Action" },
    { pl: "Fantasy", en: "Fantasy" },
    { pl: "Science fiction", en: "Science fiction" },
    { pl: "Horror", en: "Horror" },
    { pl: "Thriller", en: "Thriller" },
    { pl: "Survival", en: "Survival" },
    { pl: "Historyczne", en: "Historical" },
    { pl: "Skradanka", en: "Stealth" },
    { pl: "Komediowe", en: "Comedy" },
    { pl: "Biznesowe", en: "Business" },
    { pl: "Dramat", en: "Drama" },
    { pl: "Oparte na faktach", en: "Non-fiction" },
    { pl: "Piaskownica", en: "Sandbox" },
    { pl: "Edukacyjne", en: "Educational" },
    { pl: "Dla dzieci", en: "Kids" },
    { pl: "Otwarty świat", en: "Open world" },
    { pl: "Wojenne", en: "Warfare" },
    { pl: "Imprezowe", en: "Party" },
    { pl: "4X", en: "4X" },
    { pl: "Tajemnicza", en: "Mystery" },
    { pl: "Romans", en: "Romance" },
  ];
  const availablePlatforms = [
    "PC",
    "PlayStation 5",
    "PlayStation 4",
    "PlayStation 3",
    "PlayStation 2",
    "PlayStation 1",
    "PlayStation Vita",
    "PlayStation Portable",
    "Xbox Series X|S",
    "Xbox One",
    "Xbox 360",
    "Xbox",
    "Nintendo Switch",
    "Wii U",
    "Wii",
    "Nintendo 3DS",
    "Nintendo DS",
    "Nintendo 64",
    "Nintendo GameCube",
    "Game Boy Advance",
    "Dreamcast",
  ];

  function handleAddGenre(selectedPlGenre: string) {
    const selectedGenre = availableGenres.find((g) => g.pl === selectedPlGenre);
    if (selectedGenre && !genres.includes(selectedGenre.en)) {
      setGenres([...genres, selectedGenre.en]);
    }
  }

  function handleRemoveGenre(genreToRemove: string) {
    setGenres(genres.filter((g) => g !== genreToRemove));
  }

  function handleAddTheme(selectedPlTheme: string) {
    const selectedTheme = availableThemes.find((g) => g.pl === selectedPlTheme);
    if (selectedTheme && !themes.includes(selectedTheme.en)) {
      setThemes([...themes, selectedTheme.en]);
    }
  }

  function handleRemoveTheme(themeToRemove: string) {
    setThemes(themes.filter((g) => g !== themeToRemove));
  }

  function handleAddPlatform(selectedPlatform: string) {
    if (selectedPlatform && !platforms.includes(selectedPlatform)) {
      setPlatforms([...platforms, selectedPlatform]);
    }
  }

  function handleRemovePlatform(platformToRemove: string) {
    setPlatforms(platforms.filter((g) => g !== platformToRemove));
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user == null) {
        return;
      }
      const { uid } = user;
      setUid(uid);
      setEmail(user.email);
      const profileInfo = collection(db, `users/${uid}/profileInfo`);
      loadProfileData(profileInfo);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  async function loadProfileData(ref: CollectionReference) {
    const doc = await getDocs(ref);
    const data = doc.docs[0].data();

    setReleaseDateMin(data.yearStart);
    setReleaseDateMax(data.yearEnd || "");
    setGenres(data.genres || "");
    setThemes(data.themes || "");
    setPlatforms(data.platforms || "");
    setLengthMin(data.timeStart?.toString() || 20);
    setLengthMax(data.timeEnd?.toString() || "");
  }

  async function saveChanges() {
    if (!uid) return;
    const profileInfo = doc(db, `users/${uid}/profileInfo`, "preferences");

    const data = {
      yearStart: parseInt(releaseDateMin),
      yearEnd: parseInt(releaseDateMax),
      genres: genres,
      themes: themes,
      platforms: platforms,
      timeStart: parseInt(lengthMin),
      timeEnd: parseInt(lengthMax),
    };
    try {
      await setDoc(profileInfo, data, { merge: true });
    } catch (error) {
      console.error("Nie udalo sie zaktualizowac danych", error);
      alert("Nie udalo sie zapisac danych");
    }
  }

  return (
    <div className="mainContainer">
      <Navbar />
      <div className="titleContainer">
        {/* <h2>Profil</h2> */}
        <p>Zalogowany jako: {email}</p>
      </div>
      <br />
      <div className="formContainer">
        <div className="leftColumn">
          <div className="inputContainer">
            <label className="bigLabel">Lata wydania: </label>
            <br />
            <label>
              Od: <span className="bold">{releaseDateMin}</span>
            </label>
            <br />
            <input
              value={releaseDateMin}
              type="range"
              min="1990"
              max="2025"
              onChange={(ev) => setReleaseDateMin(ev.target.value)}
              className="inputBox"
            />
            <br />
            <label>
              {" "}
              Do: <span className="bold">{releaseDateMax}</span>
            </label>
            <br />
            <input
              value={releaseDateMax}
              type="range"
              min="1990"
              max="2025"
              onChange={(ev) => setReleaseDateMax(ev.target.value)}
              className="inputBox"
            />
          </div>
          <div className="inputContainer">
            <label className="bigLabel">Długość gry: </label>
            <br />
            <label>
              Od: <span className="bold">{lengthMin} godzin</span>
            </label>
            <br />
            <input
              value={lengthMin}
              type="range"
              min={1}
              max={400}
              onChange={(ev) => setLengthMin(ev.target.value)}
              className="inputBox"
            />
            <br />
            <label>
              {" "}
              Do: <span className="bold">{lengthMax} godzin</span>
            </label>
            <br />
            <input
              value={lengthMax}
              type="range"
              min={1}
              max={400}
              onChange={(ev) => setLengthMax(ev.target.value)}
              className="inputBox"
            />
          </div>
        </div>
        <div className="rightColumn">
          <div className="inputContainer">
            <label className="bigLabel">Ulubione gatunki: </label>
            <br />
            <div className="selectedAll">
              {genres.map((g, index) => (
                <div key={index} className="selectedOne">
                  {availableGenres.find((gen) => gen.en === g)?.pl}
                  <button onClick={() => handleRemoveGenre(g)}>X</button>
                </div>
              ))}
            </div>
            <br />
            <select
              value={genres}
              onChange={(ev) => {
                handleAddGenre(ev.target.value);
              }}
              className="inputBox"
            >
              <option value="">Wybierz gatunek</option>
              {availableGenres.map((g, index) => (
                <option key={index} value={g.pl}>
                  {g.pl}
                </option>
              ))}
            </select>
          </div>
          <div className="inputContainer">
            <label className="bigLabel">Ulubione tematyki: </label>
            <br />
            <div className="selectedAll">
              {themes.map((g, index) => (
                <div key={index} className="selectedOne">
                  {availableThemes.find((gen) => gen.en === g)?.pl}
                  <button onClick={() => handleRemoveTheme(g)}>X</button>
                </div>
              ))}
            </div>
            <br />
            <select
              value={themes}
              onChange={(ev) => {
                handleAddTheme(ev.target.value);
              }}
              className="inputBox"
            >
              <option value="">Wybierz tematykę</option>
              {availableThemes.map((g, index) => (
                <option key={index} value={g.pl}>
                  {g.pl}
                </option>
              ))}
            </select>
          </div>
          <div className="inputContainer">
            <label className="bigLabel">Platformy: </label>
            <br />
            <div className="selectedAll">
              {platforms.map((g, index) => (
                <div key={index} className="selectedOne">
                  {availablePlatforms.find((gen) => gen === g)}
                  <button onClick={() => handleRemovePlatform(g)}>X</button>
                </div>
              ))}
            </div>
            <br />
            <select
              value={platforms}
              onChange={(ev) => {
                handleAddPlatform(ev.target.value);
              }}
              className="inputBox"
            >
              <option value="">Wybierz platformę</option>
              {availablePlatforms.map((g, index) => (
                <option key={index} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      <div className="saveButtonContainer">
        <button className="button saveButton" onClick={saveChanges}>
          <span>Zapisz zmiany</span>
        </button>
      </div>
    </div>
  );
}

export default Profile;
