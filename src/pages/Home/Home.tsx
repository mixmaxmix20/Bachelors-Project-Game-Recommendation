import { useNavigate } from "react-router-dom";
import Button from "../../components/layout/Button";
import { useEffect, useRef } from 'react';
import WebGLFluidEnhanced from "webgl-fluid-enhanced";

function Home() {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement | null>(null);

  function onButtonClickLogin() {
    navigate("/login");
  }

  function onButtonClickRegister() {
    navigate("/register");
  }
    useRef(null);
    useEffect(() => {
        if (!containerRef.current) return;

        const fluid = new WebGLFluidEnhanced(containerRef.current);
        fluid.setConfig({
            simResolution: 256,
            dyeResolution: 1024,
            curl: 2,
            velocityDissipation: 2.5,
            densityDissipation: 0.7,
            pressure: 0.8,
            pressureIterations: 30,
            splatRadius: 0.6,
            splatForce: 4000,
            shading: true,
            bloom: false,
            sunrays: false,
            colorPalette: ['#000000', '#ffffff'],
            transparent: true,
        });
        fluid.start();

        return () => {
            fluid.stop();
        }
    }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-[#ddddff] bg-linear-to-b from-[#1f1f1f] to-[#0d0d0d]">
      <div className="fixed inset-0 z-0">
        <div ref={containerRef} className="w-full h-full"></div>
      </div>
        <div className="relative z-10 flex flex-col items-center justify-center w-full pointer-events-none">
        <div className="flex flex-col items-center justify-center text-6xl font-bold -mt-24 mb-12 text-center">
            <h2>SRG</h2>
          </div>
          <div className="w-1/2 border-4 border-[#1f2326] bg-[#1f2326] mb-10 backdrop-blur-xs pointer-events-auto">
            <p className="text-2xl">Witaj!</p>
            <p className="text-2xl">
              SRG to narzędzie do rekomendacji gier - dodaj swoje ulubione tytuły i
              odkryj nowe, dopasowane do twoich upodobań.
            </p>
          </div>
          <div className="flex justify-center gap-24 mt-5 pointer-events-auto">
            <Button onClickPar={onButtonClickRegister} isStandalone={true}>Stwórz profil</Button>
            <Button onClickPar={onButtonClickLogin} isStandalone={true}>Zaloguj się</Button>
          </div>
        </div>
    </div>
  );
}

export default Home;
