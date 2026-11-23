import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase";
import type { UserProfilePreferences } from "../types/recommendation";
import { normalizePlatforms } from "../domain/platforms";
import {
  gameLengthBounds,
  normalizePreferenceRange,
  releaseYearBounds,
} from "../domain/profileRanges";

const getProfilePreferencesRef = (uid: string) =>
  doc(db, "users", uid, "profileInfo", "preferences");

export const fetchUserProfilePreferences = async (
  uid: string,
): Promise<UserProfilePreferences> => {
  const snapshot = await getDoc(getProfilePreferencesRef(uid));
  const data = snapshot.data() ?? {};
  const [minYear, maxYear] = normalizePreferenceRange(
    data.yearStart,
    data.yearEnd,
    releaseYearBounds,
  );
  const [minTime, maxTime] = normalizePreferenceRange(
    data.timeStart,
    data.timeEnd,
    gameLengthBounds,
  );

  return {
    minTime,
    maxTime,
    minYear,
    maxYear,
    platforms: normalizePlatforms(data.platforms ?? []),
    genres: data.genres || [],
    themes: data.themes || [],
  };
};

export const saveUserProfilePreferences = async (
  uid: string,
  data: {
    yearStart: number;
    yearEnd: number;
    genres: string[];
    themes: string[];
    platforms: string[];
    timeStart: number;
    timeEnd: number;
  },
) => {
  const [yearStart, yearEnd] = normalizePreferenceRange(
    data.yearStart,
    data.yearEnd,
    releaseYearBounds,
  );
  const [timeStart, timeEnd] = normalizePreferenceRange(
    data.timeStart,
    data.timeEnd,
    gameLengthBounds,
  );
  return setDoc(
    getProfilePreferencesRef(uid),
    {
      ...data,
      yearStart,
      yearEnd,
      timeStart,
      timeEnd,
      platforms: normalizePlatforms(data.platforms),
    },
    { merge: true },
  );
};
