# Agent operating contract — `stevedores-org/aivcs-human-in-the-loop`

> Read this end-to-end before any change. It governs every autonomous and
> assisted edit to this repository.

## 1. What this repo is

The aivcs human-in-the-loop UI: a TypeScript + React + Vite single-page app
that gives humans a visual window into the agent-driven VCS (branches, PR
diffs, agent intent threads, CI checks, audit trail). The UI talks to a
forthcoming `stevedores-org/aivcs-api` (Hono on Cloudflare Workers) which
fronts `lornu-ai/lornu-ai-data-fabric`.

Tracker: [#2 — Epic: stand up aivcs-human-in-the-loop](https://github.com/stevedores-org/aivcs-human-in-the-loop/issues/2).

## 2. Canonical stack

The approved stack for this repository. Do not introduce alternatives
without an ADR.

| Layer | Tool |
|-------|------|
| Language | **TypeScript** |
| Runtime / package manager / bundler / test runner | **Bun** |
| Framework | **React** + **Vite** |
| Container images | **dockworker.ai** — **never `Dockerfile`** |
| Kubernetes delivery | **Kustomize** overlays + **Flux** + **ESO** + **OIDC** |
| Pre-push validation | **stevedores-org/local-ci** |
| Secret scanning | **gitleaks** (pinned binary) |

**Implications:**

- **No Dockerfile.** Per Epic #2 and the org standard, OCI images are
  produced by `dockworker.ai` from a `dockworker.toml`. Never add,
  restore, or recommend `Dockerfile` / `docker build` / `docker buildx`.
- **Bun only.** No `npm`, `pnpm`, `yarn`, or raw `node` invocations.
  Lockfile is `bun.lockb`.
- **No Helm.** Workload delivery is Kustomize overlays under
  `k8s/{base,overlays/dev,overlays/prod}` (lands in Step C / #6).

## 3. Hard rules

| # | Rule | Why |
|---|---|---|
| 1 | **No secrets in git.** Ever. ESO + GCP Secret Manager only; `.gitleaks.toml` enforces it. | History rewrites are expensive; org gate. |
| 2 | **Every PR bases on `develop`.** Never `main`. | Org standard: `develop → staging → main`. |
| 3 | **No `Dockerfile`.** Per Epic #2 and the lornu-ai / stevedores-org standard, images come from `dockworker.ai`. | Hermetic builds + supply-chain hygiene. |
| 4 | **Pre-push: `local-ci`.** Configuration in [`.local-ci.toml`](.local-ci.toml). Fallback only when `local-ci` is unavailable. | Canonical pre-push gate. |
| 5 | **Conventional Commits.** PR titles must match `type(scope?): description`; the squash merge uses the PR title as the commit message. Enforced by `.github/workflows/pr-title.yml`. | Keeps `git log --oneline` scannable; gates the release-notes generator. |
| 6 | **No long-lived cloud tokens.** OIDC (GH Actions → GCP / Cloudflare) only. | Token sprawl is the #1 audit finding. |
| 7 | **No emojis** in manifests, code, or commit messages. | Diff noise; encoding gotchas. |

## 4. PR + branch workflow

- Base branch is always `develop`.
- Open PRs in small, atomic increments. Open as **DRAFT** while the work is
  in flight; flip to ready-for-review when `local-ci` is green.
- Conventional-Commits PR titles. Allowed types:
  `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `perf`, `ci`,
  `build`, `revert`. Optional scope: `(ui)`, `(ci)`, `(k8s)`,
  `(docs)`, `(deps)`, …
- Task shorthand (same as upstream `data-fabric` + `infra-code`):
  - `crr` — code review requested
  - `acr` — address CR feedback
  - `ffc` — fix failing checks
  - `fmc` — fix merge conflicts
  - `btf` — build the feature, open a PR
  - `sm`  — squash-merge when approved with no follow-up

## 5. Pre-push validation (MANDATORY)

**Run `local-ci` before pushing any PR.** This is the canonical pre-push
gate for every contributor and every coding agent that touches this repo.
Configuration lives in [`.local-ci.toml`](.local-ci.toml); the binary
comes from [stevedores-org/local-ci](https://github.com/stevedores-org/local-ci).

```bash
local-ci             # run all enabled stages from .local-ci.toml
local-ci typecheck   # run a single stage
local-ci --no-cache  # bust the .local-ci-cache/ and re-run everything
```

Stages defined in `.local-ci.toml`:

1. `typecheck` — `bun run tsc --noEmit`
2. `lint` — `bun run eslint .`
3. `test` — `bun test`
4. `build` — `bun run build`
5. `gitleaks` — pinned `gitleaks detect --no-banner --redact`

**The rule:** if `local-ci` is red, do not push. Either fix the failure or,
with a documented reason, `--skip` the stage. Do not push a known-red PR
expecting GitHub CI to surface the same failure — that wastes reviewer time
and burns CI minutes on issues catchable in seconds locally.

**This rule applies equally to humans and to coding agents** (Claude,
Codex, Cursor, Copilot, Jules, Antigravity).

### Fallback (only when `local-ci` is unavailable)

```bash
bun run tsc --noEmit && bun run eslint . && bun test && bun run build
gitleaks detect --no-banner --redact
```

## 6. Validation gates (what CI runs)

1. `gitleaks detect --no-banner --redact` — no secrets in the diff or
   history. Allowlist in [`.gitleaks.toml`](.gitleaks.toml).
2. `bun run tsc --noEmit` — type-check clean.
3. `bun run eslint .` — lint clean.
4. `bun test` — Bun test runner.
5. `bun run build` — production bundle builds.

A single `local-ci` job in [`.github/workflows/ci.yml`](.github/workflows/ci.yml)
runs the same stages CI runs locally. Conventional-Commits PR-title
enforcement runs in [`.github/workflows/pr-title.yml`](.github/workflows/pr-title.yml).

## 7. The forward-compat note (Step A hasn't landed)

This file ships **before** the Figma scaffold (#4). When `package.json`,
`tsconfig.json`, `eslint.config.{js,ts}`, and `bun.lockb` land in #4, the
`local-ci` stages above start passing in real terms. Until then, the local
runner is expected to skip stages whose inputs are missing (the dependency
checks in `.local-ci.toml` handle this).

## 8. References

- Epic: [#2](https://github.com/stevedores-org/aivcs-human-in-the-loop/issues/2)
- Step A (scaffold): [#4](https://github.com/stevedores-org/aivcs-human-in-the-loop/issues/4)
- Step B (this PR): [#5](https://github.com/stevedores-org/aivcs-human-in-the-loop/issues/5)
- Step C (OCI + k8s): [#6](https://github.com/stevedores-org/aivcs-human-in-the-loop/issues/6)
- Pattern source: [`stevedores-org/agent-scheduler`](https://github.com/stevedores-org/agent-scheduler),
  [`lornu-ai/lornu-ai-data-fabric`](https://github.com/lornu-ai/lornu-ai-data-fabric).
- Backend (forthcoming): `stevedores-org/aivcs-api` (#7).
- Data fabric: [`lornu-ai/lornu-ai-data-fabric`](https://github.com/lornu-ai/lornu-ai-data-fabric).
