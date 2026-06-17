const JWT_STORAGE_KEY = "aivcs_jwt";
const PKCE_VERIFIER_KEY = "aivcs_pkce_verifier";
const OIDC_STATE_KEY = "aivcs_oidc_state";

export function getStoredToken(): string | null {
  return localStorage.getItem(JWT_STORAGE_KEY);
}

export function setStoredToken(token: string): void {
  localStorage.setItem(JWT_STORAGE_KEY, token);
}

export function clearStoredToken(): void {
  localStorage.removeItem(JWT_STORAGE_KEY);
}

export function storePkceVerifier(verifier: string): void {
  sessionStorage.setItem(PKCE_VERIFIER_KEY, verifier);
}

export function consumePkceVerifier(): string | null {
  const value = sessionStorage.getItem(PKCE_VERIFIER_KEY);
  sessionStorage.removeItem(PKCE_VERIFIER_KEY);
  return value;
}

export function storeOidcState(state: string): void {
  sessionStorage.setItem(OIDC_STATE_KEY, state);
}

export function consumeOidcState(expected: string): boolean {
  const value = sessionStorage.getItem(OIDC_STATE_KEY);
  sessionStorage.removeItem(OIDC_STATE_KEY);
  return value === expected;
}

export function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split(".");
  if (parts.length < 2) return null;
  try {
    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = payload.padEnd(payload.length + ((4 - (payload.length % 4)) % 4), "=");
    return JSON.parse(atob(padded)) as Record<string, unknown>;
  } catch {
    return null;
  }
}
