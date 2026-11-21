import { availablePlatforms } from "../../domain/platforms";
import {
  gameLengthBounds,
  releaseYearBounds,
  type PreferenceRange,
} from "../../domain/profileRanges";
import { formatHours } from "../../components/common/formatNumbers";
import { useState, useEffect } from "react";
import Navbar from "../../components/layout/Navbar";
import { useAuth } from "../../contexts/AuthContext";
import {
  fetchUserProfilePreferences,
  saveUserProfilePreferences,
} from "../../services/gameService";
import Button from "../../components/layout/Button";

import PreferenceSelector from "./PreferenceSelector";

const availableGenres = [
  { label: "Przygodowa", value: "Adventure" },
  { label: "Zręcznościowa", value: "Arcade" },
  { label: "Karciana i planszowa", value: "Card & Board Game" },
  { label: "Bijatyka", value: "Fighting" },
  {
    label: "Hack and Slash/Bijatyka chodzona",
    value: "Hack and Slash/Beat 'em up",
  },
  { label: "Niezależna", value: "Indie" },
  { label: "Muzyczna", value: "Music" },
  { label: "MOBA", value: "MOBA" },
  { label: "Platformowa", value: "Platform" },
  { label: "Pinball", value: "Pinball" },
  { label: "Wskaż i kliknij", value: "Point-and-click" },
  { label: "Logiczna", value: "Puzzle" },
  { label: "Strategia czasu rzeczywistego", value: "RTS" },
  { label: "RPG", value: "RPG" },
  { label: "Wyścigowa", value: "Racing" },
  { label: "Strzelanka", value: "Shooter" },
  { label: "Symulacja", value: "Simulator" },
  { label: "Sportowa", value: "Sport" },
  { label: "Strategia", value: "Strategy" },
  { label: "Strategia turowa", value: "TBS" },
  { label: "Taktyczna", value: "Tactical" },
  { label: "Powieść wizualna", value: "Visual Novel" },
];
const availableThemes = [
  { label: "Akcji", value: "Action" },
  { label: "Fantasy", value: "Fantasy" },
  { label: "Science fiction", value: "Science fiction" },
  { label: "Horror", value: "Horror" },
  { label: "Thriller", value: "Thriller" },
  { label: "Survival", value: "Survival" },
  { label: "Historyczne", value: "Historical" },
  { label: "Skradanka", value: "Stealth" },
  { label: "Komediowe", value: "Comedy" },
  { label: "Biznesowe", value: "Business" },
  { label: "Dramat", value: "Drama" },
  { label: "Oparte na faktach", value: "Non-fiction" },
  { label: "Piaskownica", value: "Sandbox" },
  { label: "Edukacyjne", value: "Educational" },
  { label: "Dla dzieci", value: "Kids" },
  { label: "Otwarty świat", value: "Open world" },
  { label: "Wojenne", value: "Warfare" },
  { label: "Imprezowe", value: "Party" },
  { label: "4X", value: "4X" },
  { label: "Tajemnicza", value: "Mystery" },
  { label: "Romans", value: "Romance" },
];
const platformOptions = availablePlatforms.map((value) => ({
  value,
  label: value,
}));

function Profile() {
  const { user } = useAuth();
  const uid: string | undefined = user?.uid;
  const [releaseYears, setReleaseYears] = useState<PreferenceRange>([
    releaseYearBounds.min,
    releaseYearBounds.max,
  ]);
  const [gameLength, setGameLength] = useState<PreferenceRange>([
    gameLengthBounds.min,
    gameLengthBounds.max,
  ]);
  const [releaseDateMin, releaseDateMax] = releaseYears;
  const [lengthMin, lengthMax] = gameLength;
  const [genres, setGenres] = useState<string[]>([]);
  const [themes, setThemes] = useState<string[]>([]);
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [loadedUid, setLoadedUid] = useState<string | null>(null);
  const [loadFailedUid, setLoadFailedUid] = useState<string | null>(null);
  const canSave = Boolean(uid && loadedUid === uid);
  useEffect(() => {
    if (!uid) return;

    let active = true;
    setLoadedUid(null);
    setLoadFailedUid(null);
    fetchUserProfilePreferences(uid)
      .then((data) => {
        if (!active) return;

        setReleaseYears([data.minYear, data.maxYear]);
        setGameLength([data.minTime, data.maxTime]);
        setGenres([...new Set(data.genres)]);
        setThemes([...new Set(data.themes)]);
        setPlatforms(data.platforms);
        setLoadedUid(uid);
      })
      .catch((error) => {
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
      console.error("Nie udało się zaktualizować danych", error);
      alert("Nie udało się zapisać danych");
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#121416] text-[#ddddff]">
      <Navbar />
      <h2 className="mt-5">Zalogowany jako: {user?.email}</h2>
      {loadFailedUid === uid && (
        <p role="alert">
          Nie udało się wczytać preferencji. Odśwież stronę, aby spróbować
          ponownie.
        </p>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 xl:gap-28 px-4 mt-6 lg:min-h-140 items-stretch lg:mt-8 w-full lg:max-w-5xl xl:w-2/3">
        <fieldset
          disabled={!canSave}
          className="flex flex-col w-full min-w-0 max-h-full justify-between"
        >
          <div className="flex flex-col items-start justify-center">
            <h3 className="text-xl font-bold mb-5">Lata wydania</h3>
            <label htmlFor="release-year-min" className="mb-5">
              <span className="sr-only">Rok wydania </span>Od:{" "}
              <span className="text-xl font-bold">{releaseDateMin}</span>
            </label>
            <input
              id="release-year-min"
              type="range"
              min={releaseYearBounds.min}
              max={releaseYearBounds.max}
              step={1}
              value={releaseDateMin}
              onChange={(ev) =>
                setReleaseYears([
                  Math.min(ev.target.valueAsNumber, releaseDateMax),
                  releaseDateMax,
                ])
              }
              className="range grow w-full lg:max-w-125 mb-5"
            />
            <label htmlFor="release-year-max" className="mb-5">
              <span className="sr-only">Rok wydania </span>Do:{" "}
              <span className="text-xl font-bold">{releaseDateMax}</span>
            </label>
            <input
              id="release-year-max"
              type="range"
              min={releaseYearBounds.min}
              max={releaseYearBounds.max}
              step={1}
              value={releaseDateMax}
              onChange={(ev) =>
                setReleaseYears([
                  releaseDateMin,
                  Math.max(ev.target.valueAsNumber, releaseDateMin),
                ])
              }
              className="range grow w-full lg:max-w-125 mb-5"
            />
          </div>
          <div className="flex flex-col items-start justify-center">
            <h3 className="text-xl font-bold mb-5">Długość gry</h3>
            <label htmlFor="game-length-min" className="mb-5">
              <span className="sr-only">Długość gry </span>Od:{" "}
              <span className="text-xl font-bold">
                {formatHours(lengthMin)}
              </span>
            </label>
            <input
              id="game-length-min"
              type="range"
              min={gameLengthBounds.min}
              max={gameLengthBounds.max}
              step={1}
              value={lengthMin}
              onChange={(ev) =>
                setGameLength([
                  Math.min(ev.target.valueAsNumber, lengthMax),
                  lengthMax,
                ])
              }
              className="range grow w-full lg:max-w-125 mb-5"
            />
            <label htmlFor="game-length-max" className="mb-5">
              <span className="sr-only">Długość gry </span>Do:{" "}
              <span className="text-xl font-bold">
                {formatHours(lengthMax)}
              </span>
            </label>
            <input
              id="game-length-max"
              type="range"
              min={gameLengthBounds.min}
              max={gameLengthBounds.max}
              step={1}
              value={lengthMax}
              onChange={(ev) =>
                setGameLength([
                  lengthMin,
                  Math.max(ev.target.valueAsNumber, lengthMin),
                ])
              }
              className="range grow w-full lg:max-w-125"
            />
          </div>
        </fieldset>
        <fieldset
          disabled={!canSave}
          className="flex flex-col w-full min-w-0 max-h-full gap-6"
        >
          <PreferenceSelector
            label="Ulubione gatunki:"
            summary="Wybrane gatunki"
            placeholder="Wybierz gatunek"
            options={availableGenres}
            selected={genres}
            onChange={setGenres}
          />
          <PreferenceSelector
            label="Ulubione motywy:"
            summary="Wybrane motywy"
            placeholder="Wybierz motyw"
            options={availableThemes}
            selected={themes}
            onChange={setThemes}
          />
          <PreferenceSelector
            label="Platformy:"
            summary="Wybrane platformy"
            placeholder="Wybierz platformę"
            options={platformOptions}
            selected={platforms}
            onChange={setPlatforms}
          />
        </fieldset>
      </div>
      <div className="mt-4 mb-24 pointer-fine:mb-6">
        <Button onClick={saveChanges} isStandalone={true} disabled={!canSave}>
          Zapisz zmiany
        </Button>
      </div>
    </div>
  );
}

export default Profile;
