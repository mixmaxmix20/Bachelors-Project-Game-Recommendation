import assert from "node:assert/strict";
import test from "node:test";
import { defaultRecommendationSettings, inferPreferences, rankRecommendations, resolveRecommendationSettings } from "../src/domain/recommendations.ts";

import { loadRecommendationHistory } from "../src/services/recommendationHistory.ts";

const profile = {
  minTime: 20,
  maxTime: 55,
  minYear: 2000,
  maxYear: 2025,
  platforms: ["Wii"],
  genres: ["RPG", "Adventure"],
  themes: ["Fantasy", "Action"],
};
const explicitWeights = { ratingWeight: 0.2, genreWeight: 0.6, criticRatingWeight: 0.5 };

function game(id, overrides = {}) {
  return {
    id,
    name: `Game ${id}`,
    cover: "cover",
    platforms: "GameCube",
    description: "",
    rating: 80,
    time: 40,
    releaseDate: 2020,
    genres: "RPG",
    themes: "Fantasy",
    globalRating: 3,
    ...overrides,
  };
}

const history = [
  { id: "1", starRating: 5, playtime: 30, time: 20, genres: " RPG, Adventure, ", themes: "Fantasy" },
  { id: "2", starRating: 3, playtime: 40, time: 40, genres: "RPG", themes: "Action" },
];
const candidates = [
  game(1, { time: 20, genres: " RPG, Adventure, " }),
  game(2, { themes: "Action" }),
  game(3),
  game(4, { time: 16, rating: 100, globalRating: 5, genres: "Adventure", themes: "Action" }),
];

function assertScores(recommendations, expected) {
  assert.deepEqual(recommendations.map(({ id }) => id), expected.map(([id]) => id));
  recommendations.forEach(({ score }, index) => {
    const expectedScore = expected[index][1];
    assert.ok(Math.abs(score - expectedScore) < 1e-12, `expected ${expectedScore}, got ${score}`);
  });
}

test("infers normalized weights and ranks the same games when the slider settings change", () => {
  const inferred = inferPreferences(history);

  // Ratios of 1.5 and 1 give a mean of 1.25, standard deviation of 0.25 and z-score of 1.
  assert.deepEqual(inferred, {
    genreWeights: { RPG: 1, Adventure: 2 / 3 },
    themeWeights: { Fantasy: 2 / 3, Action: 1 / 3 },
    ratedGamesCount: 2,
    timePreference: "long",
    avgPlaytimeRatio: 1.25,
  });

  // Game 3 gets the long-playtime bonus at 50 h. Game 4 reaches the 20 h lower bound.
  assertScores(rankRecommendations(candidates, history, profile, inferred, explicitWeights), [
    [3, 0.9433333333333333],
    [4, 0.6786666666666666],
  ]);
  const alternateWeights = { ratingWeight: 0.9, genreWeight: 0.2, criticRatingWeight: 0.8 };
  assertScores(rankRecommendations(candidates, history, profile, inferred, alternateWeights), [
    [4, 0.898],
    [3, 0.8901333333333333],
  ]);
});

test("keeps exact collection ID matching and applies all explicit filters and the dash theme", () => {
  const games = [
    game(1, { releaseDate: 2000 }),
    game(2, { releaseDate: 2025, themes: " , -, " }),
    game(3, { releaseDate: 1999 }),
    game(4, { releaseDate: 2026 }),
    game(5, { platforms: "Xbox One" }),
    game(6, { genres: "Shooter" }),
    game(7, { themes: "Horror" }),
    game(8),
    game(9),
  ];
  const collection = [{ id: "8" }, { id: "09" }];
  const inferred = inferPreferences([]);
  assert.deepEqual(inferred.genreWeights, {});

  const recommendations = rankRecommendations(games, collection, profile, inferred, explicitWeights);
  assert.deepEqual(recommendations.map(({ id }) => id), [1, 2, 9]);

  for (const filter of ["platforms", "genres", "themes"]) {
    assert.deepEqual(
      rankRecommendations(games, collection, { ...profile, [filter]: [] }, inferred, explicitWeights),
      []
    );
  }
});

test("keeps input order for equal scores and takes only the first ten", () => {
  const games = Array.from({ length: 12 }, (_, index) => game(12 - index));
  const inferred = inferPreferences(history);
  const recommendations = rankRecommendations(games, [], profile, inferred, explicitWeights);

  assert.deepEqual(recommendations.map(({ id }) => id), [12, 11, 10, 9, 8, 7, 6, 5, 4, 3]);
  assert.equal(new Set(recommendations.map(({ score }) => score)).size, 1);
  assert.ok(games.every((candidate) => !("score" in candidate)));
});

test("applies the five-hour tolerance and exponential playtime penalty", () => {
  const games = [game(3, { time: 48 }), game(4, { time: 56 })];
  const inferred = inferPreferences(history.map(({ starRating, ...entry }) => entry));
  const recommendations = rankRecommendations(games, [], profile, inferred, {
    ...explicitWeights,
    ratingWeight: 0,
  });

  // At 60 h and 70 h, both get the long bonus. The second has a net distance of 10 h.
  assertScores(recommendations, [[3, 0.36], [4, 0.15248046797678705]]);
});

test("uses the slider defaults for missing settings and preserves each explicit zero", () => {
  assert.deepEqual(defaultRecommendationSettings, { ratingWeight: 0.2, genreWeight: 0.5, criticRatingWeight: 0.5 });
  assert.deepEqual(resolveRecommendationSettings(), defaultRecommendationSettings);
  for (const key of Object.keys(defaultRecommendationSettings)) {
    assert.deepEqual(resolveRecommendationSettings({ [key]: 0 }), { ...defaultRecommendationSettings, [key]: 0 });
  }
});

test("an older favorite outside the candidate pool changes the ranking without a playtime", async () => {
  const favorite = game(987, { releaseDate: 1998, genres: "Adventure", themes: "Action" });
  const collection = [{ id: "987", starRating: 5 }, { id: "3" }];
  const pool = [game(1), game(2, { genres: "Adventure", themes: "Action" }), game(3)];
  const rank = (history) => rankRecommendations(pool, collection, profile, inferPreferences(history),
    defaultRecommendationSettings).map(({ id }) => id);

  const history = await loadRecommendationHistory(collection, async (ids) => {
    assert.deepEqual(ids, ["987"]);
    return [{ ...favorite, id: "987" }];
  });
  assert.deepEqual(rank([]), [1, 2]);
  assert.deepEqual(rank(history), [2, 1]);
});

test("loads distinct observed IDs in batches, joins by ID and skips missing catalog games", async () => {
  const entries = Array.from({ length: 33 }, (_, index) => ({ id: String(index), starRating: 5 }));
  entries[32] = { id: "32", playtime: 25 };
  const reads = [];
  const history = await loadRecommendationHistory([...entries, entries[0], { id: "empty" }], async (ids) => {
    reads.push(ids);
    return ids.filter((id) => id !== "2").reverse().map((id) => ({ id, genres: "RPG", time: 50 }));
  });
  assert.deepEqual(reads, [entries.slice(0, 30).map(({ id }) => id), ["30", "31", "32"]]);
  assert.equal(history.length, 32);
  assert.equal(inferPreferences(history).ratedGamesCount, 31);
  assert.equal(inferPreferences(history).avgPlaytimeRatio, 0.5);
  for (const empty of [[], [{ id: "1", starRating: 0, playtime: 0 }]]) {
    assert.deepEqual(await loadRecommendationHistory(empty, () => assert.fail("unexpected catalog read")), []);
  }
});

test("counts only usable ratings, including one star, and infers time independently", () => {
  const inferred = inferPreferences([
    { id: "1", starRating: 1, genres: "RPG" },
    { id: "2", starRating: 5, themes: "Fantasy", playtime: 10, time: 0 },
    { id: "3", starRating: 4, genres: "  ", themes: "-" },
    { id: "4", playtime: 20, time: 10, genres: "Adventure" },
    ...[0, 6, 2.5, null, NaN].map((starRating, i) => ({ id: String(i + 5), starRating, themes: "Action" })),
  ]);
  assert.deepEqual(inferred, {
    genreWeights: { RPG: 0 }, themeWeights: { Fantasy: 1 }, ratedGamesCount: 2,
    timePreference: "long", avgPlaytimeRatio: 2,
  });
});

test("without time samples only catalog range match contributes to the time score", () => {
  const inferred = inferPreferences([]);
  assert.deepEqual(inferred, {
    genreWeights: {}, themeWeights: {}, ratedGamesCount: 0, timePreference: null, avgPlaytimeRatio: null,
  });
  const invalidTimes = [undefined, null, 0, -1, Infinity, NaN];
  for (const time of invalidTimes) {
    assert.deepEqual(inferPreferences([{ playtime: 10, time }, { playtime: time, time: 10 }]), inferred);
  }
  const games = [game(1), game(2, { time: 70 }), ...invalidTimes.map((time, i) => game(i + 3, { time }))];
  assertScores(rankRecommendations(games, [], profile, inferred, { ...explicitWeights, ratingWeight: 0 }), [
    [1, 0.24], [2, 0.24 * Math.exp(-2)], ...invalidTimes.map((_, i) => [i + 3, 0]),
  ]);
});

test("preserves the handling of missing and null critic ratings", () => {
  const inferred = inferPreferences(history);
  for (const rating of [undefined, null]) {
    const [rec] = rankRecommendations([game(3, { rating })], [], profile, inferred, explicitWeights);
    assert.equal(Number.isFinite(rec.score), rating === null);
  }
});
