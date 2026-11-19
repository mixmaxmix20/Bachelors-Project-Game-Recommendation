import assert from "node:assert/strict";
import test from "node:test";
import { availablePlatforms, matchesGamePlatforms, normalizePlatforms, supportedPlatforms } from "../src/domain/platforms.ts";

for (const [legacy, canonical] of [
  ["Xbox Series X/S", "Xbox Series X|S"],
  ["GameCube", "Nintendo GameCube"],
  ["PC (Microsoft Windows)", "PC"],
  ["PlayStation", "PlayStation 1"],
]) {
  test(`matches both spellings of ${canonical} in profiles and game lists`, () => {
    assert.ok(availablePlatforms.includes(canonical));
    assert.deepEqual(normalizePlatforms([legacy]), [canonical]);
    assert.ok(matchesGamePlatforms(supportedPlatforms([legacy]), `Dreamcast, ${canonical}`));
    assert.ok(matchesGamePlatforms(supportedPlatforms([canonical]), `Wii U,  ${legacy} `));
  });
}

test("normalization preserves unknown names and first-seen order across reads and saves", () => {
  const read = normalizePlatforms(["  GameCube ", "Neo Geo", "Nintendo GameCube", "", " PC "]);
  assert.deepEqual(read, ["Nintendo GameCube", "Neo Geo", "PC"]);
  assert.deepEqual(normalizePlatforms(read), read);
  assert.ok(matchesGamePlatforms(supportedPlatforms(read), "Neo Geo"));
});

test("Wii compatibility works in one direction", () => {
  assert.ok(matchesGamePlatforms(supportedPlatforms(["Wii"]), "GameCube"));
  assert.equal(matchesGamePlatforms(supportedPlatforms(["GameCube"]), "Wii"), false);
});

test("Xbox Series compatibility stops after one generation", () => {
  const supported = supportedPlatforms(["Xbox Series X|S"]);
  assert.ok(matchesGamePlatforms(supported, "Xbox One"));
  assert.equal(matchesGamePlatforms(supported, "Xbox 360"), false);
});

test("empty selections and absent game platforms do not match", () => {
  assert.equal(matchesGamePlatforms(supportedPlatforms([]), "PC"), false);
  assert.equal(matchesGamePlatforms(supportedPlatforms(["PC"]), " , "), false);
  assert.equal(matchesGamePlatforms(supportedPlatforms(["PC"])), false);
});
