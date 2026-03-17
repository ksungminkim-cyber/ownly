"use client";
import { createContext, useContext, useEffect } from "react";

const ThemeContext = createContext({ theme: "light" });

export function ThemeProvider({ children }) {
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", "light");
    try { localStorage.removeItem("ownly-theme"); } catch {}
  }, []);
  return (
    <ThemeContext.Provider value={{ theme: "light" }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
