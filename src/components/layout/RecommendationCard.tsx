import type {Recommendation} from "../../pages/Recommendation/Recommendation";

interface RecommendationCardProps {
    rec: Recommendation,
    index: number,
    maxScore: number,
    avgPlaytimeRatio?: number,
}

function RecommendationCard({rec, index, maxScore, avgPlaytimeRatio }: RecommendationCardProps) {


    return(
        <div className="relative flex items-center" key={rec.id}>
            <div className="absolute -left-10 text-xl font-bold text-white bg-black py-1.5 px-2.5 text-center w-7.5 h-7.5 flex justify-center items-center">
                {index + 1}
            </div>
            <div className="flex bg-black border border-white rounded-lg overflow-hidden shadow-[0_4px_8px_rgba(255,255,255,0.1)] w-full max-w-full">
                <img
                    src={`https://images.igdb.com/igdb/image/upload/t_cover_big/${rec.cover}.png`}
                    alt={`${rec.name} cover`}
                    className="w-50 h-auto object-cover"
                />
                <div className="flex-1 p-5 flex flex-col justify-between text-white">
                    <h3 className="text-2xl font-bold mb-2.5">{rec.name}</h3>
                    <div className="text-sm text-[#bbb] mb-1.25">{rec.releaseDate}</div>
                    <div className="text-sm text-[#bbb] mb-1.25">{rec.platforms}</div>
                    <div className="text-sm text-[#bbb] mb-1.25">
                        Średni czas gry: {rec.time}h
                    </div>
                    <div className="text-sm text-[#bbb] mb-1.25">
                        Oczekiwany czas gry:{" "}
                        {(
                            rec.time * (avgPlaytimeRatio || 1)
                        ).toFixed(1)}
                        h
                    </div>
                    <div className="text-sm leading-normal">
                        {rec.description}
                    </div>
                    <h4 className="mt-1.25 text-base text-orange-500">
                        Średnia ocena krytyków: {rec.rating}
                    </h4>
                    <h4 className="mt-1.25 text-base text-orange-500">
                        Średnia ocena graczy: {rec.globalRating.toFixed(1)}
                    </h4>
                    <h4 className="mt-1.25 text-base text-orange-500">
                        Dopasowanie: {((rec.score / maxScore) * 100).toFixed(1)}%
                    </h4>
                </div>
            </div>
        </div>
    )
}

export default RecommendationCard;