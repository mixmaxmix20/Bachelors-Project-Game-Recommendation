import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import AuthField from "../../components/common/AuthField";
import Button from "../../components/layout/Button";

function Register() {
  const { user, register } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordConfirmError, setPasswordConfirmError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registeredUid, setRegisteredUid] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (registeredUid && user?.uid === registeredUid) {
      navigate("/profile");
    }
  }, [navigate, registeredUid, user?.uid]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    setPasswordError("");
    setEmailError("");
    setPasswordConfirmError("");

    if ("" === email) {
      setEmailError("Proszę wprowadzić prawidłowy adres email");
      return;
    }

    if ("" === password) {
      setPasswordError("Proszę wprowadzić prawidłowe hasło");
      return;
    }

    if (password.length < 8) {
      setPasswordError("Hasło musi mieć przynajmniej 8 znaków");
      return;
    }

    if (password !== passwordConfirm) {
      setPasswordConfirmError("Hasła muszą być identyczne");
      return;
    }

    setIsSubmitting(true);
    try {
      setRegisteredUid(await register(email, password));
    } catch {
      setIsSubmitting(false);
      alert(`Błąd: Podany email jest już w użyciu`);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[#121416] px-4 text-[#ddddff]">
      <h2 className="text-3xl font-bold md:text-6xl">Rejestracja</h2>
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
          autoComplete="off"
          value={email}
          error={emailError}
          onChange={setEmail}
        />
        <AuthField
          name="password"
          label="Hasło"
          type="password"
          placeholder="Wpisz swoje hasło"
          autoComplete="new-password"
          value={password}
          error={passwordError}
          onChange={setPassword}
        />
        <AuthField
          name="passwordConfirm"
          label="Potwierdzenie hasła"
          type="password"
          placeholder="Potwierdź swoje hasło"
          autoComplete="new-password"
          value={passwordConfirm}
          error={passwordConfirmError}
          onChange={setPasswordConfirm}
        />
        <Button type="submit" isStandalone disabled={isSubmitting}>
          Stwórz profil
        </Button>
      </form>
    </div>
  );
}

export default Register;
