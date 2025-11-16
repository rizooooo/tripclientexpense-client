import type { AuthResponseDto } from "api";
import { useState } from "react";

const AUTH_STORAGE_KEY = "user";
const TOKEN_STORAGE_KEY = "jwtToken";

const useLocalStorageToken = () => {
  // ✅ Initialize currentUser from localStorage
  const [currentUser, setCurrentUserState] = useState<AuthResponseDto | null>(
    () => {
      const storedUser = localStorage.getItem(AUTH_STORAGE_KEY);
      return storedUser ? (JSON.parse(storedUser) as AuthResponseDto) : null;
    }
  );

  const setToken = (newToken: string) => {
    localStorage.setItem(TOKEN_STORAGE_KEY, newToken);
    
    // Also update in user object if it exists
    const storedUser = localStorage.getItem(AUTH_STORAGE_KEY);
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      parsed.token = newToken;
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(parsed));
      setCurrentUserState(parsed);
    }
  };

  const clearToken = () => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setCurrentUserState(null);
  };

  const setCurrentUser = (user: AuthResponseDto) => {
    setCurrentUserState(user);
    // Store complete auth data including token and refreshToken
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    localStorage.setItem(TOKEN_STORAGE_KEY, user.token);
  };

  const onClearAll = () => {
    setCurrentUserState(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  };

  return {
    token: currentUser?.token || null,
    setToken,
    clearToken,
    setCurrentUser,
    currentUser,
    onClearAll,
  };
};

export default useLocalStorageToken;
