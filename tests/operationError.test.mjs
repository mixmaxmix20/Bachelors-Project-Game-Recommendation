import assert from "node:assert/strict";
import test from "node:test";
import { describeOperationError } from "../src/services/operationError.ts";

test("registration identifies the field Firebase rejected", () => {
  for (const [code, field, message] of [
    [
      "auth/email-already-in-use",
      "email",
      "Ten adres e-mail jest już w użyciu.",
    ],
    ["auth/invalid-email", "email", "Wprowadź poprawny adres e-mail."],
    ["auth/weak-password", "password", "Wybierz silniejsze hasło."],
    [
      "auth/password-does-not-meet-requirements",
      "password",
      "Wybierz silniejsze hasło.",
    ],
  ]) {
    assert.deepEqual(describeOperationError({ code }, "register"), {
      field,
      message,
    });
  }
});

test("connection, authentication, permission and data failures give different directions", () => {
  for (const [operation, code, expected] of [
    ["register", "auth/network-request-failed", /połączenie z internetem/],
    ["profile", "unavailable", /połączenie z internetem/],
    ["profile", "unauthenticated", /Zaloguj się ponownie/],
    ["register", "auth/user-token-expired", /Zaloguj się ponownie/],
    ["recommendations", "permission-denied", /Brak uprawnień/],
    ["recommendations", "invalid-argument", /Sprawdź wprowadzone dane/],
  ]) {
    const result = describeOperationError({ code }, operation);
    assert.equal(result.field, undefined);
    assert.match(result.message, expected);
  }
});

test("unrecognized errors identify the failed action without guessing the cause", () => {
  for (const error of [
    null,
    new Error("unexpected"),
    { code: "some-new-code" },
  ]) {
    for (const [operation, message] of [
      ["register", "Nie udało się utworzyć konta."],
      ["profile", "Nie udało się zapisać preferencji profilu."],
      ["recommendations", "Nie udało się zapisać ustawień rekomendacji."],
    ]) {
      assert.deepEqual(describeOperationError(error, operation), {
        message: message + " Spróbuj ponownie.",
      });
    }
  }
});

test("a missing collection entry tells the user to refresh before retrying", () => {
  assert.match(
    describeOperationError({ code: "not-found" }, "collection-update").message,
    /Odśwież kolekcję/,
  );
});
