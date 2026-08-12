import "./Navbar.css";
import { useNavigate } from "react-router-dom";
import { auth } from "../../services/firebase";
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
    <aside className="navbar">
      <input id="navbar-toggle" type="checkbox" className="drawer-toggle" />
      <h1>SRG</h1>
      <nav className="">
        <button className="navbar-item" onClick={onClickProfile}>
          <span>Profil</span>
        </button>
        <button className="navbar-item" onClick={onClickCollection}>
          <span>Kolekcja gier</span>
        </button>
        <button className="navbar-item" onClick={onClickRecommendation}>
          <span>Rekomendacje</span>
        </button>
        <button className="navbar-item" onClick={onClickLogout}>
          <span>Wyloguj się</span>
        </button>
      </nav>
    </aside>
  );
}

export default Navbar;
