import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import AuthField from "../../components/common/AuthField";
import Button from "../../components/layout/Button";

function Login() {
  const { user, login } = useAuth();
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
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

    setPasswordError("");
    setEmailError("");

    if ("" === email) {
      setEmailError("Proszę wprowadzić prawidłowy adres email");
      return;
    }

    if ("" === password) {
      setPasswordError("Proszę wprowadzić prawidłowe hasło");
      return;
    }

    setIsSubmitting(true);
    try {
      setSignedInUid(await login(email, password));
    } catch {
      setIsSubmitting(false);
      alert(`Błąd: Niepoprawne dane`);
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
          onChange={setEmail}
        />
        <AuthField
          name="password"
          label="Hasło"
          type="password"
          placeholder="Wpisz swoje hasło"
          autoComplete="current-password"
          value={password}
          error={passwordError}
          onChange={setPassword}
        />
        <Button type="submit" isStandalone disabled={isSubmitting}>
          Zaloguj się
        </Button>
      </form>
    </div>
  );
}

export default Login;
