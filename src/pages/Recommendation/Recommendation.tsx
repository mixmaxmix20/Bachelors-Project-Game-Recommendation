import { useState, useEffect, useMemo } from "react";
import Navbar from "../../components/layout/Navbar";
import RecommendationCard from "../../components/layout/RecommendationCard";
import Button from "../../components/layout/Button";
import { useAuth } from "../../contexts/AuthContext";
import { defaultRecommendationSettings, inferPreferences, rankRecommendations } from "../../domain/recommendations";
import {
  fetchUserProfilePreferences,
  fetchRecommendationSettings,
  fetchRecommendationCollection,
  fetchRecommendationHistory,
  fetchRecommendationCandidates,
  saveRecommendationSettings,
} from "../../services/gameService";
import type {
  InferredPreferences,
  RecommendationCandidate,
  RecommendationCollectionEntry,
  RecommendationSettings,
  UserProfilePreferences,
} from "../../types/recommendation";

interface RecommendationData {
  uid: string;
  profile: UserProfilePreferences;
  collection: RecommendationCollectionEntry[];
  preferences: InferredPreferences;
  candidates: RecommendationCandidate[];
}

function Recommendation() {
  const { user } = useAuth();
  const uid = user?.uid;
  const [loadedData, setLoadedData] = useState<RecommendationData | null>(null);
  const [userSettings, setUserSettings] = useState<{ uid: string; settings: RecommendationSettings } | null>(null);
  const data = loadedData?.uid === uid ? loadedData : null;
  const settings = userSettings && userSettings.uid === uid ? userSettings.settings : defaultRecommendationSettings;
  const { ratingWeight: popularityWeight, genreWeight, criticRatingWeight } = settings;

  useEffect(() => {
    if (!uid) return;
    let active = true;

    const loadRecommendations = async () => {
      const profile = await fetchUserProfilePreferences(uid);
      if (!active) return;

      const settings = await fetchRecommendationSettings(uid);
      if (!active) return;
      setUserSettings({ uid, settings });

      const collection = await fetchRecommendationCollection(uid);
      if (!active) return;

      const [candidates, history] = await Promise.all([
        fetchRecommendationCandidates(profile.minYear, profile.maxYear),
        fetchRecommendationHistory(collection),
      ]);
      if (active) setLoadedData({ uid, profile, collection, candidates, preferences: inferPreferences(history) });
    };

    loadRecommendations().catch((error) => {
      if (active) console.error("Nie udało się wczytać danych rekomendacji", error);
    });

    return () => {
      active = false;
    };
  }, [uid]);

  const userPreferences = data?.preferences;
  const recGames = useMemo(
    () => data
      ? rankRecommendations(data.candidates, data.collection, data.profile, data.preferences, settings)
      : [],
    [data, settings]
  );
  const maxScore = Math.max(0, ...recGames.map((game) => game.score).filter(Number.isFinite));

  function updateWeight(weight: keyof RecommendationSettings, value: number) {
    if (uid) setUserSettings({ uid, settings: { ...settings, [weight]: value } });
  }

  const handleSaveSettings = async () => {
    if (!uid) return;

    try {
      await saveRecommendationSettings(uid, settings);
    } catch (error) {
      console.error("Błąd zapisu:", error);
    }
  };

  return (
    <div className="flex flex-col items-center justify-start pt-6 sm:pt-10 min-h-screen w-full p-5 box-border bg-[#121416] text-[#ddddff] pb-24 pointer-fine:pb-8">
      <Navbar />
      <div tabIndex={0} className="collapse collapse-arrow w-full max-w-xl md:max-w-2xl my-4 bg-[#1f2326] rounded-lg">
        <div className="collapse-title font-semibold">
          Ustawienia rekomendacji
        </div>
        <div className="collapse-content">
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
                  updateWeight("ratingWeight", Number(e.target.value) / 100)
                }
                className="range grow w-full"
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
                onChange={(e) => updateWeight("genreWeight", Number(e.target.value) / 100)}
                className="range grow w-full"
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
                  updateWeight("criticRatingWeight", Number(e.target.value) / 100)
                }
                className="range grow w-full"
              />
            </label>
          </div>
          <div className="text-center">
            <h4>Analiza czasowa:</h4>
            Stosunek twoich czasów gry do średniej globalnej:{" "}
            {userPreferences?.avgPlaytimeRatio?.toFixed(2) ?? "Brak danych"}
          </div>
          <div className="text-center">
            Twoja typowa długość rozgrywki:{" "}
            {userPreferences?.timePreference === "long"
              ? "Długa"
              : userPreferences?.timePreference === "short"
                ? "Krótka"
                : userPreferences?.timePreference === "medium"
                  ? "Średnia"
                  : "Brak danych"}
          </div>
          <div className="mt-4 flex justify-center">
            <Button isStandalone={true} onClickPar={handleSaveSettings}>Zapisz</Button>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-5 w-full max-w-5xl px-4 xl:max-w-3/5 xl:px-0">
        {recGames.map((rec, index) => (
          <RecommendationCard key={rec.id} rec={rec} index={index} maxScore={maxScore} avgPlaytimeRatio={userPreferences?.avgPlaytimeRatio ?? null} />
        ))}
      </div>
    </div>
  );
}

export default Recommendation;
