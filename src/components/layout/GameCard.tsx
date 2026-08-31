import type { Game } from "../../types/game";
import { useState } from "react";

interface GameCardProps {
    game: Game;
    deleteGame: (game: Game) => void;
    saveChanges: (gameId: number, starRating: number, hours: number) => void;
}

function GameCard({ game, deleteGame, saveChanges }: GameCardProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [tempRating, setTempRating] = useState(game.starRating);
    const [tempPlaytime, setTempPlaytime] = useState(game.playtime || 0);

    const handleSave = () => {
        saveChanges(game.id, tempRating, tempPlaytime);
        setIsEditing(false);
    }

    const handleCancel = () => {
        setTempRating(game.starRating);
        setTempPlaytime(game.playtime);
        setIsEditing(false);
    }

    return (
        <div className="card text-center border border-[#ddd] p-2 rounded-lg">
            <figure>
                <img
                    className="w-full aspect-3/4 object-cover rounded-md"
                    src={`https://images.igdb.com/igdb/image/upload/t_cover_big/${game.cover}.png`}
                    alt={`${game.name} cover image`}
                />
            </figure>
            <h3 className="h-10 sm:h-12 flex items-center justify-center line-clamp-2 text-sm sm:text-base font-semibold text-center px-1 my-1">{game.name}</h3>
            {isEditing ? (
                // Tryb Edycji
                <>
                    <div className="h-14 sm:h-16 flex flex-col justify-center items-center gap-0.5">
                        <div className="flex justify-center">
                            {[...Array(5)].map((_, index) => (
                                <span
                                    key={index}
                                    className={`text-xl sm:text-2xl cursor-pointer leading-none ${index < tempRating ? "text-amber-400" : "text-[#ccc]"}`}
                                    onClick={() => setTempRating(index + 1)}
                                >
                            &#9733;
                        </span>
                            ))}
                        </div>
                        <div className="flex items-center gap-1 justify-center">
                            <input
                            type="number"
                            min="0"
                            value={tempPlaytime|| ""}
                            onChange={(e) =>
                                setTempPlaytime(Number(e.target.value))
                            }
                            placeholder="Czas gry"
                            className="w-14 h-6 text-center border border-[#ddd] rounded bg-transparent text-xs sm:text-sm"
                            />
                            <span className="text-xs sm:text-sm text-[#666]">godz.</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 mt-2 justify-center">
                        <div className="px-3 sm:px-5 py-1.5 rounded-md self-center cursor-pointer text-white bg-green-500 hover:bg-green-700" onClick={() => handleSave()}>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                            </svg>
                        </div>
                        <div className="px-3 sm:px-5 py-1.5 rounded-md self-center cursor-pointer text-white bg-[rgb(203,49,49)] hover:bg-red-800" onClick={() => handleCancel()}>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                            </svg>
                        </div>
                    </div>
                </>
            ) : (
                // Tryb Odczytu
                <>
                    <div className="h-14 sm:h-16 flex flex-col justify-center items-center gap-1">
                        <div className="flex justify-center">
                            {[...Array(5)].map((_, index) => (
                                <span
                                    key={index}
                                    className={`text-xl sm:text-2xl leading-none ${
                                        index < game.starRating ? "text-amber-400" : "text-[#ccc]"
                                    }`}
                                >
                                &#9733;
                                </span>
                            ))}
                        </div>

                        <div className="text-xs sm:text-sm text-gray-400 font-medium">
                            {game.playtime ? `${game.playtime} godz.` : "Brak czasu"}
                        </div>
                    </div>
                <div className="flex items-center gap-4 mt-2 justify-center">
                    <div className="px-3 sm:px-5 py-1.5 rounded-md self-center cursor-pointer text-white bg-yellow-600 hover:bg-yellow-700" onClick={() => setIsEditing(true)}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
                        </svg>
                    </div>
                    <div className="px-3 sm:px-5 py-1.5 rounded-md self-center cursor-pointer text-white bg-[rgb(203,49,49)] hover:bg-red-800" onClick={() => deleteGame(game)}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                        </svg>
                    </div>
                </div>
                </>
            )}
        </div>
    );
}

export default GameCard;