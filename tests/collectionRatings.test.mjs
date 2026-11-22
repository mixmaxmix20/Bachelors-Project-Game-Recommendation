import assert from "node:assert/strict";
import test from "node:test";
import { getCollectionRatingChange } from "../src/domain/collectionRatings.ts";

test("a first rating counts once and later edits change only the sum", () => {
  assert.deepEqual(getCollectionRatingChange(0, 4), {
    totalRatings: 4,
    ratingCount: 1,
  });
  assert.deepEqual(getCollectionRatingChange(4, 2), {
    totalRatings: -2,
    ratingCount: 0,
  });
});

test("saving playtime with or without a rating keeps the aggregate unchanged", () => {
  for (const rating of [0, 3]) {
    assert.deepEqual(getCollectionRatingChange(rating, rating), {
      totalRatings: 0,
      ratingCount: 0,
    });
  }
});

test("deletion only removes an existing rating from the aggregate", () => {
  assert.deepEqual(getCollectionRatingChange(5, 0), {
    totalRatings: -5,
    ratingCount: -1,
  });
  assert.deepEqual(getCollectionRatingChange(0, 0), {
    totalRatings: 0,
    ratingCount: 0,
  });
});
