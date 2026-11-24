import assert from "node:assert/strict";
import test from "node:test";
import { fitRecommendationDescription } from "../src/pages/Recommendation/recommendationDescription.ts";

const within = (length) => (candidate) => candidate.length <= length;

test("keeps the full description when it fits, including text without punctuation", () => {
  const description = "Kooperacyjna gra przygodowa";
  assert.equal(
    fitRecommendationDescription(description, within(description.length)),
    description,
  );
});

test("uses the last complete sentence that fits when the next would overflow", () => {
  const fitting = "Miasto upadło. Tylko ty możesz je odbudować!";
  const description = fitting + " Znajdź sprzymierzeńców i wyrusz w drogę.";
  assert.equal(
    fitRecommendationDescription(description, within(fitting.length + 5)),
    fitting,
  );
});

test("does not treat a decimal or an abbreviation as a sentence ending", () => {
  const firstSentence = "Wersja 2.1 zawiera nowe trasy, np. Warszawę.";
  const description = firstSentence + " Czekają na ciebie nowe wyzwania.";
  assert.equal(
    fitRecommendationDescription(description, within(firstSentence.length)),
    firstSentence,
  );
  assert.equal(
    fitRecommendationDescription(description, within(firstSentence.length - 1)),
    firstSentence,
  );
});

test("keeps the first sentence even when it exceeds the limit", () => {
  const firstSentence = "Wyrusz w daleką podróż przez nieznane królestwo.";
  const description = firstSentence + " Po drodze czekają liczne wyzwania.";
  assert.equal(
    fitRecommendationDescription(description, within(20)),
    firstSentence,
  );
});

test("keeps an overlong description in full when it has no sentence ending", () => {
  const description = "Tajemnicza historia bez zakończenia";
  assert.equal(
    fitRecommendationDescription(description, within(20)),
    description,
  );
});
