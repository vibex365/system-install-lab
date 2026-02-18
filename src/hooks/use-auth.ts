import { useState, useCallback, useEffect } from "react";
import { track } from "@/lib/analytics";

const AUTH_KEY = "pfsw_auth";

export function useAuth() {
  const [isAuthed, setIsAuthed] = useState(() => {
    return typeof window !== "undefined" && localStorage.getItem(AUTH_KEY) === "true";
  });

  useEffect(() => {
    const check = () => setIsAuthed(localStorage.getItem(AUTH_KEY) === "true");
    window.addEventListener("storage", check);
    return () => window.removeEventListener("storage", check);
  }, []);

  const login = useCallback(() => {
    localStorage.setItem(AUTH_KEY, "true");
    setIsAuthed(true);
    track("login_success_demo");
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_KEY);
    setIsAuthed(false);
    track("logout");
  }, []);

  return { isAuthed, login, logout };
}
