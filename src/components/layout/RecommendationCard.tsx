import type {Recommendation} from "../../pages/Recommendation/Recommendation";

interface RecommendationCardProps {
    rec: Recommendation,
    index: number,
    maxScore: number,
    avgPlaytimeRatio?: number,
}

function RecommendationCard({rec, index, maxScore, avgPlaytimeRatio }: RecommendationCardProps) {


    return(
        <div tabIndex={0} className="relative flex items-center w-full" key={rec.id}>
            <div className="hidden 2xl:flex absolute -left-20 p-10 text-5xl font-bold text-gray-200 bg-black text-center w-10 h-[50%] justify-center items-center">
                {index + 1}
            </div>
            <div tabIndex={0} className="collapse collapse-plus bg-black border border-white rounded-lg shadow-[0_4px_8px_rgba(255,255,255,0.1)] w-full overflow-hidden">
                <div className="collapse-title flex items-center gap-3 sm:gap-5 text-gray-100 w-full pr-10 2xl:pr-0">
                    <div className="relative shrink-0">
                        <img
                            src={`https://images.igdb.com/igdb/image/upload/t_cover_big/${rec.cover}.png`}
                            alt={`${rec.name} cover`}
                            className="w-16 sm:w-24 2xl:w-30 object-cover rounded"
                        />
                        <span className="2xl:hidden absolute top-1 left-1 bg-black/80 text-white font-bold text-xs px-1.5 py-0.5 rounded">
                            {index + 1}
                        </span>
                    </div>
                    <h3 className="text-lg sm:text-2xl md:text-3xl 2xl:text-4xl font-bold flex-1">{rec.name}</h3>
                    <div className="2xl:hidden bg-orange-500 text-white font-extrabold text-xs sm:text-sm px-2.5 py-1 rounded-full whitespace-nowrap ml-auto shrink-0">
                        {((rec.score / maxScore) * 100).toFixed(1)}%
                    </div>
                </div>
                <div className="collapse-content flex-1 flex flex-col justify-between text-white">
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
                    <div className="text-sm leading-normal w-full 2xl:w-[75%]">
                        {rec.description}
                    </div>
                    <h4 className="mt-1.25 text-base text-orange-500">
                        Średnia ocena krytyków: {rec.rating}
                    </h4>
                    <h4 className="mt-1.25 text-base text-orange-500">
                        Średnia ocena użytkowników: {rec.globalRating.toFixed(1)}
                    </h4>
                </div>
            </div>
            <div className="hidden absolute 2xl:flex items-center justify-center bg-orange-500 h-full w-40 right-10">
                <h4 className="text-gray-200 text-center text-4xl font-extrabold text-shadow-lg">
                    {((rec.score / maxScore) * 100).toFixed(1)}%
                </h4>
            </div>
        </div>
    )
}

export default RecommendationCard;