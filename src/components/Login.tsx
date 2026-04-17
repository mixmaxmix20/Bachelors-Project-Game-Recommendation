import "./Login.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../main";
import { useAuth } from "../contexts/authContext";

interface LoginProps {}

function Login(props: LoginProps) {
  const { login } = useAuth();
  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [generalError, setGeneralError] = useState("");

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
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;

        alert(`Błąd: Niepoprawne dane`);
      });
  }

  return (
    <div className="mainContainer">
      <div className="titleContainer">
        <div>Zaloguj się</div>
      </div>
      <br />
      <div className="inputContainer">
        <input
          name="email"
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
          name="password"
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
          value="Zaloguj"
          type="button"
          onClick={onButtonClick}
          className="inputButton"
        />
      </div>
    </div>
  );
}

export default Login;
