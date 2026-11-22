export type Operation = "register" | "profile" | "recommendations";

interface OperationError {
  field?: "email" | "password";
  message: string;
}

const failureMessages = {
  register: "Nie udało się utworzyć konta.",
  profile: "Nie udało się zapisać preferencji profilu.",
  recommendations: "Nie udało się zapisać ustawień rekomendacji.",
};

export function describeOperationError(
  error: unknown,
  operation: Operation,
): OperationError {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? error.code
      : undefined;

  if (operation === "register") {
    switch (code) {
      case "auth/email-already-in-use":
        return {
          field: "email",
          message: "Ten adres e-mail jest już w użyciu.",
        };
      case "auth/invalid-email":
        return { field: "email", message: "Wprowadź poprawny adres e-mail." };
      case "auth/weak-password":
      case "auth/password-does-not-meet-requirements":
        return { field: "password", message: "Wybierz silniejsze hasło." };
    }
  }

  switch (code) {
    case "auth/network-request-failed":
    case "unavailable":
    case "deadline-exceeded":
      return { message: "Sprawdź połączenie z internetem i spróbuj ponownie." };
    case "auth/user-token-expired":
    case "auth/invalid-user-token":
    case "auth/requires-recent-login":
    case "unauthenticated":
      return { message: "Zaloguj się ponownie i powtórz operację." };
    case "permission-denied":
      return { message: "Brak uprawnień do wykonania tej operacji." };
    case "invalid-argument":
      return {
        message: failureMessages[operation] + " Sprawdź wprowadzone dane.",
      };
    default:
      return { message: failureMessages[operation] + " Spróbuj ponownie." };
  }
}
