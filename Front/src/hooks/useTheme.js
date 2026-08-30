import { useCallback, useSyncExternalStore } from "react";

const STORAGE_KEY = "theme";

// The <html class="dark"> set by the inline script in index.html is the single
// source of truth. Every useTheme() caller subscribes to the same store, so
// toggling in the navbar also re-renders the map, the charts and anything else
// that branches on the theme — previously each caller held its own useState
// copy and only the one you clicked ever updated.
const listeners = new Set();

function getSnapshot() {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function applyTheme(theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.style.backgroundColor = theme === "dark" ? "#0a0a0f" : "#f7f8fc";

  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch (e) {
    /* storage blocked (private mode) — the class is still applied */
  }

  listeners.forEach((listener) => listener());
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, () => "dark");

  const setTheme = useCallback((next) => applyTheme(next), []);
  const toggleTheme = useCallback(
    () => applyTheme(getSnapshot() === "dark" ? "light" : "dark"),
    []
  );

  return { theme, setTheme, toggleTheme };
}
