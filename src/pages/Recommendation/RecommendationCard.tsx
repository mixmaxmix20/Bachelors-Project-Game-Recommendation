import { useId, useLayoutEffect, useRef, useState } from "react";
import type { RankedRecommendation } from "../../types/recommendation";
import { expectedPlaytime, isPositiveTime } from "../../domain/recommendations";
import {
  formatHours,
  formatNumber,
  formatRelativeScore,
} from "../../components/common/formatNumbers";
import { fitRecommendationDescription } from "./recommendationDescription";

interface RecommendationCardProps {
  rec: RankedRecommendation;
  index: number;
  maxScore: number;
  avgPlaytimeRatio: number | null;
  isExpanded: boolean;
  onToggle: () => void;
}

const coverBaseUrl = "https://images.igdb.com/igdb/image/upload";
const stackedDescriptionLineLimit = 6;

function RecommendationCard({
  rec,
  index,
  maxScore,
  avgPlaytimeRatio,
  isExpanded,
  onToggle,
}: RecommendationCardProps) {
  const detailsId = useId();
  const [failedCover, setFailedCover] = useState<string | null>(null);
  const [fittingDescription, setFittingDescription] = useState("");
  const coverRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const descriptionMeasureRef = useRef<HTMLParagraphElement>(null);
  const statsRef = useRef<HTMLDListElement>(null);
  const description = rec.description?.trim() ?? "";
  const coverUrl = `${coverBaseUrl}/t_cover_big/${rec.cover}.jpg`;
  const retinaCoverUrl = `${coverBaseUrl}/t_cover_big_2x/${rec.cover}.jpg`;
  const coverSizes = isExpanded
    ? "auto, (min-width: 84rem) 19.75rem, (min-width: 40rem) 26vw, 24vw"
    : "auto, (min-width: 68rem) 9.5rem, (min-width: 40rem) 8rem, 21vw";
  const relativeScore = formatRelativeScore(rec.score, maxScore);
  const hours = expectedPlaytime(rec.time, avgPlaytimeRatio);

  useLayoutEffect(() => {
    const cover = coverRef.current;
    const header = headerRef.current;
    const measure = descriptionMeasureRef.current;
    const stats = statsRef.current;
    if (!isExpanded || !description || !cover || !header || !measure || !stats)
      return;

    const fitDescription = () => {
      const coverBounds = cover.getBoundingClientRect();
      const descriptionBounds = measure.getBoundingClientRect();
      const besideCover = descriptionBounds.left >= coverBounds.right;
      const heightLimit = besideCover
        ? coverBounds.bottom -
          descriptionBounds.top -
          stats.getBoundingClientRect().height -
          Number.parseFloat(getComputedStyle(stats).marginTop)
        : stackedDescriptionLineLimit *
          Number.parseFloat(getComputedStyle(measure).lineHeight);

      const fitted = fitRecommendationDescription(description, (candidate) => {
        measure.textContent = candidate;
        return measure.getBoundingClientRect().height <= heightLimit;
      });

      measure.textContent = "";
      setFittingDescription(fitted);
    };

    // Fit the text before paint, and repeat when the available space changes.
    fitDescription();
    const observer = new ResizeObserver(fitDescription);
    observer.observe(cover);
    observer.observe(header);
    observer.observe(stats);
    return () => observer.disconnect();
  }, [description, isExpanded]);

  return (
    <article
      className={`recommendation-card${isExpanded ? " recommendation-card--expanded" : ""}`}
    >
      <div
        ref={coverRef}
        className="recommendation-card__cover"
        aria-hidden="true"
      >
        {rec.cover && rec.cover !== failedCover ? (
          <img
            src={coverUrl}
            srcSet={`${coverUrl} 264w, ${retinaCoverUrl} 528w`}
            sizes={coverSizes}
            alt=""
            loading="lazy"
            decoding="async"
            onError={() => setFailedCover(rec.cover)}
          />
        ) : (
          <span className="px-2 text-center text-xs text-ui-muted">
            Brak okładki
          </span>
        )}
      </div>
      <header ref={headerRef} className="recommendation-card__header">
        <div className="recommendation-card__identity">
          <p className="text-sm font-semibold text-ui-muted">
            {index + 1}. miejsce
          </p>
          <h2 className="recommendation-card__title">
            <button
              type="button"
              className="recommendation-card__toggle"
              aria-expanded={isExpanded}
              aria-controls={detailsId}
              onClick={onToggle}
            >
              {rec.name}
              <span className="recommendation-chevron" aria-hidden="true" />
            </button>
          </h2>
          {isExpanded && (
            <p className="mt-2 text-sm text-ui-muted">
              {rec.releaseDate}
              {rec.platforms && (
                <>
                  <span aria-hidden="true"> · </span>
                  {rec.platforms}
                </>
              )}
            </p>
          )}
        </div>
        <p className="recommendation-card__score">
          <span
            className={`recommendation-card__score-value${relativeScore === "Brak wyniku" ? " recommendation-card__score-value--unavailable" : ""}`}
          >
            {relativeScore}
          </span>
          <span className="mt-1 block text-sm font-medium text-gray-200">
            Dopasowanie
          </span>
        </p>
      </header>
      <div
        id={detailsId}
        hidden={!isExpanded}
        className="recommendation-card__details"
      >
        {isExpanded && (
          <>
            <h3 className="mb-2 text-lg font-semibold">O grze</h3>
            <div className="relative max-w-[65ch] leading-relaxed wrap-anywhere text-gray-200">
              <p>{description ? fittingDescription : "Brak danych"}</p>
              <div
                aria-hidden="true"
                className="invisible absolute inset-x-0 top-0 h-0 overflow-hidden"
              >
                <p ref={descriptionMeasureRef} />
              </div>
            </div>
            <dl ref={statsRef} className="recommendation-card__stats">
              <div>
                <dt>Średni czas gry</dt>
                <dd>
                  {isPositiveTime(rec.time)
                    ? formatHours(rec.time)
                    : "Brak danych"}
                </dd>
              </div>
              <div>
                <dt>Czas szacowany dla ciebie</dt>
                <dd>{hours !== null ? formatHours(hours) : "Brak danych"}</dd>
              </div>
              <div>
                <dt>Ocena krytyków</dt>
                <dd>
                  {typeof rec.rating === "number" && Number.isFinite(rec.rating)
                    ? `${formatNumber(rec.rating)}/100`
                    : "Brak ocen"}
                </dd>
              </div>
              <div>
                <dt>Ocena graczy</dt>
                <dd>
                  {rec.globalRating > 0 && Number.isFinite(rec.globalRating)
                    ? `${formatNumber(rec.globalRating)}/5`
                    : "Brak ocen"}
                </dd>
              </div>
            </dl>
          </>
        )}
      </div>
    </article>
  );
}

export default RecommendationCard;
