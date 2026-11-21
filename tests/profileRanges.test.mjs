import assert from "node:assert/strict";
import test from "node:test";
import {
  gameLengthBounds,
  normalizePreferenceRange,
  releaseYearBounds,
} from "../src/domain/profileRanges.ts";

test("a new profile uses both full slider ranges", () => {
  assert.deepEqual(
    normalizePreferenceRange(undefined, undefined, releaseYearBounds),
    [1990, 2026],
  );
  assert.deepEqual(
    normalizePreferenceRange(undefined, undefined, gameLengthBounds),
    [1, 400],
  );
});

test("valid saved preferences retain their endpoints", () => {
  assert.deepEqual(
    normalizePreferenceRange(2001, 2025, releaseYearBounds),
    [2001, 2025],
  );
  assert.deepEqual(
    normalizePreferenceRange(25, 80, gameLengthBounds),
    [25, 80],
  );
});

test("legacy values outside the slider limits are clamped", () => {
  assert.deepEqual(
    normalizePreferenceRange(1970, 2030, releaseYearBounds),
    [1990, 2026],
  );
  assert.deepEqual(
    normalizePreferenceRange(0, 1000, gameLengthBounds),
    [1, 400],
  );
});

test("reversed endpoints are ordered and equal endpoints are allowed", () => {
  assert.deepEqual(
    normalizePreferenceRange(2026, 1995, releaseYearBounds),
    [1995, 2026],
  );
  assert.deepEqual(
    normalizePreferenceRange(42, 42, gameLengthBounds),
    [42, 42],
  );
});

test("invalid endpoints fall back independently and fractions align to the slider step", () => {
  assert.deepEqual(
    normalizePreferenceRange(NaN, 1997, releaseYearBounds),
    [1990, 1997],
  );
  assert.deepEqual(
    normalizePreferenceRange(12.6, Infinity, gameLengthBounds),
    [13, 400],
  );
  assert.deepEqual(
    normalizePreferenceRange("12", null, gameLengthBounds),
    [1, 400],
  );
});
