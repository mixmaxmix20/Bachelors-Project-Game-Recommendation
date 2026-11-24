import assert from "node:assert/strict";
import test from "node:test";
import { getExpandedRecommendationIndex } from "../src/pages/Recommendation/recommendationSelection.ts";

const initialRanking = [{ id: 20 }, { id: 733 }, { id: 538 }];
const updatedRanking = [
  initialRanking[2],
  initialRanking[0],
  initialRanking[1],
];

test("opens the current leader by default when there are results", () => {
  assert.equal(getExpandedRecommendationIndex(initialRanking, undefined), 0);
  assert.equal(getExpandedRecommendationIndex(updatedRanking, undefined), 0);
  assert.equal(getExpandedRecommendationIndex([], undefined), -1);
});

test("follows a selected game after reordering and falls back if it leaves", () => {
  const selected = initialRanking[1].id;
  assert.equal(getExpandedRecommendationIndex(initialRanking, selected), 1);
  assert.equal(getExpandedRecommendationIndex(updatedRanking, selected), 2);
  assert.equal(
    getExpandedRecommendationIndex(updatedRanking.slice(0, 2), selected),
    0,
  );
});

test("keeps all cards closed after an explicit collapse and a ranking change", () => {
  assert.equal(getExpandedRecommendationIndex(initialRanking, null), -1);
  assert.equal(getExpandedRecommendationIndex(updatedRanking, null), -1);
});
