import type { AuthResponseDto } from "api";
import { createContext, useContext } from "react";

export const AuthContext = createContext<{
  currentAuth?: AuthResponseDto | null;
  setSession: (user: AuthResponseDto) => void;
  onLogin: (response: AuthResponseDto) => void;

  logout: () => void;
}>({
  currentAuth: null,
  setSession: () => {},
  onLogin: () => {},

  logout: () => {},
});

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
