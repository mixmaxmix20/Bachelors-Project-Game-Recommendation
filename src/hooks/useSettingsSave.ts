import { useRef, useState, useSyncExternalStore } from "react";
import type { ActionMessage } from "../components/common/ActionFeedback";
import {
  describeOperationError,
  type Operation,
} from "../services/operationError";

const successMessages = {
  profile: "Zapisano preferencje profilu",
  recommendations: "Zapisano ustawienia rekomendacji",
};

function subscribeToConnection(onChange: () => void) {
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);
  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
  };
}

export function useSettingsSave(operation: Exclude<Operation, "register">) {
  const inFlight = useRef<{ edited: boolean } | null>(null);
  const [feedback, setFeedback] = useState<ActionMessage | null>(null);
  const online = useSyncExternalStore(
    subscribeToConnection,
    () => navigator.onLine,
  );
  const isSaving = feedback?.kind === "pending";

  function markEdited() {
    if (inFlight.current) inFlight.current.edited = true;
    else setFeedback(null);
  }

  async function save(write: () => Promise<void>) {
    if (inFlight.current) return;
    const request = { edited: false };
    inFlight.current = request;
    setFeedback({ kind: "pending", message: "Zapisywanie…" });
    try {
      await write();
      setFeedback({
        kind: "success",
        message: request.edited
          ? "Zapisano wcześniejsze ustawienia. Zapisz najnowsze zmiany."
          : successMessages[operation],
      });
    } catch (error) {
      const { message } = describeOperationError(error, operation);
      setFeedback({ kind: "error", message });
    } finally {
      inFlight.current = null;
    }
  }

  const visibleFeedback =
    isSaving && !online
      ? {
          ...feedback,
          message: "Brak połączenia z internetem. Zapis czeka na połączenie.",
        }
      : feedback;
  return { feedback: visibleFeedback, isSaving, markEdited, save };
}
