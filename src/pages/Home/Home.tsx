import { useNavigate } from "react-router-dom";
import Button from "../../components/layout/Button";
import { useEffect, useRef } from "react";
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
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let fluid: WebGLFluidEnhanced | undefined;

    const stopFluid = () => {
      fluid?.stop();
      fluid = undefined;
      container.replaceChildren();
    };

    const syncMotion = () => {
      if (reducedMotion.matches) {
        stopFluid();
        return;
      }

      try {
        fluid = new WebGLFluidEnhanced(container);
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
          colorPalette: ["#000000", "#ffffff"],
          transparent: true,
        });
        fluid.start();
      } catch {
        stopFluid();
      }
    };

    syncMotion();
    reducedMotion.addEventListener("change", syncMotion);
    return () => {
      reducedMotion.removeEventListener("change", syncMotion);
      stopFluid();
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-[#ddddff] bg-linear-to-b from-[#1f1f1f] to-[#0d0d0d]">
      <div
        aria-hidden="true"
        className="fixed inset-0 z-0 motion-reduce:hidden"
      >
        <div ref={containerRef} className="w-full h-full"></div>
      </div>
      <div className="relative z-10 flex flex-col items-center justify-center w-full pointer-events-none">
        <div className="flex flex-col items-center justify-center text-6xl font-bold -mt-24 mb-12 text-center">
          <h2>SRG</h2>
        </div>
        <div className="w-11/12 max-w-2xl px-6 py-4 md:w-1/2 border-4 border-[#1f2326] bg-[#1f2326] mb-10 backdrop-blur-xs pointer-events-auto">
          <p className="text-2xl text-center mb-2">Witaj!</p>
          <p className="text-2xl">
            SRG to narzędzie do rekomendacji gier - dodaj swoje ulubione tytuły
            i odkryj nowe, dopasowane do twoich upodobań.
          </p>
        </div>
        <div className="flex flex-col md:flex-row gap-4 md:gap-24 justify-center mt-5 pointer-events-auto">
          <Button onClick={onButtonClickRegister} isStandalone={true}>
            Stwórz profil
          </Button>
          <Button onClick={onButtonClickLogin} isStandalone={true}>
            Zaloguj się
          </Button>
        </div>
      </div>
    </div>
  );
}

export default Home;
