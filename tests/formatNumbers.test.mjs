import assert from "node:assert/strict";
import test from "node:test";
import {
  formatHours,
  formatNumber,
  formatRelativeScore,
} from "../src/components/common/formatNumbers.ts";

test("hours and ratings use Polish decimals with at most one fractional digit", () => {
  assert.equal(formatHours(12.54), "12,5\u00a0godz.");
  assert.equal(formatHours(12), "12\u00a0godz.");
  assert.equal(formatNumber(4.86), "4,9");
});

test("ranking percentages use the best score as the denominator", () => {
  assert.equal(formatRelativeScore(0.8, 0.8), "100,0%");
  assert.equal(formatRelativeScore(0.5, 0.8), "62,5%");
});

test("ranking percentages are unavailable without a valid score and positive denominator", () => {
  assert.equal(formatRelativeScore(0, 0), "Brak wyniku");
  assert.equal(formatRelativeScore(0.5, -1), "Brak wyniku");
  assert.equal(formatRelativeScore(0.5, Infinity), "Brak wyniku");
  assert.equal(formatRelativeScore(NaN, 0.8), "Brak wyniku");
});
