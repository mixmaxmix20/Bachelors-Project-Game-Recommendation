import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../services/firebase";
import Button from "../../components/layout/Button";

function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordConfirmError, setPasswordConfirmError] = useState("");
  const [generalError, setGeneralError] = useState("");
  const navigate = useNavigate();

  function onButtonClick() {
    setPasswordError("");
    setEmailError("");
    setPasswordConfirmError("");
    setGeneralError("");

    if ("" === email) {
      setEmailError("Proszę wprowadzić prawidłowy adres email");
      return;
    }

    if ("" === password) {
      setPasswordError("Proszę wprowadzić prawidłowe hasło");
      return;
    }

    if (password.length < 7) {
      setPasswordError("Hasło musi mieć przynajmniej 8 znaków");
      return;
    }

    if (password !== passwordConfirm) {
      setPasswordConfirmError("Hasła muszą być identyczne");
      return;
    }

    createUserWithEmailAndPassword(auth, email, password)
      .then(() => {
        navigate("/profile");
      })
      .catch(() => {
        alert(`Błąd: Podany email jest już w użyciu`);
      });
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
          className="h-12 w-full max-w-sm md:w-96 text-lg rounded-lg border border-gray-500 pl-2 self-center"
          autoComplete="off"
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
          className="h-12 w-full max-w-sm md:w-96 text-lg rounded-lg border border-gray-500 pl-2 self-center"
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
          className="h-12 w-full max-w-sm md:w-96 text-lg rounded-lg border border-gray-500 pl-2 self-center"
          autoComplete="new-password"
        />
        <label className="text-red-500 text-xs">{passwordConfirmError}</label>
      </div>
      <br />
      <Button onClickPar={onButtonClick} isStandalone={true}>Stwórz profil</Button>
      <div className="flex flex-col items-center justify-center">
        {generalError && <p className="text-red-500 text-xs">{generalError}</p>}
      </div>
    </div>
  );
}

export default Register;
