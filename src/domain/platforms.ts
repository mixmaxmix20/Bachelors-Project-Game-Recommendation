export const availablePlatforms = [
  "PC",
  "PlayStation 5",
  "PlayStation 4",
  "PlayStation 3",
  "PlayStation 2",
  "PlayStation 1",
  "PlayStation Vita",
  "PlayStation Portable",
  "Xbox Series X|S",
  "Xbox One",
  "Xbox 360",
  "Xbox",
  "Nintendo Switch",
  "Wii U",
  "Wii",
  "Nintendo 3DS",
  "Nintendo DS",
  "Nintendo 64",
  "Nintendo GameCube",
  "Game Boy Advance",
  "Dreamcast",
] as const;

type Platform = (typeof availablePlatforms)[number];

const aliases = new Map<string, Platform>([
  ["Xbox Series X/S", "Xbox Series X|S"],
  ["GameCube", "Nintendo GameCube"],
  ["PC (Microsoft Windows)", "PC"],
  ["PlayStation", "PlayStation 1"],
]);

const compatibility = new Map<string, readonly Platform[]>([
  ["Xbox Series X|S", ["Xbox One"]],
  ["Xbox One", ["Xbox 360", "Xbox"]],
  ["Xbox 360", ["Xbox"]],
  ["PlayStation 5", ["PlayStation 4"]],
  ["PlayStation 2", ["PlayStation 1"]],
  ["PlayStation Vita", ["PlayStation 1", "PlayStation Portable"]],
  ["PlayStation Portable", ["PlayStation 1"]],
  ["Wii U", ["Wii"]],
  ["Wii", ["Nintendo GameCube"]],
  ["Nintendo 3DS", ["Nintendo DS"]],
  ["Nintendo DS", ["Game Boy Advance"]],
]);

export function normalizePlatforms(values: readonly string[]): string[] {
  const names = new Set<string>();
  for (const value of values) {
    const name = value.trim();
    if (name) names.add(aliases.get(name) ?? name);
  }
  return [...names];
}

export function supportedPlatforms(selected: readonly string[]): Set<string> {
  const names = normalizePlatforms(selected);
  const supported = new Set(names);
  for (const name of names) {
    for (const compatible of compatibility.get(name) ?? []) {
      supported.add(compatible);
    }
  }
  return supported;
}

export function matchesGamePlatforms(supported: ReadonlySet<string>, platforms?: string): boolean {
  return normalizePlatforms((platforms ?? "").split(",")).some(name => supported.has(name));
}
