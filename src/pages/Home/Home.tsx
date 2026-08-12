import { useNavigate } from "react-router-dom";
import Navbar from "../../components/layout/Navbar";
import "./Home.css";

interface HomeProps {}

function Home(props: HomeProps) {
  const navigate = useNavigate();

  function onButtonClickLogin() {
    navigate("/login");
  }

  function onButtonClickRegister() {
    navigate("/register");
  }

  return (
    <div className="mainContainer">
      <div className="titleContainer">
        <h2>SRG</h2>
      </div>
      <div className="pContainer">
        <p className="pHome">Witaj!</p>
        <p className="pHome">
          SRG to narzędzie do rekomendacji gier - dodaj swoje ulubione tytuły i
          odkryj nowe, dopasowane do twoich upodobań.
        </p>
      </div>
      <div className="buttonRow">
        <div className="buttonContainer">
          {/* <p>Stwórz profil:</p> */}
          <input
            className="inputButton"
            type="button"
            onClick={onButtonClickRegister}
            value="Stwórz profil"
          ></input>
        </div>
        <br />
        <div className="buttonContainer">
          {/* <p>Zaloguj się:</p> */}
          <input
            className="inputButton"
            type="button"
            onClick={onButtonClickLogin}
            value="Zaloguj się"
          ></input>
        </div>
      </div>
    </div>
  );
}

export default Home;
