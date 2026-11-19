import { availablePlatforms } from "../../domain/platforms";
import { gameLengthBounds, releaseYearBounds, type PreferenceRange } from "../../domain/profileRanges";
import { useState, useEffect } from "react";
import Navbar from "../../components/layout/Navbar";
import { useAuth } from "../../contexts/AuthContext";
import {
  fetchUserProfilePreferences,
  saveUserProfilePreferences,
} from "../../services/gameService";
import Button from "../../components/layout/Button";

function Profile() {
  const { user } = useAuth();
  const uid: string | undefined = user?.uid;
  const [releaseYears, setReleaseYears] = useState<PreferenceRange>([
    releaseYearBounds.min, releaseYearBounds.max,
  ]);
  const [gameLength, setGameLength] = useState<PreferenceRange>([
    gameLengthBounds.min, gameLengthBounds.max,
  ]);
  const [releaseDateMin, releaseDateMax] = releaseYears;
  const [lengthMin, lengthMax] = gameLength;
  const [genres, setGenres] = useState<string[]>([]);
  const [themes, setThemes] = useState<string[]>([]);
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [loadedUid, setLoadedUid] = useState<string | null>(null);
  const [loadFailedUid, setLoadFailedUid] = useState<string | null>(null);
  const canSave = Boolean(uid && loadedUid === uid);
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
    if (!uid) return;

    let active = true;
    setLoadedUid(null);
    setLoadFailedUid(null);
    fetchUserProfilePreferences(uid).then((data) => {
      if (!active) return;

      setReleaseYears([data.minYear, data.maxYear]);
      setGameLength([data.minTime, data.maxTime]);
      setGenres(data.genres);
      setThemes(data.themes);
      setPlatforms(data.platforms);
      setLoadedUid(uid);
    }).catch((error) => {
      if (!active) return;

      console.error("Nie udało się wczytać preferencji", error);
      setLoadFailedUid(uid);
    });

    return () => {
      active = false;
    };
  }, [uid]);

  async function saveChanges() {
    if (!uid || !canSave) return;

    const data = {
      yearStart: releaseDateMin,
      yearEnd: releaseDateMax,
      genres: genres,
      themes: themes,
      platforms: platforms,
      timeStart: lengthMin,
      timeEnd: lengthMax,
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
      <h2 className="mt-5">Zalogowany jako: {user?.email}</h2>
      {loadFailedUid === uid && <p role="alert">Nie udało się wczytać preferencji. Odśwież stronę, aby spróbować ponownie.</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 xl:gap-28 px-4 mt-6 lg:min-h-140 items-stretch lg:mt-8 w-full lg:max-w-5xl xl:w-2/3">
        <fieldset disabled={!canSave} className="flex flex-col w-full min-w-0 max-h-full justify-between">
          <div className="flex flex-col items-start justify-center">
            <h3 className="text-xl font-bold mb-5">Lata wydania</h3>
            <label htmlFor="release-year-min" className="mb-5">
              <span className="sr-only">Rok wydania </span>Od: <span className="text-xl font-bold">{releaseDateMin}</span>
            </label>
            <input
              id="release-year-min" type="range" min={releaseYearBounds.min} max={releaseYearBounds.max} step={1}
              value={releaseDateMin}
              onChange={(ev) => setReleaseYears([Math.min(ev.target.valueAsNumber, releaseDateMax), releaseDateMax])}
              className="range grow w-full lg:max-w-125 mb-5"
            />
            <label htmlFor="release-year-max" className="mb-5">
              <span className="sr-only">Rok wydania </span>Do: <span className="text-xl font-bold">{releaseDateMax}</span>
            </label>
            <input
              id="release-year-max" type="range" min={releaseYearBounds.min} max={releaseYearBounds.max} step={1}
              value={releaseDateMax}
              onChange={(ev) => setReleaseYears([releaseDateMin, Math.max(ev.target.valueAsNumber, releaseDateMin)])}
              className="range grow w-full lg:max-w-125 mb-5"
            />
          </div>
          <div className="flex flex-col items-start justify-center">
            <h3 className="text-xl font-bold mb-5">Długość gry</h3>
            <label htmlFor="game-length-min" className="mb-5">
              <span className="sr-only">Długość gry </span>Od: <span className="text-xl font-bold">{lengthMin} godz.</span>
            </label>
            <input
              id="game-length-min" type="range" min={gameLengthBounds.min} max={gameLengthBounds.max} step={1}
              value={lengthMin}
              onChange={(ev) => setGameLength([Math.min(ev.target.valueAsNumber, lengthMax), lengthMax])}
              className="range grow w-full lg:max-w-125 mb-5"
            />
            <label htmlFor="game-length-max" className="mb-5">
              <span className="sr-only">Długość gry </span>Do: <span className="text-xl font-bold">{lengthMax} godz.</span>
            </label>
            <input
              id="game-length-max" type="range" min={gameLengthBounds.min} max={gameLengthBounds.max} step={1}
              value={lengthMax}
              onChange={(ev) => setGameLength([lengthMin, Math.max(ev.target.valueAsNumber, lengthMin)])}
              className="range grow w-full lg:max-w-125"
            />
          </div>
        </fieldset>
        <div className="flex flex-col w-full max-h-full gap-6">
          <div className="flex flex-col items-start justify-center">
            <label className="text-xl font-bold mb-5">Ulubione gatunki: </label>
            <details tabIndex={0} className="collapse collapse-plus max-w-full mb-5">
              <summary className="collapse-title">Wybrane gatunki</summary>
              <div className="collapse-content flex flex-wrap gap-2">
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
            </details>
            <select
              value=""
              onChange={(ev) => {
                handleAddGenre(ev.target.value);
              }}
              className="select h-12 w-full lg:max-w-125 grow text-lg rounded-lg border border-gray-500 pl-2 self-center bg-[#1f2326] text-white mb-5"
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
            <label className="text-xl font-bold mb-5">Ulubione motywy: </label>
            <details tabIndex={0} className="collapse collapse-plus max-w-full mb-5">
              <summary className="collapse-title">Wybrane motywy</summary>
              <div className="collapse-content flex flex-wrap gap-2">
                {themes.map((g, index) => (
                  <div key={index} className="join">
                    <span className="btn btn-sm join-item bg-[#1f2326] text-white border-neutral-700 pointer-events-none font-normal text-base">
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
            </details>
            <select
              value=""
              onChange={(ev) => {
                handleAddTheme(ev.target.value);
              }}
              className="select h-12 w-full lg:max-w-125 grow text-lg rounded-lg border border-gray-500 pl-2 self-center bg-[#1f2326] text-white mb-5"
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
            <details tabIndex={0} className="collapse collapse-plus max-w-full mb-5">
              <summary className="collapse-title">Wybrane platformy</summary>
              <div className="collapse-content flex flex-wrap gap-2">
                {platforms.map((g, index) => (
                  <div key={index} className="join">
                    <span className="btn btn-sm join-item bg-[#1f2326] text-white border-neutral-700 pointer-events-none font-normal text-base">
                      {g}
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
            </details>
            <select
              value=""
              onChange={(ev) => {
                handleAddPlatform(ev.target.value);
              }}
              className="select h-12 w-full lg:max-w-125 grow text-lg rounded-lg border border-gray-500 pl-2 self-center bg-[#1f2326] text-white"
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
      <div className="mt-4 mb-24 pointer-fine:mb-6">
        <Button onClickPar={saveChanges} isStandalone={true} disabled={!canSave}>Zapisz zmiany</Button>
      </div>
    </div>
  );
}

export default Profile;
