import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
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

  async function onButtonClick() {
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
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#121416] text-[#ddddff]">
      <div className="flex flex-col items-center justify-center text-6xl font-bold">
        <h2 className="text-3xl md:text-6xl">Rejestracja</h2>
      </div>
      <br />
      <div className="flex flex-col items-start justify-center">
        <input
          value={email}
          placeholder="Wpisz swój email"
          onChange={(ev) => setEmail(ev.target.value)}
          className="h-12 w-full max-w-sm md:w-96 text-lg rounded-lg border border-ui-border ui-focus pl-2 self-center"
          autoComplete="off"
          type="email"
        />
        <label className="text-red-500 text-xs">{emailError}</label>
      </div>
      <br />
      <div className="flex flex-col items-start justify-center">
        <input
          value={password}
          type="password"
          placeholder="Wpisz swoje hasło"
          onChange={(ev) => setPassword(ev.target.value)}
          className="h-12 w-full max-w-sm md:w-96 text-lg rounded-lg border border-ui-border ui-focus pl-2 self-center"
          autoComplete="new-password"
        />
        <label className="text-red-500 text-xs">{passwordError}</label>
      </div>
      <br />
      <div className="flex flex-col items-start justify-center">
        <input
          value={passwordConfirm}
          type="password"
          placeholder="Potwierdź swoje hasło"
          onChange={(ev) => setPasswordConfirm(ev.target.value)}
          className="h-12 w-full max-w-sm md:w-96 text-lg rounded-lg border border-ui-border ui-focus pl-2 self-center"
          autoComplete="new-password"
        />
        <label className="text-red-500 text-xs">{passwordConfirmError}</label>
      </div>
      <br />
      <Button onClickPar={onButtonClick} isStandalone={true} disabled={isSubmitting}>Stwórz profil</Button>
    </div>
  );
}

export default Register;
