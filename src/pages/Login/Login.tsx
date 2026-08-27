import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../services/firebase";
import { useAuth } from "../../contexts/AuthContext";
import Button from "../../components/layout/Button";

function Login() {
  const { login } = useAuth();
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [, setGeneralError] = useState("");

  const navigate = useNavigate();

  function onButtonClick() {
    setPasswordError("");
    setEmailError("");
    setGeneralError("");

    if ("" === email) {
      setEmailError("Proszę wprowadzić prawidłowy adres email");
      return;
    }

    if ("" === password) {
      setPasswordError("Proszę wprowadzić prawidłowe hasło");
      return;
    }

    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        login(userCredential.user);
        navigate("/profile");
      })
      .catch(() => {
        alert(`Błąd: Niepoprawne dane`);
      });
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
          className="h-12 w-full max-w-sm md:w-96 text-lg rounded-lg border border-gray-500 pl-2 self-center"
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
          className="h-12 w-full max-w-sm md:w-96 text-lg rounded-lg border border-gray-500 pl-2 self-center"
        />
        <label className="text-red-500 text-xs">{passwordError}</label>
      </div>
      <br />
      <Button onClickPar={onButtonClick} isStandalone={true}>Zaloguj się</Button>
    </div>
  );
}

export default Login;
