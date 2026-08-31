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
      <>
        {/*Mobile*/}
        <nav className="dock pointer-fine:hidden">
          <button onClick={onClickProfile}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            </svg>
            <span className="dock-label">Profil</span>
          </button>
          <button onClick={onClickCollection}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
            </svg>
            <span className="dock-label">Kolekcja</span>
          </button>
          <button onClick={onClickRecommendation}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 0 0 .495-7.468 5.99 5.99 0 0 0-1.925 3.547 5.975 5.975 0 0 1-2.133-1.001A3.75 3.75 0 0 0 12 18Z" />
            </svg>
            <span className="dock-label">Rekomendacje</span>
          </button>
          <button onClick={onClickLogout}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
            </svg>
            <span className="dock-label">Wyloguj się</span>
          </button>
        </nav>

        {/*Desktop*/}
        <aside className="hidden pointer-fine:flex fixed top-0 left-0 h-screen w-15 bg-[#1f2326] text-white p-2.5 box-border flex-col items-center shadow-md font-sans transition-[width] duration-300 ease-in-out overflow-hidden z-10 group hover:w-64 hover:text-amber-300">
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
      </>
  );
}

export default Navbar;
