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
  setStoredToken,
} from "./storage";

type AuthContextValue = {
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: Error | null;
  userLabel: string | null;
  user: { name?: string; email?: string; picture?: string } | null;
  login: () => Promise<void>;
  loginMock: (provider: "google" | "github", name: string, email: string) => void;
  logout: () => void;
  handleUnauthorized: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function base64urlEncode(str: string): string {
  const base64 = btoa(unescape(encodeURIComponent(str)));
  return base64.replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

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

  const loginMock = useCallback((provider: "google" | "github", name: string, email: string) => {
    const header = base64urlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
    const payloadObj = {
      sub: `${provider}|${Math.floor(Math.random() * 1000000)}`,
      name,
      email,
      picture: provider === "github" 
        ? `https://github.com/${email.split("@")[0]}.png` 
        : `https://api.dicebear.com/7.x/adventurer/svg?seed=${name}`,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 86400,
    };
    const payload = base64urlEncode(JSON.stringify(payloadObj));
    const mockToken = `${header}.${payload}.mockSignature`;
    
    setStoredToken(mockToken);
    setToken(mockToken);
    setError(null);
  }, []);

  const user = useMemo(() => {
    if (!token) return null;
    const payload = decodeJwtPayload(token);
    if (!payload) return null;
    return {
      name: typeof payload.name === "string" ? payload.name : undefined,
      email: typeof payload.email === "string" ? payload.email : undefined,
      picture: typeof payload.picture === "string" ? payload.picture : undefined,
    };
  }, [token]);

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
    user,
    login,
    loginMock,
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
