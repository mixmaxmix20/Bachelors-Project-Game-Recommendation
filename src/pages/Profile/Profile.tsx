import { useState, useEffect } from "react";
import Navbar from "../../components/layout/Navbar";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../services/firebase";
import {
  fetchUserProfilePreferences,
  saveUserProfilePreferences,
} from "../../services/gameService";
import Button from "../../components/layout/Button";

function Profile() {
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
      const data = await fetchUserProfilePreferences(uid);
      setReleaseDateMin(data.minYear.toString());
      setReleaseDateMax(data.maxYear.toString());
      setGenres(data.genres);
      setThemes(data.themes);
      setPlatforms(data.platforms);
      setLengthMin(data.minTime.toString());
      setLengthMax(data.maxTime.toString());
    });

    return () => {
      unsubscribe();
    };
  }, []);

  async function saveChanges() {
    if (!uid) return;

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
      await saveUserProfilePreferences(uid, data);
    } catch (error) {
      console.error("Nie udało sie zaktualizować danych", error);
      alert("Nie udało sie zapisać danych");
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#121416] text-[#ddddff]">
      <Navbar />
        <h2 className="mt-5">Zalogowany jako: {email}</h2>
      <div className="grid grid-cols-2 gap-28 min-h-140 items-stretch mt-8 w-2/3">
        <div className="flex flex-col max-w-125 max-h-full justify-between">
          <div className="flex flex-col items-start justify-center">
            <label className="text-xl font-bold mb-5">Lata wydania: </label>
            <label className="mb-5">
              Od: <span className="text-xl font-bold">{releaseDateMin}</span>
            </label>
            <input type="range" min={1990} max={2025} value={releaseDateMin} onChange={(ev) => setReleaseDateMin(ev.target.value)} className="range grow w-125 mb-5" />
            <label className="mb-5">
              Do: <span className="text-xl font-bold">{releaseDateMax}</span>
            </label>
            <input type="range" min={1990} max={2025} value={releaseDateMax} onChange={(ev) => setReleaseDateMax(ev.target.value)} className="range grow w-125 mb-5" />
          </div>
          <div className="flex flex-col items-start justify-center">
            <label className="text-xl font-bold mb-5">Długość gry: </label>
            <label className="mb-5">
              Od: <span className="text-xl font-bold">{lengthMin} godzin</span>
            </label>
            <input type="range" min={1} max={400} value={lengthMin} onChange={(ev) => setLengthMin(ev.target.value)} className="range grow w-125 mb-5" />
            <label className="mb-5">
              Do: <span className="text-xl font-bold">{lengthMax} godzin</span>
            </label>
            <input type="range" min={1} max={400} value={lengthMax} onChange={(ev) => setLengthMax(ev.target.value)} className="range grow w-125" />
          </div>
        </div>
        <div className="flex flex-col max-w-125 max-h-full justify-between">
          <div className="flex flex-col items-start justify-center">
            <label className="text-xl font-bold mb-5">Ulubione gatunki: </label>
            <div className="flex flex-wrap gap-2 max-w-full mb-5">
              {genres.map((g, index) => (
                <div key={index} className="join">
                  <span className="btn btn-sm join-item bg-[#1f2326] text-white border-neutral-700 pointer-events-none font-normal text-base">
                    {availableGenres.find((gen) => gen.en === g)?.pl}
                  </span>
                  <button
                    type="button"
                    className="btn btn-sm btn-square join-item text-red-500 border-neutral-700 hover:bg-red-600 hover:text-white"
                    onClick={() => handleRemoveGenre(g)}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <select
              value=""
              onChange={(ev) => {
                handleAddGenre(ev.target.value);
              }}
              className="select h-12 w-125 grow text-lg rounded-lg border border-gray-500 pl-2 self-center bg-[#1f2326] text-white mb-5"
            >
              <option disabled={true} value="">Wybierz gatunek</option>
              {availableGenres.filter((option) => !genres.includes(option.en)).map((g, index) => (
                <option key={index} value={g.pl}>
                  {g.pl}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col items-start justify-center">
            <label className="text-xl font-bold mb-5">Ulubione tematyki: </label>
            <div className="flex flex-wrap gap-2 max-w-full mb-5">
              {themes.map((g, index) => (
                <div key={index} className="join">
                  <span className="btn btn-sm join-item bg-[#1f2326] text-white border-neutral-700 pointer-events-none font-normal">
                    {availableThemes.find((gen) => gen.en === g)?.pl}
                  </span>
                  <button
                    type="button"
                    className="btn btn-sm btn-square join-item text-red-500 border-neutral-700 hover:bg-red-600 hover:text-white"
                    onClick={() => handleRemoveTheme(g)}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <select
              value=""
              onChange={(ev) => {
                handleAddTheme(ev.target.value);
              }}
              className="select h-12 w-125 grow text-lg rounded-lg border border-gray-500 pl-2 self-center bg-[#1f2326] text-white mb-5"
            >
              <option disabled={true} value="">Wybierz motyw</option>
              {availableThemes.filter((option) => !themes.includes(option.en)).map((g, index) => (
                <option key={index} value={g.pl}>
                  {g.pl}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col items-start justify-center">
            <label className="text-xl font-bold mb-5">Platformy: </label>
            <div className="flex flex-wrap gap-2 max-w-full mb-5">
              {platforms.map((g, index) => (
                <div key={index} className="join">
                  <span className="btn btn-sm join-item bg-[#1f2326] text-white border-neutral-700 pointer-events-none font-normal">
                    {availablePlatforms.find((gen) => gen === g)}
                  </span>
                  <button
                    type="button"
                    className="btn btn-sm btn-square join-item text-red-500 border-neutral-700 hover:bg-red-600 hover:text-white"
                    onClick={() => handleRemovePlatform(g)}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <select
              value=""
              onChange={(ev) => {
                handleAddPlatform(ev.target.value);
              }}
              className="select h-12 w-125 grow text-lg rounded-lg border border-gray-500 pl-2 self-center bg-[#1f2326] text-white"
            >
              <option disabled={true} value="">Wybierz platformę</option>
              {availablePlatforms.filter((option) => !platforms.includes(option)).map((g, index) => (
                <option key={index} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      <div className="mt-10 mb-6">
        <Button onClickPar={saveChanges} isStandalone={true}>Zapisz zmiany</Button>
      </div>
    </div>
  );
}

export default Profile;
