import { useState } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { protectedPages } from "../../protectedPages";

const links = [
  {
    ...protectedPages.profile,
    iconPaths: [
      "M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z",
    ],
  },
  {
    ...protectedPages.collection,
    iconPaths: [
      "M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z",
    ],
  },
  {
    ...protectedPages.recommendation,
    iconPaths: [
      "M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 1 3 2.48Z",
      "M12 18a3.75 3.75 0 0 0 .495-7.468 5.99 5.99 0 0 0-1.925 3.547 5.975 5.975 0 0 1-2.133-1.001A3.75 3.75 0 0 0 12 18Z",
    ],
  },
];

const logoutIconPaths = [
  "M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9",
];

function NavigationIcon({ paths }: { paths: string[] }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      className="size-6 shrink-0"
    >
      {paths.map((path) => (
        <path
          key={path}
          strokeLinecap="round"
          strokeLinejoin="round"
          d={path}
        />
      ))}
    </svg>
  );
}

function Navbar() {
  const { logout, isSigningOut } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);

  async function onClickLogout() {
    try {
      await logout();
    } catch {
      alert("Nie udało się wylogować. Spróbuj ponownie.");
    }
  }

  const panelWidth = isExpanded ? "lg:w-64" : "lg:w-16";
  const labelClasses = isExpanded ? "lg:text-sm" : "lg:sr-only";
  const itemAlignment = isExpanded
    ? "lg:flex-row lg:justify-start lg:gap-3 lg:px-3"
    : "";
  const itemClasses = `ui-focus min-h-14 min-w-0 w-full cursor-pointer flex-col items-center justify-center gap-1 rounded-md text-center text-[0.6875rem] leading-tight wrap-anywhere hover:bg-white/10 lg:min-h-11 ${itemAlignment}`;

  return (
    <nav
      aria-label="Nawigacja główna"
      className={`relative col-start-1 row-start-2 border-t border-white/15 bg-[#1f2326] p-1 pb-[calc(0.25rem+env(safe-area-inset-bottom))] text-white lg:row-start-1 lg:overflow-y-auto lg:border-t-0 lg:border-r lg:p-2 ${panelWidth}`}
    >
      <button
        type="button"
        aria-expanded={isExpanded}
        aria-controls="main-navigation-items"
        className={`mb-2 hidden lg:flex ${itemClasses}`}
        onClick={() => setIsExpanded((expanded) => !expanded)}
      >
        <NavigationIcon
          paths={[
            "M4 6h8m-8 6h8m-8 6h8",
            isExpanded ? "M19 8l-4 4 4 4" : "M15 8l4 4-4 4",
          ]}
        />
        <span className={labelClasses}>
          {isExpanded ? "Zwiń menu" : "Rozwiń menu"}
        </span>
      </button>
      <div
        id="main-navigation-items"
        className="grid grid-cols-4 gap-1 lg:flex lg:flex-col"
      >
        {links.map(({ path, label, iconPaths }) => (
          <NavLink
            key={path}
            to={path}
            className={`flex aria-[current=page]:bg-amber-300/15 aria-[current=page]:text-amber-300 aria-[current=page]:inset-ring-1 aria-[current=page]:inset-ring-amber-300/80 ${itemClasses}`}
          >
            <NavigationIcon paths={iconPaths} />
            <span className={labelClasses}>{label}</span>
          </NavLink>
        ))}
        <button
          type="button"
          disabled={isSigningOut}
          className={`flex disabled:cursor-not-allowed disabled:opacity-50 ${itemClasses}`}
          onClick={onClickLogout}
        >
          <NavigationIcon paths={logoutIconPaths} />
          <span className={labelClasses}>Wyloguj się</span>
        </button>
      </div>
    </nav>
  );
}

export default Navbar;
