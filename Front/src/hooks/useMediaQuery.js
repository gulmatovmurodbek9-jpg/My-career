import { useEffect, useState } from "react";

/**
 * Ба CSS media query обуна мешавад.
 *
 * Барои ҳолатҳое лозим аст, ки танҳо пинҳон кардан бо CSS кифоя нест — масалан,
 * ҳикояи скролли sticky дар мобилӣ набояд умуман сохта шавад, на танҳо пинҳон.
 */
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = (e) => setMatches(e.matches);
    setMatches(mql.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}
