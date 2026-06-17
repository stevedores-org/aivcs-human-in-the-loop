import type { RuntimeConfig } from "../config/runtime-config";
import { createOidcState, createPkcePair } from "./pkce";
import {
  consumeOidcState,
  consumePkceVerifier,
  setStoredToken,
  storeOidcState,
  storePkceVerifier,
} from "./storage";

type OidcDiscovery = {
  authorization_endpoint: string;
  token_endpoint: string;
};

const discoveryCache = new Map<string, OidcDiscovery>();

async function fetchDiscovery(issuer: string): Promise<OidcDiscovery> {
  const cached = discoveryCache.get(issuer);
  if (cached) return cached;

  const normalizedIssuer = issuer.replace(/\/+$/, "");
  try {
    const response = await fetch(`${normalizedIssuer}/.well-known/openid-configuration`);
    if (response.ok) {
      const doc = (await response.json()) as OidcDiscovery;
      discoveryCache.set(issuer, doc);
      return doc;
    }
  } catch {
    // Fall back to conventional paths below.
  }

  const fallback = {
    authorization_endpoint: `${normalizedIssuer}/authorize`,
    token_endpoint: `${normalizedIssuer}/token`,
  };
  discoveryCache.set(issuer, fallback);
  return fallback;
}

function redirectUri(): string {
  return `${window.location.origin}/auth/callback`;
}

export async function beginOidcLogin(config: RuntimeConfig): Promise<void> {
  const discovery = await fetchDiscovery(config.ssoIssuer);
  const { verifier, challenge } = await createPkcePair();
  const state = createOidcState();

  storePkceVerifier(verifier);
  storeOidcState(state);

  const params = new URLSearchParams({
    client_id: config.oauthClientId,
    redirect_uri: redirectUri(),
    response_type: "code",
    scope: "openid profile email",
    state,
    code_challenge: challenge,
    code_challenge_method: "S256",
  });

  window.location.assign(`${discovery.authorization_endpoint}?${params.toString()}`);
}

export async function completeOidcLogin(
  config: RuntimeConfig,
  code: string,
  state: string,
): Promise<string> {
  if (!consumeOidcState(state)) {
    throw new Error("Invalid OAuth state");
  }

  const verifier = consumePkceVerifier();
  if (!verifier) {
    throw new Error("Missing PKCE verifier");
  }

  const discovery = await fetchDiscovery(config.ssoIssuer);
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: config.oauthClientId,
    code,
    redirect_uri: redirectUri(),
    code_verifier: verifier,
  });

  const response = await fetch(discovery.token_endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => response.statusText);
    throw new Error(`Token exchange failed: ${detail}`);
  }

  const payload = (await response.json()) as {
    access_token?: string;
    id_token?: string;
  };

  const token = payload.id_token ?? payload.access_token;
  if (!token) {
    throw new Error("Token response missing id_token/access_token");
  }

  setStoredToken(token);
  return token;
}

export function isAuthCallbackPath(): boolean {
  return window.location.pathname === "/auth/callback";
}

export function clearAuthCallbackFromHistory(): void {
  window.history.replaceState({}, "", "/");
}
