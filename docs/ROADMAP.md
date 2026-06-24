# Epic #34 — AIVCS HITL UI roadmap

## Phase 0 — Make prod honest

- [x] FR-0.1 Runtime `/config.json` from container env (`scripts/caddy-entrypoint.sh`)
- [x] FR-0.2 API URL → `https://api.aivcs.io` (runtime config + k8s overlay)
- [x] FR-0.3 Demo mode banner when `demoMode` / `useMocks`

## Phase 1 — SSO login

- [x] FR-1.1 OIDC PKCE via configurable SSO issuer (`src/lib/auth/oidc.ts`)
- [x] FR-1.2 Login gate + 401 handling (`LoginGate`, `apiFetch` → logout)
- [ ] FR-1.3 Cloudflare Access on `www.aivcs.io` (infra — `human.aivcs.io` already 401)

## Phase 2 — Wire real data (#35)

- [ ] FR-2.1 Branch → PR selection model
- [ ] FR-2.2 Live panels (diff, intent, CI, audit)
- [ ] FR-2.3 Stat cards from API
- [ ] FR-2.4 PR approve/merge/flag actions

## Phase 3 — Product polish (#36)

- [x] FR-3.1 Routing (`/reviews`, `/agents`, …)
- [x] FR-3.2 Search
- [x] FR-3.3 Real-time updates
- [x] FR-3.4 Multi-workspace
- [x] FR-3.5 Merge queue view
