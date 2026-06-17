import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRuntimeConfig } from "../config/ConfigProvider";
import {
  beginOidcLogin,
  clearAuthCallbackFromHistory,
  completeOidcLogin,
  isAuthCallbackPath,
} from "./oidc";
import {
  clearStoredToken,
  decodeJwtPayload,
  getStoredToken,
} from "./storage";

type AuthContextValue = {
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: Error | null;
  userLabel: string | null;
  login: () => Promise<void>;
  logout: () => void;
  handleUnauthorized: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { config, isLoading: configLoading } = useRuntimeConfig();
  const [token, setToken] = useState<string | null>(() => getStoredToken());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const logout = useCallback(() => {
    clearStoredToken();
    setToken(null);
    setError(null);
  }, []);

  const handleUnauthorized = useCallback(() => {
    logout();
    setError(new Error("Session expired. Sign in again."));
  }, [logout]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.__aivcsHandleUnauthorized = handleUnauthorized;
    return () => {
      delete window.__aivcsHandleUnauthorized;
    };
  }, [handleUnauthorized]);

  useEffect(() => {
    if (configLoading || !config) return;

    if (!isAuthCallbackPath()) {
      setIsLoading(false);
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const state = params.get("state");
    const oauthError = params.get("error");

    if (oauthError) {
      setError(new Error(`OAuth error: ${oauthError}`));
      clearAuthCallbackFromHistory();
      setIsLoading(false);
      return;
    }

    if (!code || !state) {
      setError(new Error("Missing OAuth callback parameters"));
      clearAuthCallbackFromHistory();
      setIsLoading(false);
      return;
    }

    completeOidcLogin(config, code, state)
      .then((nextToken) => {
        setToken(nextToken);
        setError(null);
        clearAuthCallbackFromHistory();
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err : new Error(String(err)));
        clearAuthCallbackFromHistory();
      })
      .finally(() => setIsLoading(false));
  }, [config, configLoading]);

  const login = useCallback(async () => {
    if (!config) {
      throw new Error("Runtime config not loaded");
    }
    setError(null);
    await beginOidcLogin(config);
  }, [config]);

  const userLabel = useMemo(() => {
    if (!token) return null;
    const payload = decodeJwtPayload(token);
    const email = payload?.email;
    if (typeof email === "string") return email;
    const name = payload?.name;
    if (typeof name === "string") return name;
    const sub = payload?.sub;
    if (typeof sub === "string") return sub;
    return "Signed in";
  }, [token]);

  const isAuthenticated = Boolean(token);
  const waitingForCallback = isAuthCallbackPath();

  const value: AuthContextValue = {
    token,
    isAuthenticated,
    isLoading: configLoading || isLoading || waitingForCallback,
    error,
    userLabel,
    login,
    logout,
    handleUnauthorized,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}

declare global {
  interface Window {
    __aivcsHandleUnauthorized?: () => void;
  }
}
