import { useEffect, useState } from "react";

export const TABS = [
  { path: "/gegevens-opvragen", label: "Gegevens opvragen" },
  { path: "/gegevens-uitgeven", label: "Gegevens uitgeven" },
] as const;

export type TabPath = (typeof TABS)[number]["path"];

/** Standalone pages: routable, but not in the tab bar. */
const PAGES = ["/mobile"] as const;

export type Route = TabPath | (typeof PAGES)[number];

const DEFAULT_TAB: TabPath = "/gegevens-opvragen";

function normalise(pathname: string): Route {
  if (TABS.some((t) => t.path === pathname)) return pathname as TabPath;
  if ((PAGES as readonly string[]).includes(pathname)) return pathname as Route;
  return DEFAULT_TAB;
}

/**
 * Route state kept in the URL, so each page is linkable and the back button
 * works. Hand-rolled rather than pulling in a router: there are three routes,
 * and the server already answers any path with index.html (see
 * `server/index.js`).
 */
export function useRoute(): [Route, (path: Route) => void] {
  const [path, setPath] = useState<Route>(() => normalise(window.location.pathname));

  useEffect(() => {
    const onPop = () => setPath(normalise(window.location.pathname));
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const navigate = (next: Route) => {
    if (next !== window.location.pathname) window.history.pushState(null, "", next);
    setPath(next);
  };

  return [path, navigate];
}
