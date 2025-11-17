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

// Flag to prevent multiple refresh attempts
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// You can expand this later with other API classes
const useApi = () => {
  const { currentAuth, setSession, logout } = useAuth();
  const token = currentAuth?.token;
  const basePath = import.meta.env.VITE_API; // ✅ central place to configure API URL

  // Create configuration with dynamic token and middleware
  const config = useMemo(() => {
    // Create middleware for token refresh
    const refreshTokenMiddleware = {
      post: async (context): Promise<Response | void> => {
        const { response, init } = context;

        // Check if response is 401 Unauthorized
        if (response.status === 401) {
          const originalUrl = context.url;
          const originalInit = init;

          // Don't retry if it's the refresh endpoint itself or login/register
          if (
            originalUrl.includes("/Auth/refresh") ||
            originalUrl.includes("/Auth/login") ||
            originalUrl.includes("/Auth/register")
          ) {
            return response;
          }

          // If already refreshing, queue this request
          if (isRefreshing) {
            return new Promise((resolve, reject) => {
              failedQueue.push({ resolve, reject });
            })
              .then((newToken) => {
                // Retry with new token
                const newHeaders = new Headers(originalInit?.headers);
                newHeaders.set("Authorization", `Bearer ${newToken}`);
                return fetch(originalUrl, {
                  ...originalInit,
                  headers: newHeaders,
                });
              })
              .catch((err) => {
                throw err;
              });
          }

          isRefreshing = true;

          const storedUser = localStorage.getItem("user");
          if (!storedUser) {
            isRefreshing = false;
            logout();
            window.location.href = "/login";
            return response;
          }

          const authData = JSON.parse(storedUser);
          if (!authData.refreshToken) {
            isRefreshing = false;
            logout();
            window.location.href = "/login";
            return response;
          }

          try {
            // Call refresh endpoint
            const refreshResponse = await fetch(
              `${basePath}/api/Auth/refresh`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  refreshToken: authData.refreshToken,
                }),
              }
            );

            if (!refreshResponse.ok) {
              throw new Error("Refresh failed");
            }

            const newAuthData = await refreshResponse.json();

            // Update session with new tokens
            setSession(newAuthData);

            // Process queued requests with new token
            processQueue(null, newAuthData.token);

            isRefreshing = false;

            // Retry original request with new token
            const newHeaders = new Headers(originalInit?.headers);
            newHeaders.set("Authorization", `Bearer ${newAuthData.token}`);
            return fetch(originalUrl, { ...originalInit, headers: newHeaders });
          } catch (error) {
            // Refresh failed, clear auth and redirect to login
            processQueue(error, null);
            isRefreshing = false;
            logout();
            window.location.href = "/login";
            return response;
          }
        }

        return response;
      },
    };

    return new Configuration({
      basePath,
      accessToken: token ? `Bearer ${token}` : undefined, // ✅ attach token
      headers: {
        Authorization: token ? `Bearer ${token}` : "", // ✅ attach token
      },
      middleware: [refreshTokenMiddleware],
    });
  }, [basePath, token, setSession, logout]);

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
