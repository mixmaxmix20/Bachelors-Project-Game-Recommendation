import "./Register.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { app, auth } from "../main";

interface RegisterProps {}

function Register(props: RegisterProps) {
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
      .then((userCredential) => {
        navigate("/profile");
      })
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;

        alert(`Błąd: Podany email jest już w użyciu`);
      });
  }

  return (
    <div className="mainContainer">
      <div className="titleContainer">
        <div>Stwórz profil</div>
      </div>
      <br />
      <div className="inputContainer">
        <input
          value={email}
          placeholder="Wpisz swój email"
          onChange={(ev) => setEmail(ev.target.value)}
          className="inputBox"
        />
        <label className="errorLabel">{emailError}</label>
      </div>
      <br />
      <div className="inputContainer">
        <input
          value={password}
          type="password"
          placeholder="Wpisz swoje hasło"
          onChange={(ev) => setPassword(ev.target.value)}
          className="inputBox"
        />
        <label className="errorLabel">{passwordError}</label>
      </div>
      <br />
      <div className="inputContainer">
        <input
          value={passwordConfirm}
          type="password"
          placeholder="Potwierdź swoje hasło"
          onChange={(ev) => setPasswordConfirm(ev.target.value)}
          className="inputBox"
        />
        <label className="errorLabel">{passwordConfirmError}</label>
      </div>
      <br />
      <div className="inputContainer">
        <input
          value="Stwórz profil"
          type="button"
          onClick={onButtonClick}
          className="inputButton"
        />
      </div>
      <div className="errorContainer">
        {generalError && <p className="errorMessage">{generalError}</p>}
      </div>
    </div>
  );
}

export default Register;
