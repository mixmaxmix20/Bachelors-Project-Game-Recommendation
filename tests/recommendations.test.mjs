import assert from "node:assert/strict";
import test from "node:test";
import { inferPreferences, rankRecommendations } from "../src/domain/recommendations.ts";

const profile = {
  minTime: 20,
  maxTime: 55,
  minYear: 2000,
  maxYear: 2025,
  platforms: ["Wii"],
  genres: ["RPG", "Adventure"],
  themes: ["Fantasy", "Action"],
};
const defaultWeights = { ratingWeight: 0.2, genreWeight: 0.6, criticRatingWeight: 0.5 };

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
  { id: "1", starRating: 5, playtime: 30 },
  { id: "2", starRating: 3, playtime: 40 },
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
  const inferred = inferPreferences(history, candidates);

  // Ratios of 1.5 and 1 give a mean of 1.25, standard deviation of 0.25 and z-score of 1.
  assert.deepEqual(inferred, {
    genreWeights: { RPG: 1, Adventure: 2 / 3 },
    themeWeights: { Fantasy: 2 / 3, Action: 1 / 3 },
    timePreference: "long",
    avgPlaytimeRatio: 1.25,
  });

  // Game 3 gets the long-playtime bonus at 50 h. Game 4 reaches the 20 h lower bound.
  assertScores(rankRecommendations(candidates, history, profile, inferred, defaultWeights), [
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
  const collection = [{ id: "8" }, { id: 9, playtime: 20, starRating: 5 }];
  const inferred = inferPreferences(collection, games);
  assert.deepEqual(inferred.genreWeights, {});

  const recommendations = rankRecommendations(games, collection, profile, inferred, defaultWeights);
  assert.deepEqual(recommendations.map(({ id }) => id), [1, 2, 9]);

  for (const filter of ["platforms", "genres", "themes"]) {
    assert.deepEqual(
      rankRecommendations(games, collection, { ...profile, [filter]: [] }, inferred, defaultWeights),
      []
    );
  }
});

test("keeps input order for equal scores and takes only the first ten", () => {
  const games = Array.from({ length: 12 }, (_, index) => game(12 - index));
  const inferred = inferPreferences(history, candidates);
  const recommendations = rankRecommendations(games, [], profile, inferred, defaultWeights);

  assert.deepEqual(recommendations.map(({ id }) => id), [12, 11, 10, 9, 8, 7, 6, 5, 4, 3]);
  assert.equal(new Set(recommendations.map(({ score }) => score)).size, 1);
  assert.ok(games.every((candidate) => !("score" in candidate)));
});

test("applies the five-hour tolerance and exponential playtime penalty", () => {
  const games = [game(3, { time: 48 }), game(4, { time: 56 })];
  const inferred = inferPreferences(history, candidates);
  const recommendations = rankRecommendations(games, [], profile, inferred, {
    ...defaultWeights,
    ratingWeight: 0,
  });

  // At 60 h and 70 h, both get the long bonus. The second has a net distance of 10 h.
  assertScores(recommendations, [[3, 0.36], [4, 0.15248046797678705]]);
});

test("preserves an empty history and ignores unobserved candidates and missing or zero user playtime", () => {
  assert.deepEqual(inferPreferences([], []), {
    genreWeights: {},
    themeWeights: {},
    avgPlaytimeRatio: NaN,
    timePreference: "medium",
  });
  const inferred = inferPreferences([
    { id: "100", starRating: 5, playtime: 20 },
    { id: "1", starRating: 5 },
    { id: "2", starRating: 5, playtime: 0 },
  ], candidates);
  assert.deepEqual(inferred, inferPreferences([], []));

  const [recommendation] = rankRecommendations([game(3)], [], profile, inferred, defaultWeights);
  assert.ok(Number.isNaN(recommendation.score));
});

test("distinguishes missing collection ratings from explicit zero", () => {
  const games = [
    game(1, { genres: "RPG", themes: "Fantasy" }),
    game(2, { genres: "Adventure", themes: "Action" }),
  ];
  const unrated = { id: "1", playtime: 40 };
  const rated = { id: "2", playtime: 40, starRating: 3 };
  assert.deepEqual(inferPreferences([unrated, rated], games), {
    genreWeights: { RPG: NaN, Adventure: 0.5 },
    themeWeights: { Fantasy: NaN, Action: 0.5 },
    avgPlaytimeRatio: 1,
    timePreference: "medium",
  });
  assert.deepEqual(inferPreferences([{ ...unrated, starRating: 0 }, rated], games).genreWeights, {
    RPG: -1,
    Adventure: 2,
  });
});

test("preserves non-finite results from unavailable database ratings and playtimes", () => {
  const inferred = inferPreferences(history, candidates);
  const recommendations = rankRecommendations(
    [game(3, { rating: undefined }), game(4, { time: undefined })],
    [],
    profile,
    inferred,
    defaultWeights
  );
  assert.deepEqual(recommendations.map(({ id, score }) => [id, score]), [[3, NaN], [4, NaN]]);

  const [withoutCriticRating] = rankRecommendations([game(3, { rating: null })], [], profile, inferred, defaultWeights);
  assert.ok(Number.isFinite(withoutCriticRating.score));

  const observed = [{ id: "1", playtime: 40, starRating: 5 }];
  const noGlobalPlaytime = inferPreferences(observed, [game(1, { time: undefined })]);
  const zeroGlobalPlaytime = inferPreferences(observed, [game(1, { time: 0 })]);
  assert.ok(Number.isNaN(noGlobalPlaytime.avgPlaytimeRatio));
  assert.equal(zeroGlobalPlaytime.avgPlaytimeRatio, Infinity);
  assert.equal(noGlobalPlaytime.timePreference, "medium");
  assert.equal(zeroGlobalPlaytime.timePreference, "medium");
});
