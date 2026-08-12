import { useNavigate } from "react-router-dom";
import { auth } from "../../services/firebase";
import { signOut } from "firebase/auth";
import Button from "./Button";

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
      <aside className="fixed top-0 left-0 h-screen w-15 bg-[#1f2326] text-white p-2.5 box-border flex flex-col items-center shadow-md font-sans transition-[width] duration-300 ease-in-out overflow-hidden z-10 group hover:w-64 hover:text-amber-300">
        <h1 className="text-2xl py-3.5 px-17.5 pb-2.5 mb-5 text-white text-center font-bold border-b-2 border-white/50 opacity-0 transition-opacity duration-300 ease-in-out overflow-hidden whitespace-nowrap group-hover:opacity-100">
          SRG
        </h1>
        <nav className="p-0 ml-2.5 w-full flex flex-col items-start">
          <Button onClickPar={onClickProfile}>Profil</Button>
          <Button onClickPar={onClickCollection}>Kolekcja gier</Button>
          <Button onClickPar={onClickRecommendation}>Rekomendacje</Button>
          <Button onClickPar={onClickLogout} isLogout={true}>Wyloguj się</Button>
        </nav>
      </aside>
  );
}

export default Navbar;
