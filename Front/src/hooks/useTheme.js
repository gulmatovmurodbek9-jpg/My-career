import { useCallback, useSyncExternalStore } from "react";

const STORAGE_KEY = "theme";

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
