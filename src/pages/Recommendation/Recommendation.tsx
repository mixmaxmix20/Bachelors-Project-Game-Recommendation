import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import Button from "../../components/common/Button";
import PageHeading from "../../components/layout/PageHeading";
import { protectedPages } from "../../protectedPages";
import ActionFeedback from "../../components/common/ActionFeedback";
import { useSettingsSave } from "../../hooks/useSettingsSave";
import { useAuth } from "../../contexts/AuthContext";
import {
  defaultRecommendationSettings,
  inferPreferences,
  rankRecommendations,
} from "../../domain/recommendations";
import { fetchUserProfilePreferences } from "../../services/profileService";
import {
  fetchRecommendationSettings,
  fetchRecommendationCollection,
  fetchRecommendationHistory,
  fetchRecommendationCandidates,
  saveRecommendationSettings,
} from "../../services/recommendationService";
import type {
  InferredPreferences,
  RecommendationCandidate,
  RecommendationCollectionEntry,
  RecommendationSettings,
  UserProfilePreferences,
} from "../../types/recommendation";
import RecommendationCard from "./RecommendationCard";

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
  const [userSettings, setUserSettings] = useState<{
    uid: string;
    settings: RecommendationSettings;
  } | null>(null);
  const data = loadedData?.uid === uid ? loadedData : null;
  const settings =
    userSettings && userSettings.uid === uid
      ? userSettings.settings
      : defaultRecommendationSettings;
  const {
    ratingWeight: popularityWeight,
    genreWeight,
    criticRatingWeight,
  } = settings;
  const ratingPercent = Math.round(popularityWeight * 100);
  const genrePercent = Math.round(genreWeight * 100);
  const criticPercent = Math.round(criticRatingWeight * 100);
  const { feedback, isSaving, markEdited, save } =
    useSettingsSave("recommendations");
  const [loadFailedUid, setLoadFailedUid] = useState<string | null>(null);
  const loadFailed = loadFailedUid === uid;
  const settingsReady = Boolean(uid && userSettings?.uid === uid);

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
      if (active)
        setLoadedData({
          uid,
          profile,
          collection,
          candidates,
          preferences: inferPreferences(history),
        });
    };

    loadRecommendations().catch((error) => {
      if (active) {
        setLoadFailedUid(uid);
        console.error("Nie udało się wczytać danych rekomendacji", error);
      }
    });

    return () => {
      active = false;
    };
  }, [uid]);

  const userPreferences = data?.preferences;
  const recGames = useMemo(
    () =>
      data
        ? rankRecommendations(
            data.candidates,
            data.collection,
            data.profile,
            data.preferences,
            settings,
          )
        : [],
    [data, settings],
  );
  const maxScore = Math.max(
    0,
    ...recGames.map((game) => game.score).filter(Number.isFinite),
  );

  function updateWeight(weight: keyof RecommendationSettings, value: number) {
    if (!uid || !settingsReady) return;
    markEdited();
    setUserSettings({ uid, settings: { ...settings, [weight]: value } });
  }

  const handleSaveSettings = () => {
    if (uid && settingsReady)
      return save(() => saveRecommendationSettings(uid, settings));
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-full w-full px-5 box-border bg-[#121416] text-[#ddddff] pb-8">
      <PageHeading title={protectedPages.recommendation.label} />
      <details className="collapse collapse-arrow w-full max-w-xl md:max-w-2xl my-4 bg-[#1f2326] rounded-lg">
        <summary className="collapse-title font-semibold">
          Ustawienia rekomendacji
        </summary>
        <div className="collapse-content">
          <div className="my-4 flex flex-col gap-2 text-lg text-white">
            <div>
              <label htmlFor="recommendation-rating-weight">
                Balans ocen i preferencji
              </label>
              {": "}
              {ratingPercent}% / {100 - ratingPercent}%
            </div>
            <input
              id="recommendation-rating-weight"
              type="range"
              min={0}
              max={100}
              step={10}
              value={popularityWeight * 100}
              aria-valuetext={`Oceny ${ratingPercent}%, preferencje ${100 - ratingPercent}%`}
              disabled={!settingsReady}
              onChange={(e) =>
                updateWeight("ratingWeight", Number(e.target.value) / 100)
              }
              className="range grow w-full"
            />
          </div>
          <div className="my-4 flex flex-col gap-2 text-lg text-white">
            <div>
              <label htmlFor="recommendation-genre-weight">
                Balans preferencji
              </label>
              {": "}
              {genrePercent}% gatunek / {100 - genrePercent}% tematyka
            </div>
            <input
              id="recommendation-genre-weight"
              type="range"
              min={0}
              max={100}
              step={10}
              value={genreWeight * 100}
              aria-valuetext={`Gatunek ${genrePercent}%, tematyka ${100 - genrePercent}%`}
              disabled={!settingsReady}
              onChange={(e) =>
                updateWeight("genreWeight", Number(e.target.value) / 100)
              }
              className="range grow w-full"
            />
          </div>
          <div className="my-4 flex flex-col gap-2 text-lg text-white">
            <div>
              <label htmlFor="recommendation-critic-weight">Balans ocen</label>
              {": "}
              {criticPercent}% krytycy / {100 - criticPercent}% gracze
            </div>
            <input
              id="recommendation-critic-weight"
              type="range"
              min={0}
              max={100}
              step={10}
              value={criticRatingWeight * 100}
              aria-valuetext={`Krytycy ${criticPercent}%, gracze ${100 - criticPercent}%`}
              disabled={!settingsReady}
              onChange={(e) =>
                updateWeight("criticRatingWeight", Number(e.target.value) / 100)
              }
              className="range grow w-full"
            />
          </div>
          <div className="text-center">
            <h4>Analiza czasowa:</h4>
            Stosunek twoich czasów gry do średniej globalnej:{" "}
            {userPreferences?.avgPlaytimeRatio?.toFixed(2).replace(".", ",") ??
              "Brak danych"}
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
          <div className="mt-4 flex flex-col items-center">
            <Button
              isStandalone={true}
              onClick={handleSaveSettings}
              disabled={!settingsReady || isSaving}
            >
              Zapisz
            </Button>
            <ActionFeedback feedback={feedback} />
          </div>
        </div>
      </details>
      <div className="flex flex-col gap-5 w-full max-w-5xl px-4 @min-[80rem]/app-content:max-w-3/5 @min-[80rem]/app-content:px-0">
        <p role="status" className="text-center text-ui-muted empty:sr-only">
          {!data && !loadFailed && "Wczytywanie rekomendacji…"}
          {data && recGames.length === 0 && (
            <>
              Brak gier pasujących do bieżących preferencji.{" "}
              <Link
                to={protectedPages.profile.path}
                className="underline underline-offset-4 ui-focus"
              >
                Zmień preferencje w profilu
              </Link>
            </>
          )}
        </p>
        <p role="alert" className="text-center text-red-300 empty:sr-only">
          {loadFailed &&
            "Nie udało się wczytać rekomendacji. Odśwież stronę, aby spróbować ponownie."}
        </p>
        {recGames.map((rec, index) => (
          <RecommendationCard
            key={rec.id}
            rec={rec}
            index={index}
            maxScore={maxScore}
            avgPlaytimeRatio={userPreferences?.avgPlaytimeRatio ?? null}
          />
        ))}
      </div>
    </div>
  );
}

export default Recommendation;
