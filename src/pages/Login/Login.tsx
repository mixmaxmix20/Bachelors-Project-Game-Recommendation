import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
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

  async function onButtonClick() {
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
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#121416] text-[#ddddff]">
      <div className="flex flex-col items-center justify-center text-6xl font-bold">
        <h2 className="text-3xl md:text-6xl">Logowanie</h2>
      </div>
      <br />
      <div className="flex flex-col items-start justify-center">
        <input
          name="email"
          value={email}
          placeholder="Wpisz swój email"
          onChange={(ev) => setEmail(ev.target.value)}
          className="h-12 w-full max-w-sm md:w-96 text-lg rounded-lg border border-ui-border ui-focus pl-2 self-center"
        />
        <label className="text-red-500 text-xs">{emailError}</label>
      </div>
      <br />
      <div className="flex flex-col items-start justify-center">
        <input
          name="password"
          value={password}
          type="password"
          placeholder="Wpisz swoje hasło"
          onChange={(ev) => setPassword(ev.target.value)}
          className="h-12 w-full max-w-sm md:w-96 text-lg rounded-lg border border-ui-border ui-focus pl-2 self-center"
        />
        <label className="text-red-500 text-xs">{passwordError}</label>
      </div>
      <br />
      <Button onClickPar={onButtonClick} isStandalone={true} disabled={isSubmitting}>Zaloguj się</Button>
    </div>
  );
}

export default Login;
