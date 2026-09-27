import { Link } from "react-router-dom";
import { useLocation } from "react-router-dom";

export function SiteHeader() {
  const { pathname } = useLocation();
  if (pathname.startsWith("/repeat/study")) return null;

  return (
    <header className="border-b border-stone-200 bg-stone-50/90 backdrop-blur dark:border-stone-800 dark:bg-stone-950/90">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
        <Link
          to="/repeat"
          className="text-lg font-semibold tracking-tight text-stone-900 dark:text-stone-50"
        >
          chessrepeats
        </Link>
        <nav className="flex items-center gap-4 text-sm font-medium">
          <Link
            to="/repeat"
            className="text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100"
          >
            Decks
          </Link>
          <Link
            to="/repeat/settings"
            className="text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100"
          >
            Settings
          </Link>
        </nav>
      </div>
    </header>
  );
}
