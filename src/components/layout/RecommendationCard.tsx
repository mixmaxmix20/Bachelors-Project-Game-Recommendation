import type { RankedRecommendation } from "../../types/recommendation";
import { expectedPlaytime, isPositiveTime } from "../../domain/recommendations";
import {
  formatHours,
  formatNumber,
  formatRelativeScore,
} from "../common/formatNumbers";

interface RecommendationCardProps {
  rec: RankedRecommendation;
  index: number;
  maxScore: number;
  avgPlaytimeRatio: number | null;
}

function RecommendationCard({
  rec,
  index,
  maxScore,
  avgPlaytimeRatio,
}: RecommendationCardProps) {
  const relativeScore = formatRelativeScore(rec.score, maxScore);
  const hours = expectedPlaytime(rec.time, avgPlaytimeRatio);

  return (
    <div className="relative flex items-center w-full">
      <div className="hidden @min-[75rem]/app-content:flex absolute -left-20 p-10 text-5xl font-bold text-gray-200 bg-black text-center w-10 h-[50%] justify-center items-center">
        {index + 1}
      </div>
      <details className="collapse collapse-plus bg-black border border-white rounded-lg shadow-[0_4px_8px_rgba(255,255,255,0.1)] w-full overflow-hidden">
        <summary className="collapse-title text-gray-100 w-full pr-10 @min-[75rem]/app-content:pr-52">
          <h3 className="flex items-center gap-3 sm:gap-5">
            <span className="relative shrink-0">
              <img
                src={`https://images.igdb.com/igdb/image/upload/t_cover_big/${rec.cover}.png`}
                alt={`Okładka gry ${rec.name}`}
                className="w-16 sm:w-24 @min-[75rem]/app-content:w-30 object-cover rounded"
              />
              <span className="@min-[75rem]/app-content:hidden absolute top-1 left-1 bg-black/80 text-white font-bold text-xs px-1.5 py-0.5 rounded">
                {index + 1}
              </span>
            </span>
            <span className="text-lg sm:text-2xl md:text-3xl @min-[75rem]/app-content:text-4xl font-bold flex-1 min-w-0 wrap-break-word">
              {rec.name}
            </span>
            <span className="@min-[75rem]/app-content:hidden bg-orange-500 text-white font-extrabold text-xs sm:text-sm px-2.5 py-1 rounded-full whitespace-nowrap ml-auto shrink-0">
              {relativeScore}
            </span>
          </h3>
        </summary>
        <div className="collapse-content flex-1 flex flex-col justify-between text-white @min-[75rem]/app-content:pr-52">
          <div className="text-sm text-ui-muted mb-1.25">{rec.releaseDate}</div>
          <div className="text-sm text-ui-muted mb-1.25">{rec.platforms}</div>
          <div className="text-sm text-ui-muted mb-1.25">
            Średni czas gry:{" "}
            {isPositiveTime(rec.time) ? formatHours(rec.time) : "Brak danych"}
          </div>
          <div className="text-sm text-ui-muted mb-1.25">
            Oczekiwany czas gry:{" "}
            {hours !== null ? formatHours(hours) : "Brak danych"}
          </div>
          <div className="text-sm leading-normal w-full">{rec.description}</div>
          <h4 className="mt-1.25 text-base text-orange-500">
            Ocena krytyków:{" "}
            {typeof rec.rating === "number" && Number.isFinite(rec.rating)
              ? `${formatNumber(rec.rating)}/100`
              : "Brak ocen"}
          </h4>
          <h4 className="mt-1.25 text-base text-orange-500">
            Ocena graczy:{" "}
            {rec.globalRating > 0 && Number.isFinite(rec.globalRating)
              ? `${formatNumber(rec.globalRating)}/5`
              : "Brak ocen"}
          </h4>
        </div>
      </details>
      <div className="hidden absolute @min-[75rem]/app-content:flex items-center justify-center bg-orange-500 h-full w-40 right-10 pointer-events-none">
        <span
          className={`text-gray-200 text-center whitespace-nowrap font-extrabold text-shadow-lg ${relativeScore === "Brak wyniku" ? "text-xl" : "text-4xl"}`}
        >
          {relativeScore}
        </span>
      </div>
    </div>
  );
}

export default RecommendationCard;
