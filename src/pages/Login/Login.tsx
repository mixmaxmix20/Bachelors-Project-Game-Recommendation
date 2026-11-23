import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import AuthField from "../../components/common/AuthField";
import ActionFeedback, {
  type ActionMessage,
} from "../../components/common/ActionFeedback";
import Button from "../../components/common/Button";

function Login() {
  const { user, login } = useAuth();
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [feedback, setFeedback] = useState<ActionMessage | null>(null);
  const isSubmitting = feedback?.kind === "pending";
  const [signedInUid, setSignedInUid] = useState<string | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    if (signedInUid && user?.uid === signedInUid) {
      navigate("/profile");
    }
  }, [navigate, signedInUid, user?.uid]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    const { elements } = event.currentTarget;
    const emailInput = elements.namedItem("email") as HTMLInputElement;
    const passwordInput = elements.namedItem("password") as HTMLInputElement;
    const invalidEmail =
      emailInput.validity.valueMissing || emailInput.validity.typeMismatch;
    const missingPassword = passwordInput.validity.valueMissing;
    setFeedback(null);
    setEmailError(invalidEmail ? "Wprowadź poprawny adres e-mail." : "");
    setPasswordError(missingPassword ? "Wprowadź hasło." : "");
    if (invalidEmail || missingPassword) {
      const firstInvalid = invalidEmail ? emailInput : passwordInput;
      requestAnimationFrame(() => firstInvalid.focus());
      return;
    }

    setFeedback({ kind: "pending", message: "Logowanie…" });
    try {
      setSignedInUid(await login(emailInput.value, passwordInput.value));
    } catch {
      setFeedback({
        kind: "error",
        message: "Nie udało się zalogować. Sprawdź dane i spróbuj ponownie.",
      });
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[#121416] px-4 text-[#ddddff]">
      <h2 className="text-3xl font-bold md:text-6xl">Logowanie</h2>
      <form
        noValidate
        onSubmit={handleSubmit}
        className="flex w-full max-w-sm flex-col items-center gap-5"
      >
        <AuthField
          name="email"
          label="Adres e-mail"
          type="email"
          placeholder="Wpisz swój email"
          autoComplete="username"
          value={email}
          error={emailError}
          disabled={isSubmitting}
          onChange={(value) => {
            setEmail(value);
            setEmailError("");
            setFeedback(null);
          }}
        />
        <AuthField
          name="password"
          label="Hasło"
          type="password"
          placeholder="Wpisz swoje hasło"
          autoComplete="current-password"
          value={password}
          error={passwordError}
          disabled={isSubmitting}
          onChange={(value) => {
            setPassword(value);
            setPasswordError("");
            setFeedback(null);
          }}
        />
        <Button type="submit" isStandalone disabled={isSubmitting}>
          Zaloguj się
        </Button>
      </form>
      <ActionFeedback feedback={feedback} />
    </div>
  );
}

export default Login;
