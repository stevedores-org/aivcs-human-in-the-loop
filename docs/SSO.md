# SSO setup — AIVCS HITL

OAuth client: **`aivcs-hitl`**

## Redirect URIs (register on SSO provider)

| Environment | Redirect URI |
|-------------|--------------|
| Prod | `https://human.aivcs.io/auth/callback` |
| Dev | `https://human-dev.aivcs.io/auth/callback` |
| Local | `http://localhost:5173/auth/callback` |

## Issuers

| Environment | `SSO_ISSUER` |
|-------------|--------------|
| Prod | `https://auth.aivcs.io` |
| Dev | `https://auth-dev.aivcs.io` |
| Local / legacy | `https://auth.lornu.ai` |

## Runtime config (container env → `/config.json`)

| Variable | Example | Purpose |
|----------|---------|---------|
| `AIVCS_API_URL` | `https://api.aivcs.io` | Backend API base |
| `SSO_ISSUER` | `https://auth.aivcs.io` | OIDC discovery root |
| `OAUTH_CLIENT_ID` | `aivcs-hitl` | PKCE client id |
| `REQUIRE_AUTH` | `true` | Show login gate |
| `USE_MOCKS` | `false` | Use live API hooks |
| `DEMO_MODE` | `false` | Hide demo banner |

## Verify after deploy

```bash
curl -sS https://human-dev.aivcs.io/config.json | jq .
# expect apiUrl, requireAuth, useMocks

# OIDC discovery (when auth host is reachable)
curl -sS https://auth-dev.aivcs.io/.well-known/openid-configuration | jq .authorization_endpoint
```

## Cloudflare Access (FR-1.3)

`human.aivcs.io` may sit behind Cloudflare Access in addition to app-level OIDC.
Register the redirect URIs on the **OIDC worker** (`auth.aivcs.io`), not only Access policies.
