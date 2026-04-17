import "./Navbar.css";
import { useNavigate } from "react-router-dom";
import { auth } from "../main";
import { signOut } from "firebase/auth";

function Navbar() {
  const navigate = useNavigate();

  function onClickProfile() {
    navigate("/profile");
  }

  function onClickCollection() {
    navigate("/collection");
  }

  function onClickRecommendation() {
    navigate("/recommendation");
  }

  function onClickLogout() {
    signOut(auth);
    navigate("/");
  }

  return (
    <div className="navbar">
      <h1>SRG</h1>
      <div className="navbar-list">
        <button className="navbar-item" onClick={onClickProfile}>
          <span>Profil</span>
        </button>
        <button className="navbar-item" onClick={onClickCollection}>
          <span>Kolekcja gier</span>
        </button>
        <button className="navbar-item" onClick={onClickRecommendation}>
          <span>Rekomendacje</span>
        </button>
        <button className="navbar-item logout" onClick={onClickLogout}>
          <span>Wyloguj się</span>
        </button>
      </div>
    </div>
  );
}

export default Navbar;
