import type { AuthResponseDto } from "api";
import { useState } from "react";

const useLocalStorageToken = (key: string = "jwtToken") => {
  // ✅ Initialize token from localStorage
  const [token, setTokenState] = useState<string | null>(() => {
    return localStorage.getItem(key);
  });

  // ✅ Initialize currentUser from localStorage if present
  const [currentUser, setCurrentUserState] = useState<AuthResponseDto | null>(
    () => {
      const storedUser = localStorage.getItem("user");
      return storedUser ? (JSON.parse(storedUser) as AuthResponseDto) : null;
    }
  );

  const setToken = (newToken: string) => {
    localStorage.setItem(key, newToken);
    setTokenState(newToken);
  };

  const clearToken = () => {
    localStorage.removeItem(key);
    setTokenState(null);
  };

  const setCurrentUser = (user: AuthResponseDto) => {
    setCurrentUserState(user);
    localStorage.setItem("user", JSON.stringify(user));
  };

  const onClearAll = () => {
    setCurrentUserState(null);
    setTokenState(null);
    localStorage.clear();
  };

  return {
    token,
    setToken,
    clearToken,
    setCurrentUser,
    currentUser,
    onClearAll,
  };
};

export default useLocalStorageToken;
