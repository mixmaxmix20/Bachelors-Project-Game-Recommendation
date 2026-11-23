import type { Game } from "../../types/game";
import { describeOperationError } from "../../services/operationError";
import ActionFeedback, {
  type ActionMessage,
} from "../../components/common/ActionFeedback";
import { formatHours, hoursUnit } from "../../components/common/formatNumbers";
import { useCallback, useRef, useState, type FormEvent } from "react";

interface GameCardProps {
  game: Game;
  deleteGame: (gameId: number, card: HTMLDivElement) => Promise<void>;
  saveChanges: (
    gameId: number,
    starRating: number | undefined,
    hours: number,
  ) => Promise<void>;
}

const ratings = [1, 2, 3, 4, 5];
const actionButtonClasses =
  "px-3 sm:px-5 py-1.5 rounded-md self-center cursor-pointer text-white ui-focus aria-disabled:cursor-not-allowed aria-disabled:opacity-50";

function GameCard({ game, deleteGame, saveChanges }: GameCardProps) {
  const [draft, setDraft] = useState<{
    starRating: number;
    playtime: string;
  } | null>(null);
  const [feedback, setFeedback] = useState<ActionMessage | null>(null);
  const actionInProgress = useRef(false);
  const card = useRef<HTMLDivElement>(null);
  const returnFocusToEdit = useRef(false);
  const setEditButton = useCallback((button: HTMLButtonElement | null) => {
    if (!button || !returnFocusToEdit.current) return;
    returnFocusToEdit.current = false;
    if (document.activeElement === document.body) button.focus();
  }, []);
  const isPending = feedback?.kind === "pending";

  function startEditing() {
    if (actionInProgress.current) return;
    setFeedback(null);
    setDraft({
      starRating: game.starRating,
      playtime: game.playtime ? String(game.playtime) : "",
    });
  }

  function closeEditor() {
    returnFocusToEdit.current =
      card.current?.contains(document.activeElement) ?? false;
    setDraft(null);
  }

  async function runAction(
    operation: "collection-update" | "collection-delete",
    write: () => Promise<void>,
  ) {
    if (actionInProgress.current) return;
    const isSave = operation === "collection-update";
    actionInProgress.current = true;
    setFeedback({
      kind: "pending",
      message: isSave ? "Zapisywanie zmian…" : "Usuwanie gry…",
    });
    try {
      await write();
      setFeedback(
        isSave ? { kind: "success", message: "Zapisano zmiany." } : null,
      );
    } catch (error) {
      setFeedback({
        kind: "error",
        message: describeOperationError(error, operation).message,
      });
    } finally {
      actionInProgress.current = false;
    }
  }

  function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft) return;

    const starRating =
      draft.starRating === game.starRating ? undefined : draft.starRating;
    void runAction("collection-update", async () => {
      await saveChanges(game.id, starRating, Number(draft.playtime));
      closeEditor();
    });
  }

  function handleCancel() {
    if (actionInProgress.current) return;
    setFeedback(null);
    closeEditor();
  }

  function handleDelete() {
    const currentCard = card.current;
    if (!currentCard) return;
    void runAction("collection-delete", () => deleteGame(game.id, currentCard));
  }

  return (
    <div
      ref={card}
      className="card text-center border border-ui-border p-2 rounded-lg"
    >
      <figure>
        <img
          className="w-full aspect-3/4 object-cover rounded-md"
          src={`https://images.igdb.com/igdb/image/upload/t_cover_big/${game.cover}.png`}
          alt={`Okładka gry ${game.name}`}
        />
      </figure>
      <h3 className="h-10 sm:h-12 flex items-center justify-center line-clamp-2 text-sm sm:text-base font-semibold text-center px-1 my-1">
        {game.name}
      </h3>
      {draft ? (
        <form onSubmit={handleSave}>
          <div className="h-14 sm:h-16 flex flex-col justify-center items-center gap-0.5">
            <div
              role="group"
              aria-label="Ocena osobista"
              className="flex justify-center"
            >
              {ratings.map((rating) => (
                <button
                  key={rating}
                  type="button"
                  aria-label={`Oceń na ${rating} z 5`}
                  aria-pressed={rating === draft.starRating}
                  aria-disabled={isPending}
                  autoFocus={rating === (draft.starRating || 1)}
                  className={`text-xl sm:text-2xl cursor-pointer leading-none ui-focus aria-disabled:cursor-not-allowed ${rating <= draft.starRating ? "text-amber-400" : "text-[#ccc]"}`}
                  onClick={() => {
                    if (actionInProgress.current) return;
                    setDraft({ ...draft, starRating: rating });
                  }}
                >
                  &#9733;
                </button>
              ))}
            </div>
            <label className="flex items-center gap-1 justify-center">
              <span className="sr-only">Czas gry w godzinach</span>
              <input
                type="number"
                min="0"
                step="any"
                value={draft.playtime}
                readOnly={isPending}
                onChange={(event) => {
                  if (actionInProgress.current) return;
                  setDraft({ ...draft, playtime: event.currentTarget.value });
                }}
                placeholder="Czas gry"
                className="w-14 h-6 text-center border border-ui-border ui-focus rounded bg-transparent text-xs sm:text-sm"
              />
              <span
                aria-hidden="true"
                className="text-xs sm:text-sm text-ui-muted"
              >
                {hoursUnit}
              </span>
            </label>
          </div>

          <div className="flex items-center gap-4 mt-2 justify-center">
            <button
              type="submit"
              aria-label="Zapisz zmiany"
              aria-disabled={isPending}
              className={`${actionButtonClasses} bg-green-500 not-aria-disabled:hover:bg-green-700`}
            >
              <svg
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="size-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m4.5 12.75 6 6 9-13.5"
                />
              </svg>
            </button>
            <button
              type="button"
              aria-label="Anuluj edycję"
              aria-disabled={isPending}
              className={`${actionButtonClasses} bg-[rgb(203,49,49)] not-aria-disabled:hover:bg-red-800`}
              onClick={handleCancel}
            >
              <svg
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="size-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18 18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </form>
      ) : (
        <>
          <div className="h-14 sm:h-16 flex flex-col justify-center items-center gap-1">
            <div
              role="img"
              aria-label={
                game.starRating
                  ? `Ocena osobista ${game.starRating} z 5`
                  : "Brak oceny osobistej"
              }
              className="flex justify-center"
            >
              {ratings.map((rating) => (
                <span
                  key={rating}
                  className={`text-xl sm:text-2xl leading-none ${
                    rating <= game.starRating ? "text-amber-400" : "text-[#ccc]"
                  }`}
                >
                  &#9733;
                </span>
              ))}
            </div>

            <div className="text-xs sm:text-sm text-ui-muted font-medium">
              {game.playtime ? formatHours(game.playtime) : "Brak czasu"}
            </div>
          </div>
          <div className="flex items-center gap-4 mt-2 justify-center">
            <button
              ref={setEditButton}
              type="button"
              aria-label="Edytuj grę"
              aria-disabled={isPending}
              data-collection-edit
              className={`${actionButtonClasses} bg-yellow-600 not-aria-disabled:hover:bg-yellow-700`}
              onClick={startEditing}
            >
              <svg
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="size-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125"
                />
              </svg>
            </button>
            <button
              type="button"
              aria-label="Usuń grę"
              aria-disabled={isPending}
              className={`${actionButtonClasses} bg-[rgb(203,49,49)] not-aria-disabled:hover:bg-red-800`}
              onClick={handleDelete}
            >
              <svg
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="size-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                />
              </svg>
            </button>
          </div>
        </>
      )}
      <ActionFeedback feedback={feedback} />
    </div>
  );
}

export default GameCard;
