import * as React from "react";

const TABLET_MIN = 768;
const TABLET_MAX = 1023;

export function useIsTablet() {
  const [isTablet, setIsTablet] = React.useState<boolean>(false);

  React.useEffect(() => {
    const check = () => {
      const w = window.innerWidth;
      setIsTablet(w >= TABLET_MIN && w <= TABLET_MAX);
    };
    check();
    const mqlMin = window.matchMedia(`(min-width: ${TABLET_MIN}px)`);
    const mqlMax = window.matchMedia(`(max-width: ${TABLET_MAX}px)`);
    const handler = () => check();
    mqlMin.addEventListener("change", handler);
    mqlMax.addEventListener("change", handler);
    return () => {
      mqlMin.removeEventListener("change", handler);
      mqlMax.removeEventListener("change", handler);
    };
  }, []);

  return isTablet;
}

export function useIsLandscape() {
  const [isLandscape, setIsLandscape] = React.useState<boolean>(false);

  React.useEffect(() => {
    const mql = window.matchMedia("(orientation: landscape)");
    const handler = () => setIsLandscape(mql.matches);
    handler();
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  return isLandscape;
}
