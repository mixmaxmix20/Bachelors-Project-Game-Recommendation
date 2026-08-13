import { useNavigate } from "react-router-dom";
import Button from "../../components/layout/Button";

function Home() {
  const navigate = useNavigate();

  function onButtonClickLogin() {
    navigate("/login");
  }

  function onButtonClickRegister() {
    navigate("/register");
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-[#ddddff] bg-gradient-to-b from-[#1f1f1f] to-[#0d0d0d]">
      <div className="flex flex-col items-center justify-center text-6xl font-bold -mt-24 mb-12 text-center">
        <h2>SRG</h2>
      </div>
      <div className="w-1/2 border-4 border-[#1f2326] bg-[#1f2326] mb-10">
        <p className="text-2xl">Witaj!</p>
        <p className="text-2xl">
          SRG to narzędzie do rekomendacji gier - dodaj swoje ulubione tytuły i
          odkryj nowe, dopasowane do twoich upodobań.
        </p>
      </div>
      <div className="flex justify-center gap-24 mt-5">
        <Button onClickPar={onButtonClickRegister} isStandalone={true}>Stwórz profil</Button>
        <Button onClickPar={onButtonClickLogin} isStandalone={true}>Zaloguj się</Button>
      </div>
    </div>
  );
}

export default Home;
