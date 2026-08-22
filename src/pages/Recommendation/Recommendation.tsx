import Navbar from "../../components/layout/Navbar";
import { useState, useEffect, useCallback } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../../services/firebase";
import {
  collection,
  getDocs,
  query,
  DocumentData,
  where,
  and,
  orderBy,
  limit,
} from "firebase/firestore";
import {
  fetchUserProfilePreferences,
  fetchRecommendationSettings,
  saveRecommendationSettings,
} from "../../services/gameService";
import Button from "../../components/layout/Button";

interface Preferences {
  minTime: number;
  maxTime: number;
  minYear: number;
  maxYear: number;
  platforms: string[];
  genres: string[];
  themes: string[];
}

interface Recommendation {
  id: number;
  name: string;
  cover: string;
  platforms: string;
  description: string;
  rating: number;
  time: number;
  releaseDate: number;
  genres: string;
  themes: string;
  score: number;
  globalRating: number;
  userPlaytimeRatio: number;
}

type UserPreferences = {
  genreWeights: Record<string, number>;
  themeWeights: Record<string, number>;
  timePreference: "short" | "medium" | "long";
  avgPlaytimeRatio: number;
};


function Recommendation() {
  const [recGames, setRec] = useState<Recommendation[]>([]);
  const [uid, setUid] = useState<string | null>(null);
  const [maxScore, setMaxScore] = useState<number>(0);
  const [popularityWeight, setPopularityWeight] = useState(0.2);
  const [genreWeight, setGenreWeight] = useState(0.6);
  const [criticRatingWeight, setCriticRatingWeight] = useState(0.5);
  const [allGames, setAllGames] = useState<Recommendation[]>([]);
  const [ratedGames, setRatedGames] = useState<DocumentData[]>([]);
  const [userProfilePreferences, setUserProfilePreferences] =
    useState<Preferences | null>(null);
  const [userPreferences, setUserPreferences] =
    useState<UserPreferences | null>(null);
  const platformCompatibility: { [key: string]: string[] } = {
    "Xbox Series X/S": ["Xbox One"],
    "Xbox One": ["Xbox 360", "Xbox"],
    "Xbox 360": ["Xbox"],
    "PlayStation 5": ["PlayStation 4"],
    "PlayStation 2": ["PlayStation 1"],
    "PlayStation Vita": ["PlayStation 1", "PlayStation Portable"],
    "PlayStation Portable": ["PlayStation 1"],
    "Wii U": ["Wii"],
    Wii: ["GameCube"],
    "Nintendo 3DS": ["Nintendo DS"],
    "Nintendo DS": ["Game Boy Advance"],
  };

  const splitString = (str?: string): string[] => {
    if (!str) return [];
    return str
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  };

  const calculateUserPreferences = useCallback(
    (
      ratedGames: DocumentData[],
      allGames: Recommendation[]
    ): UserPreferences => {
      const genreWeights: Record<string, number> = {};
      const themeWeights: Record<string, number> = {};
      let totalWeight = 0;
      let totalPlaytimeRatio = 0;
      let playtimeCount = 0;
      const ratios: number[] = [];

      ratedGames.forEach((ratedGame) => {
        const fullGame = allGames.find((g) => g.id.toString() === ratedGame.id);
        if (!fullGame || !ratedGame.playtime) return;

        const playtimeRatio = ratedGame.playtime / fullGame.time;
        ratios.push(playtimeRatio);
        totalPlaytimeRatio += playtimeRatio;
        playtimeCount++;

        const rating = ratedGame.starRating;
        const weight = (rating - 1) / 4;
        totalWeight += weight;

        splitString(fullGame.genres).forEach((genre) => {
          genreWeights[genre] = (genreWeights[genre] || 0) + weight;
        });

        splitString(fullGame.themes).forEach((theme) => {
          themeWeights[theme] = (themeWeights[theme] || 0) + weight;
        });
      });

      const avgPlaytimeRatio =
        ratios.reduce((a, b) => a + b, 0) / ratios.length;

      const variance =
        ratios.reduce((sum, r) => sum + (r - avgPlaytimeRatio) ** 2, 0) /
        ratios.length;
      const stdDev = Math.sqrt(variance);

      const zScore = (avgPlaytimeRatio - 1.0) / stdDev;

      const timePreference =
        zScore < -0.5 ? "short" : zScore > 0.5 ? "long" : "medium";

      if (totalWeight > 0) {
        Object.keys(genreWeights).forEach((key) => {
          genreWeights[key] /= totalWeight;
        });
        Object.keys(themeWeights).forEach((key) => {
          themeWeights[key] /= totalWeight;
        });
      }

      return { genreWeights, themeWeights, timePreference, avgPlaytimeRatio };
    },
    []
  );

  const calculateGameScore = (
    game: Recommendation,
    userPreferences: UserPreferences,
    ratedGamesCount: number,
    userProfilePreferences: Preferences
  ): number => {
    const personalizationWeight = 1 - popularityWeight;
    const themeWeight = 1 - genreWeight;
    const userRatingWeight = 1 - criticRatingWeight;

    const normalizedRating = game.rating / 100;
    const normalizedUserRating = game.globalRating / 5;
    const combinedRating =
      normalizedRating * criticRatingWeight +
      normalizedUserRating * userRatingWeight;
    const popularityScore = combinedRating * popularityWeight;

    let personalizationScore = 0;
    if (ratedGamesCount > 0) {
      let genreScore = 0;
      let themeScore = 0;

      splitString(game.genres).forEach((genre) => {
        genreScore += userPreferences.genreWeights[genre] || 0;
      });

      splitString(game.themes).forEach((theme) => {
        themeScore += userPreferences.themeWeights[theme] || 0;
      });

      const rawScore = genreScore * genreWeight + themeScore * themeWeight;
      personalizationScore = rawScore * personalizationWeight;
    }

    const totalScore = popularityScore + personalizationScore;

    const timeEngagementScore = calculateTimeEngagement(
      game,
      userPreferences,
      userProfilePreferences
    );

    return totalScore * 0.7 + timeEngagementScore * 0.3;
  };

  const calculateTimeEngagement = (
    game: Recommendation,
    prefs: UserPreferences,
    userTimePrefs: Preferences
  ) => {
    const expectedPlaytime = game.time * prefs.avgPlaytimeRatio;

    let rangeMatch;
    if (
      expectedPlaytime >= userTimePrefs.minTime &&
      expectedPlaytime <= userTimePrefs.maxTime
    ) {
      rangeMatch = 1;
    } else {
      const distance =
        expectedPlaytime < userTimePrefs.minTime
          ? userTimePrefs.minTime - expectedPlaytime
          : expectedPlaytime - userTimePrefs.maxTime;

      const penalty = 1 - Math.exp(-0.2 * Math.max(0, distance - 5));
      rangeMatch = Math.max(0, 1 - penalty);
    }

    let preferenceBonus = 0;
    if (prefs.timePreference === "long" && expectedPlaytime >= 50) {
      preferenceBonus = 1;
    } else if (
      prefs.timePreference === "medium" &&
      expectedPlaytime > 15 &&
      expectedPlaytime < 50
    ) {
      preferenceBonus = 1;
    } else if (prefs.timePreference === "short" && expectedPlaytime <= 15) {
      preferenceBonus = 1;
    }

    return rangeMatch * 0.8 + preferenceBonus * 0.4;
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return;

      const { uid } = user;
      setUid(uid);

      const preferences = await fetchUserProfilePreferences(uid);
      setUserProfilePreferences(preferences);

      const settings = await fetchRecommendationSettings(uid);
      setPopularityWeight(settings.ratingWeight);
      setGenreWeight(settings.genreWeight);
      setCriticRatingWeight(settings.criticRatingWeight);

      const userGamesRef = collection(db, `users/${uid}/games`);
      const userGamesSnapshot = await getDocs(userGamesRef);
      const ratedGamesData = userGamesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setRatedGames(ratedGamesData);

      const gamesRef = collection(db, "gamesDatabase");

      const q = query(
        gamesRef,
        and(
          where("year", ">=", preferences?.minYear),
          where("year", "<=", preferences?.maxYear)
        ),
        orderBy("rating", "desc"),
        limit(100)
      );
      const gamesSnapshot = await getDocs(q);
      const allGamesData = gamesSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: parseInt(doc.id, 10),
          name: data.name,
          cover: data.coverId,
          platforms: data.platforms,
          description: data.desc,
          rating: data.rating,
          time: data.time,
          releaseDate: data.year,
          genres: data.genres,
          themes: data.themes,
          score: 0,
          globalRating:
            data.ratingCount > 0 ? data.totalRatings / data.ratingCount : 0,
          userPlaytimeRatio: 1,
        };
      });
      setAllGames(allGamesData);

      const calculatedPreferences = calculateUserPreferences(
        ratedGamesData,
        allGamesData
      );
      setUserPreferences(calculatedPreferences);
    });

    return () => unsubscribe();
  }, [calculateUserPreferences]);

  useEffect(() => {
    if (!userPreferences || !userProfilePreferences) return;

    const calculateRecommendations = () => {
      const recommendations = allGames
        .filter((game) => !ratedGames.some((g) => g.id === game.id.toString()))
        .map((game) => ({
          ...game,
          score: calculateGameScore(
            game,
            userPreferences,
            ratedGames.length,
            userProfilePreferences
          ),
        }))
        .filter((game) => {
          const matchesYear =
            game.releaseDate >= userProfilePreferences.minYear &&
            game.releaseDate <= userProfilePreferences.maxYear;
          const matchesPlatform = userProfilePreferences.platforms.some(
            (userPlatform) => {
              const compatiblePlatforms =
                platformCompatibility[userPlatform] || [];
              const allPlatformsToCheck = [
                userPlatform,
                ...compatiblePlatforms,
              ];
              return splitString(game.platforms).some((gamePlatform) =>
                allPlatformsToCheck.includes(gamePlatform)
              );
            }
          );
          const matchesGenre = userProfilePreferences.genres.some((g) =>
            splitString(game.genres).includes(g)
          );
          const matchesTheme = userProfilePreferences.themes.some(
            (t) =>
              splitString(game.themes).includes(t) ||
              splitString(game.themes).includes("-")
          );
          return (
            matchesYear && matchesPlatform && matchesGenre && matchesTheme
          );
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);

      setMaxScore(Math.max(...recommendations.map((g) => g.score)));

      setRec(recommendations);
    };
    calculateRecommendations();

    if (import.meta.hot) {
      import.meta.hot.accept(() => {
        console.log("Przeładowanie rekomendacji.");
        calculateRecommendations();
      });
    }
  }, [
    userPreferences,
    userProfilePreferences,
    allGames,
    ratedGames,
    popularityWeight,
    genreWeight,
    criticRatingWeight,
  ]);

  const handleSaveSettings = async () => {
    if (!uid) return;

    try {
      await saveRecommendationSettings(uid, {
        ratingWeight: popularityWeight,
        genreWeight: genreWeight,
        criticRatingWeight: criticRatingWeight,
      });
    } catch (error) {
      console.error("Błąd zapisu:", error);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full p-5 box-border bg-[#121416] text-[#ddddff]">
      <Navbar />
      <div className="my-4 p-4 bg-[#1f2326] rounded-lg">
        <div className="my-4">
          <label className="flex flex-col gap-2 text-lg text-white">
            Balans oceny/preferencje: {(popularityWeight * 100).toFixed(0)}% /{" "}
            {(100 - 100 * popularityWeight).toFixed(0)}%
            <input
              type="range"
              min={0}
              max={100}
              step={10}
              value={popularityWeight * 100}
              onChange={(e) =>
                setPopularityWeight(Number(e.target.value) / 100)
              }
              className="range grow w-150"
            />
          </label>
        </div>
        <div className="my-4">
          <label className="flex flex-col gap-2 text-lg text-white">
            Balans preferencji: {(genreWeight * 100).toFixed(0)}% gatunek /{" "}
            {(100 - 100 * genreWeight).toFixed(0)}% tematyka
            <input
              type="range"
              min={0}
              max={100}
              step={10}
              value={genreWeight * 100}
              onChange={(e) => setGenreWeight(Number(e.target.value) / 100)}
              className="range grow w-150"
            />
          </label>
        </div>
        <div className="my-4">
          <label className="flex flex-col gap-2 text-lg text-white">
            Balans ocen: {(criticRatingWeight * 100).toFixed(0)}% krytycy /{" "}
            {(100 - criticRatingWeight * 100).toFixed(0)}% gracze
            <input
              type="range"
              min={0}
              max={100}
              step={10}
              value={criticRatingWeight * 100}
              onChange={(e) =>
                setCriticRatingWeight(Number(e.target.value) / 100)
              }
              className="range grow w-150"
            />
          </label>
        </div>
        <div className="text-center">
          <h4>Analiza czasowa:</h4>
          Stosunek twoich czasów gry do średniej globalnej:{" "}
          {userPreferences?.avgPlaytimeRatio.toFixed(2)}
        </div>
        <div className="text-center">
          Twoja typowa długość rozgrywki:{" "}
          {userPreferences?.timePreference === "long"
            ? "Długa"
            : userPreferences?.timePreference === "short"
              ? "Krótka"
              : userPreferences?.timePreference === "medium"
                ? "Średnia"
                : "Nieokreślona"}
        </div>
        <div className="my-4 flex justify-center">
          <Button isStandalone={true} onClickPar={handleSaveSettings}>Zapisz</Button>
        </div>
      </div>
      <div className="flex flex-col gap-5 max-w-4/5 w-full">
        {recGames.map((rec, index) => (
          <div className="relative flex items-center" key={rec.id}>
            <div className="absolute -left-10 text-xl font-bold text-white bg-black py-1.5 px-2.5 text-center w-7.5 h-7.5 flex justify-center items-center">
              {index + 1}
            </div>
            <div className="flex bg-black border border-white rounded-lg overflow-hidden shadow-[0_4px_8px_rgba(255,255,255,0.1)] w-full max-w-full">
              <img
                src={`https://images.igdb.com/igdb/image/upload/t_cover_big/${rec.cover}.png`}
                alt={`${rec.name} cover`}
                className="w-50 h-auto object-cover"
              />
              <div className="flex-1 p-5 flex flex-col justify-between text-white">
                <h3 className="text-2xl font-bold mb-2.5">{rec.name}</h3>
                <div className="text-sm text-[#bbb] mb-1.25">{rec.releaseDate}</div>
                <div className="text-sm text-[#bbb] mb-1.25">{rec.platforms}</div>
                <div className="text-sm text-[#bbb] mb-1.25">
                  Średni czas gry: {rec.time}h
                </div>
                <div className="text-sm text-[#bbb] mb-1.25">
                  Oczekiwany czas gry:{" "}
                  {(
                    rec.time * (userPreferences?.avgPlaytimeRatio || 1)
                  ).toFixed(1)}
                  h
                </div>
                <div className="text-sm leading-normal">
                  {rec.description}
                </div>
                <h4 className="mt-1.25 text-base text-orange-500">
                  Średnia ocena krytyków: {rec.rating}
                </h4>
                <h4 className="mt-1.25 text-base text-orange-500">
                  Średnia ocena graczy: {rec.globalRating.toFixed(1)}
                </h4>
                <h4 className="mt-1.25 text-base text-orange-500">
                  Dopasowanie: {((rec.score / maxScore) * 100).toFixed(1)}%
                </h4>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Recommendation;
