import { useState } from "react";
import type { RankedRecommendation } from "../../types/recommendation";
import RecommendationCard from "./RecommendationCard";
import { getExpandedRecommendationIndex } from "./recommendationSelection";

interface RecommendationListProps {
  games: readonly RankedRecommendation[];
  maxScore: number;
  avgPlaytimeRatio: number | null;
}

function RecommendationList({
  games,
  maxScore,
  avgPlaytimeRatio,
}: RecommendationListProps) {
  // The leader is open by default. Null records that the user closed all cards.
  const [selectedGameId, setSelectedGameId] = useState<number | null>();
  const expandedIndex = getExpandedRecommendationIndex(games, selectedGameId);
  const singleCardBeforeExpanded =
    expandedIndex % 2 === 1 ? expandedIndex - 1 : -1;

  return (
    <ol className="recommendation-list mt-6" role="list">
      {games.map((rec, index) => {
        const isExpanded = index === expandedIndex;
        return (
          <li
            key={rec.id}
            className={
              isExpanded || index === singleCardBeforeExpanded
                ? "recommendation-list__wide-item"
                : undefined
            }
          >
            <RecommendationCard
              rec={rec}
              index={index}
              maxScore={maxScore}
              avgPlaytimeRatio={avgPlaytimeRatio}
              isExpanded={isExpanded}
              onToggle={() => setSelectedGameId(isExpanded ? null : rec.id)}
            />
          </li>
        );
      })}
    </ol>
  );
}

export default RecommendationList;
