export type RuntimeConfig = {
  apiUrl: string;
  ssoIssuer: string;
  oauthClientId: string;
  useMocks: boolean;
  requireAuth: boolean;
  demoMode: boolean;
};

let cachedConfig: RuntimeConfig | null = null;
let loadPromise: Promise<RuntimeConfig> | null = null;

function parseBool(value: unknown, fallback = false): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    return value === "1" || value.toLowerCase() === "true";
  }
  return fallback;
}

function configFromEnv(): RuntimeConfig | null {
  const apiUrl = import.meta.env.VITE_AIVCS_API_URL as string | undefined;
  if (!apiUrl) return null;

  return {
    apiUrl,
    ssoIssuer: (import.meta.env.VITE_SSO_ISSUER as string | undefined) ?? "https://auth.lornu.ai",
    oauthClientId: (import.meta.env.VITE_OAUTH_CLIENT_ID as string | undefined) ?? "aivcs-hitl",
    useMocks: parseBool(import.meta.env.VITE_USE_MOCKS),
    requireAuth: parseBool(import.meta.env.VITE_REQUIRE_AUTH),
    demoMode: parseBool(import.meta.env.VITE_DEMO_MODE ?? import.meta.env.VITE_USE_MOCKS),
  };
}

function configFromHostname(): RuntimeConfig {
  const host = typeof window !== "undefined" ? window.location.hostname : "localhost";

  if (host === "human.aivcs.io" || host === "www.aivcs.io") {
    return {
      apiUrl: "https://api.aivcs.io",
      ssoIssuer: "https://auth.aivcs.io",
      oauthClientId: "aivcs-hitl",
      useMocks: false,
      requireAuth: true,
      demoMode: false,
    };
  }

  if (host === "human-dev.aivcs.io") {
    return {
      apiUrl: "https://api-dev.aivcs.io",
      ssoIssuer: "https://auth-dev.aivcs.io",
      oauthClientId: "aivcs-hitl",
      useMocks: false,
      requireAuth: true,
      demoMode: false,
    };
  }

  if (host === "preview.aivcs.io" || host === "demo.aivcs.io" || host === "future.aivcs.io") {
    return {
      apiUrl: "https://api-dev.aivcs.io",
      ssoIssuer: "https://auth-dev.aivcs.io",
      oauthClientId: "aivcs-hitl",
      useMocks: true,
      requireAuth: true,
      demoMode: true,
    };
  }

  if (host === "localhost" || host === "127.0.0.1") {
    return {
      apiUrl: "http://localhost:3000",
      ssoIssuer: "https://auth.lornu.ai",
      oauthClientId: "aivcs-hitl",
      useMocks: true,
      requireAuth: false,
      demoMode: true,
    };
  }

  return {
    apiUrl: "https://api-dev.aivcs.io",
    ssoIssuer: "https://auth-dev.aivcs.io",
    oauthClientId: "aivcs-hitl",
    useMocks: true,
    requireAuth: false,
    demoMode: true,
  };
}

function normalizeConfig(raw: Record<string, unknown>): RuntimeConfig {
  return {
    apiUrl: String(raw.apiUrl ?? raw.api_url ?? ""),
    ssoIssuer: String(raw.ssoIssuer ?? raw.sso_issuer ?? "https://auth.lornu.ai"),
    oauthClientId: String(raw.oauthClientId ?? raw.oauth_client_id ?? "aivcs-hitl"),
    useMocks: parseBool(raw.useMocks ?? raw.use_mocks),
    requireAuth: parseBool(raw.requireAuth ?? raw.require_auth),
    demoMode: parseBool(raw.demoMode ?? raw.demo_mode ?? raw.useMocks ?? raw.use_mocks),
  };
}

export async function loadRuntimeConfig(): Promise<RuntimeConfig> {
  if (cachedConfig) return cachedConfig;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    try {
      const response = await fetch("/config.json", { cache: "no-store" });
      if (response.ok) {
        const raw = (await response.json()) as Record<string, unknown>;
        cachedConfig = normalizeConfig(raw);
        return cachedConfig;
      }
    } catch {
      // Fall through to build-time / hostname defaults.
    }

    cachedConfig = configFromEnv() ?? configFromHostname();
    return cachedConfig;
  })();

  return loadPromise;
}

export function getRuntimeConfig(): RuntimeConfig | null {
  return cachedConfig;
}

export function setRuntimeConfig(config: RuntimeConfig): void {
  cachedConfig = config;
}
