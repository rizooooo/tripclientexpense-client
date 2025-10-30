import { useMemo } from "react";
import {
  Configuration,
  UsersApi,
  TripsApi,
  ExpensesApi,
  SettlementsApi,
  AuthApi,
} from "api";
import { useAuth } from "@/context/AuthContext";

// You can expand this later with other API classes
const useApi = () => {
  const { currentAuth } = useAuth();
  const token = currentAuth?.token;
  const basePath = import.meta.env.VITE_API // ✅ central place to configure API URL

  // Create configuration with dynamic token
  const config = useMemo(() => {
    return new Configuration({
      basePath,
      accessToken: token ? `Bearer ${token}` : undefined, // ✅ attach token
      headers: {
        Authorization: token ? `Bearer ${token}` : "", // ✅ attach token
      },
    });
  }, [basePath, token]);

  const userApi = useMemo(() => new UsersApi(config), [config]);
  const tripApi = useMemo(() => new TripsApi(config), [config]);
  const expenseApi = useMemo(() => new ExpensesApi(config), [config]);

  const authApi = useMemo(() => new AuthApi(config), [config]);

  const settlementApi = useMemo(() => new SettlementsApi(config), [config]);

  return {
    user: userApi,
    trip: tripApi,
    expense: expenseApi,
    settlementApi,
    authApi,
  } as const;
};

export default useApi;
