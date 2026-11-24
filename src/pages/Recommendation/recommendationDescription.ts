const sentenceSegmenter =
  typeof Intl.Segmenter === "function"
    ? new Intl.Segmenter("pl", { granularity: "sentence" })
    : null;

const sentenceEnd = /[.!?…][”’"')\]»]*$/u;
const fallbackSentenceEnd = /[.!?…]+[”’"')\]»]*(?=\s+[„"'(]*\p{Lu}|$)/gu;
const continuingAbbreviation =
  /(?:^|[\s(])(?:np|m\.in|tj|tzn|tzw|prof|gen|im|św|ul)\.$/iu;

function* sentenceEndOffsets(description: string) {
  if (!sentenceSegmenter) {
    for (const match of description.matchAll(fallbackSentenceEnd)) {
      yield match.index + match[0].length;
    }
    return;
  }

  for (const { index, segment } of sentenceSegmenter.segment(description)) {
    const sentence = segment.trimEnd();
    if (sentenceEnd.test(sentence)) yield index + sentence.length;
  }
}

export function fitRecommendationDescription(
  description: string,
  fits: (candidate: string) => boolean,
): string {
  if (fits(description)) return description;

  let fittingDescription = "";
  for (const offset of sentenceEndOffsets(description)) {
    const candidate = description.slice(0, offset);
    if (continuingAbbreviation.test(candidate)) continue;
    if (!fits(candidate)) return fittingDescription || candidate;
    fittingDescription = candidate;
  }
  return fittingDescription || description;
}
