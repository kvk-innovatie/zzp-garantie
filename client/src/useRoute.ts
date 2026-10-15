import { useEffect, useState } from "react";

export const TABS = [
  { path: "/gegevens-opvragen", label: "Gegevens opvragen" },
  { path: "/gegevens-uitgeven", label: "Gegevens uitgeven" },
] as const;

export type TabPath = (typeof TABS)[number]["path"];

const DEFAULT_TAB: TabPath = "/gegevens-opvragen";

function normalise(pathname: string): TabPath {
  return TABS.some((t) => t.path === pathname) ? (pathname as TabPath) : DEFAULT_TAB;
}

/**
 * Tab state kept in the URL, so each tab is linkable and the back button works.
 * Hand-rolled rather than pulling in a router: there are two routes, and the
 * server already answers any path with index.html (see `server/index.js`).
 */
export function useRoute(): [TabPath, (path: TabPath) => void] {
  const [path, setPath] = useState<TabPath>(() => normalise(window.location.pathname));

  useEffect(() => {
    const onPop = () => setPath(normalise(window.location.pathname));
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const navigate = (next: TabPath) => {
    if (next !== window.location.pathname) window.history.pushState(null, "", next);
    setPath(next);
  };

  return [path, navigate];
}
