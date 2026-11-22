import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar";

function ProtectedLayout() {
  const { pathname } = useLocation();

  return (
    <div className="grid h-dvh grid-rows-[minmax(0,1fr)_auto] lg:grid-cols-[auto_minmax(0,1fr)] lg:grid-rows-[minmax(0,1fr)]">
      <Navbar />
      <main
        key={pathname}
        tabIndex={0}
        className="@container/app-content relative col-start-1 row-start-1 overflow-y-auto focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ui-muted lg:col-start-2"
      >
        <Outlet />
      </main>
    </div>
  );
}

export default ProtectedLayout;
