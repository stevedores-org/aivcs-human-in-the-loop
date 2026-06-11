# CLAUDE.md — `stevedores-org/aivcs-human-in-the-loop`

The authoritative agent contract is [`AGENTS.md`](./AGENTS.md). Read it
first.

## Claude Code specifics

- **PR base:** `develop`. Always. Never `main`.
- **Validation:** run `local-ci` before every push. Fallback:
  `bun run tsc --noEmit && bun run eslint . && bun test && bun run build`.
- **No `Dockerfile`.** Per Epic #2, this repo builds OCI images via
  `dockworker.ai`. Do not create, restore, or recommend a `Dockerfile`.
- **No secrets in git.** ESO + GCP Secret Manager only. `gitleaks` is
  wired into both pre-push and CI.
- **Conventional Commits.** PR title must match
  `type(scope?): description`; the squash merge uses the PR title as the
  commit message.
- **No emojis** in manifests, code, or commit messages.
- **High-blast-radius actions** — pause and confirm with the user before
  proceeding:
  - Force-pushes to `develop` or `main`
  - Bootstrap of branch protection (`scripts/bootstrap-branch-protection.sh`)
  - Any direct Cloudflare / GCP API mutation outside Crossplane / Flux

## Task shorthand (same as upstream `data-fabric` + `infra-code`)

| | |
|---|---|
| `crr` | code review requested — findings-first, severity-ordered HIGH/MEDIUM/LOW |
| `acr` | address code review feedback in the target PR |
| `ffc` | fix failing checks in the target PR |
| `fmc` | fix merge conflicts in the target PR |
| `btf` | build the requested feature end-to-end and open a PR |
| `sm`  | squash-merge when approved with no follow-up changes needed |
