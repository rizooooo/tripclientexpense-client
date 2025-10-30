import { AuthContext } from "@/context/AuthContext";
import useLocalStorageToken from "@/hooks/useLocalstorageToken";
import type { AuthResponseDto } from "api";
import React, { type FC } from "react";

const AuthProvider: FC<{ children: React.ReactNode }> = ({ children }) => {
  const { setCurrentUser, currentUser, setToken, onClearAll } =
    useLocalStorageToken();

  const onLogin = (response: AuthResponseDto) => {
    setToken(response?.token as string);
  };

  const logout = () => {
    onClearAll();
  };

  return (
    <AuthContext.Provider
      value={{
        currentAuth: currentUser,
        setSession: setCurrentUser,
        onLogin,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
