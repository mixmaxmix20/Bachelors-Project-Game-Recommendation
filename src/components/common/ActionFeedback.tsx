export type ActionMessage = {
  kind: "pending" | "success" | "error";
  message: string;
};

export default function ActionFeedback({
  feedback,
}: {
  feedback: ActionMessage | null;
}) {
  return (
    <>
      <p
        role="status"
        className="text-center text-sm text-inherit empty:sr-only"
      >
        {feedback?.kind !== "error" && feedback?.message}
      </p>
      <p
        role="alert"
        className="text-center text-sm text-red-300 empty:sr-only"
      >
        {feedback?.kind === "error" && feedback.message}
      </p>
    </>
  );
}
